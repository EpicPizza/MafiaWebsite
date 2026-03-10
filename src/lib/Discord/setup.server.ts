import { z } from "zod";
import { firebaseAdmin } from "../Firebase/firebase.server";
import { env } from "$env/dynamic/private";

const PartialSetup = z.object({
    primary: z.object({
        guild: z.string().nullable(),
        gang: z.string().nullable(),
        alive: z.string().nullable(),
        mod: z.string().nullable(),
        chat: z.string().nullable(),
    }),
    secondary: z.object({
        guild: z.string().nullable(),
        mod: z.string().nullable(),
        spec: z.string().nullable(),
        dms: z.string().nullable(),
        archivedDms: z.string().nullable(),
        ongoing: z.string().nullable(),
        archive: z.string().nullable(),
        access: z.string().nullable(),
        logs: z.string().nullable(),
    }),
    tertiary: z.object({
        guild: z.string().nullable(),
        mod: z.string().nullable(),
        spec: z.string().nullable(),
        access: z.string().nullable(),
        ongoing: z.string().nullable(),
        archive: z.string().nullable(),
    })
})

export async function getPartialSetup(instance: string | undefined = undefined) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance ? instance : process.env.INSTANCE ?? "---").collection('settings').doc('setup');

    const data = (await ref.get()).data();

    const setup = PartialSetup.safeParse(data);

    if (!data || !setup.success) throw new Error("Database not setup.");

    return setup.data;
}

export type Setup = Exclude<Awaited<ReturnType<typeof checkSetup>>, string>;

const cache = new Map<string, { promise: Promise<Setup>, timestamp: number }>();

export async function getSetup(instance: string | undefined = undefined, admin: typeof firebaseAdmin | undefined = undefined) {
    const instanceId = instance ? instance : process.env.INSTANCE ?? "---";
    const now = Date.now();
    
    const cached = cache.get(instanceId);

    if (cached) {
        const isStale = (now - cached.timestamp) >= (1000 * 60 * 5);
        
        if (isStale) {
            // Update timestamp immediately to prevent multiple background refreshes
            cached.timestamp = now;

            (async () => {
                try {
                    const result = await checkSetup(instance, admin);
                    if (typeof result !== 'string') {
                        cache.set(instanceId, { 
                            promise: Promise.resolve(result), 
                            timestamp: Date.now() 
                        });
                    }
                } catch (e) {
                    // Ignore background refresh errors; stale data will be used/retried later
                }
            })();
        }
        
        return cached.promise;
    }

    // Initial fetch for a new instance (must wait)
    const promise = (async () => {
        const setup = await checkSetup(instance, admin);

        if (typeof setup == 'string') {
            throw new Error("Setup Incomplete");
        } else {
            return setup;
        }
    })();

    cache.set(instanceId, { promise, timestamp: now });

    // Remove from cache if the initial fetch fails so it can be retried properly
    promise.catch(() => {
        const current = cache.get(instanceId);
        if (current && current.promise === promise) {
            cache.delete(instanceId);
        }
    });

    return promise;
}

export function clearSetupCache(instance: string | undefined = undefined) {
    if (instance === undefined) {
        cache.clear();
    } else {
        cache.delete(instance);
    }
}

export async function checkSetup(instance: string | undefined = undefined, admin: typeof firebaseAdmin | undefined = undefined) {
    const db = admin ? admin.getFirestore() : firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance ? instance : process.env.INSTANCE ?? "---").collection('settings').doc('setup')

    const data = (await ref.get()).data();

    const parse = PartialSetup.safeParse(data);

    if (!data || !parse.success) throw new Error("Database not setup.");

    const setup = parse.data;

    const primary = fetchGuild(setup.primary.guild, "Primary server");
    const secondary = fetchGuild(setup.secondary.guild, "Secondary server");
    const tertiary = fetchGuild(setup.tertiary.guild, "Tertiary server");

    const alive = fetchRole(setup.primary.alive, setup.primary.guild, "Primary alive role");
    const primaryMod = fetchRole(setup.primary.mod, setup.primary.guild, "Primary mod role");
    const gang = fetchRole(setup.primary.gang, setup.primary.guild, "Primary gang role");
    const chat = fetchChannel(setup.primary.chat, setup.primary.guild, "Primary chat channel");

    const secondaryMod = fetchRole(setup.secondary.mod, setup.secondary.guild, "Secondary mod role");
    const secondarySpec = fetchRole(setup.secondary.spec, setup.secondary.guild, "Secondary spec role");
    const dms = fetchCategory(setup.secondary.dms, setup.secondary.guild, "Secondary dms category");
    const archivedDms = fetchCategory(setup.secondary.archivedDms, setup.secondary.guild, "Secondary archived dms category");
    const seocndaryOngoing = fetchCategory(setup.secondary.ongoing, setup.secondary.guild, "Secondary ongoing category");
    const secondaryArchive = fetchCategory(setup.secondary.archive, setup.secondary.guild, "Secondary archive category");
    const secondaryAccess = fetchRole(setup.secondary.access, setup.secondary.guild, "Secondary access role");
    const logs = fetchChannel(setup.secondary.logs, setup.secondary.guild, "Secondary logs channel");

    const tertiaryMod = fetchRole(setup.tertiary.mod, setup.tertiary.guild, "Tertiary mod role");
    const tertiarySpec = fetchRole(setup.tertiary.spec, setup.tertiary.guild, "Tertiary spec role");
    const tertiaryOngoing = fetchCategory(setup.tertiary.ongoing, setup.tertiary.guild, "Tertiary ongoing category");
    const tertiaryArchive = fetchCategory(setup.tertiary.archive, setup.tertiary.guild, "Tertiary archive category");
    const tertiaryAccess = fetchRole(setup.tertiary.access, setup.tertiary.guild, "Tertiary access role");

    const results = await Promise.allSettled([primary, secondary, tertiary, alive, primaryMod, gang, chat, secondaryMod, secondarySpec, dms, archivedDms, seocndaryOngoing, secondaryArchive, tertiaryMod, tertiarySpec, tertiaryOngoing, tertiaryArchive, tertiaryAccess, secondaryAccess, logs]);

    const fails = results.filter(result => result.status == "rejected");

    if (fails.length > 0) {
        return fails.reduce<string>((accum, current) => accum + (current as unknown as PromiseRejectedResult).reason + "\n", "");
    }

    return {
        primary: {
            guild: await primary,
            alive: await alive,
            mod: await primaryMod,
            gang: await gang,
            chat: await chat,
        },
        secondary: {
            guild: await secondary,
            mod: await secondaryMod,
            spec: await secondarySpec,
            dms: await dms,
            archivedDms: await archivedDms,
            ongoing: await seocndaryOngoing,
            archive: await secondaryArchive,
            access: await secondaryAccess,
            logs: await logs,
        },
        tertiary: {
            guild: await tertiary,
            mod: await tertiaryMod,
            spec: await tertiarySpec,
            ongoing: await tertiaryOngoing,
            archive: await tertiaryArchive,
            access: await tertiaryAccess,
        }
    }
}

export async function fetchGuild(id: string | null, name: string) {
    if (id == null) return Promise.reject(name + " not specified");

    const res = await fetch(`https://discord.com/api/v10/guilds/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    });

    if (!res.ok) return Promise.reject(name + " not found");

    return { id };
}

export async function fetchChannel(id: string | null, guildId: string | null, name: string) {
    if (id == null || guildId == null) return Promise.reject(name + " not specified");

    const res = await fetch(`https://discord.com/api/v10/channels/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    });

    if (!res.ok) return Promise.reject(name + " not found");

    return { id };
}

export async function fetchCategory(id: string | null, guildId: string | null, name: string) {
    if (id == null || guildId == null) return Promise.reject(name + " not specified");

    const res = await fetch(`https://discord.com/api/v10/channels/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    });

    if (!res.ok) return Promise.reject(name + " not found");

    return { id };
}

export async function fetchRole(id: string | null, guildId: string | null, name: string) {
    if (id == null || guildId == null) return Promise.reject(name + " not specified");

    // We used to fetch roles and check if it exists, here we can just trust it exists to save API calls
    // Or we can request the guild roles if we want to be strict.
    // For cold boot performance, we just return the ID if the guild exists, but maybe we can just return the ID directly to be faster?
    // Let's do a quick guild fetch to verify the guild exists at least, but we don't need to fetch all roles.

    return { id };
}