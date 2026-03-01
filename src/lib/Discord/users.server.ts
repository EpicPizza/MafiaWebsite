import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { env } from "$env/dynamic/private";
import type { Instance } from "./instance.server";

export interface User {
    id: string,
    nickname: string,
    lName: string,
    pronouns: string | null,
    channel: string | null,
    state: number,
}

export type CompleteUser = Awaited<ReturnType<typeof getUser>>;

const roleCache = new Map<string, { roles: any[], timestamp: number }>();
async function getGuildRoles(guildId: string): Promise<any[]> {
    const cached = roleCache.get(guildId);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 5)) return cached.roles;

    const roles = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    }).then(res => res.ok ? res.json() : []).catch(() => []);

    if (roles.length > 0) roleCache.set(guildId, { roles, timestamp: Date.now() });
    return roles;
}

function getDefaultAvatar(id: string) {
    try {
        const index = Number((BigInt(id) >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    } catch {
        return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
}

const membersCache = new Map<string, { members: Map<string, any>, timestamp: number }>();
let guildMembersPromise = new Map<string, Promise<Map<string, any>>>();

async function getGuildMembers(guildId: string): Promise<Map<string, any>> {
    const cached = membersCache.get(guildId);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 5)) return cached.members;

    if (!guildMembersPromise.has(guildId)) {
        const promise = (async () => {
            const list = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
                headers: { Authorization: `Bot ${env.TOKEN}` }
            }).then(res => res.ok ? res.json() : []).catch(() => []);

            const map = new Map<string, any>();
            for (const m of list) if (m.user) map.set(m.user.id, m);
            membersCache.set(guildId, { members: map, timestamp: Date.now() });
            return map;
        })();
        guildMembersPromise.set(guildId, promise);
        promise.finally(() => guildMembersPromise.delete(guildId));
    }

    return guildMembersPromise.get(guildId)!;
}

const individualCache = new Map<string, { user: any, timestamp: number }>();
async function fetchSingleMember(guildId: string, id: string): Promise<any> {
    const key = `${guildId}-${id}`;
    const cached = individualCache.get(key);
    if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 5)) return cached.user;

    let res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    });
    if (res.status === 429) {
        const body = await res.json();
        await new Promise(r => setTimeout(r, (body.retry_after * 1000) + 50));
        res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${id}`, {
            headers: { Authorization: `Bot ${env.TOKEN}` }
        });
    }
    const user = res.ok ? await res.json() : undefined;
    if (user && !user.message) {
        individualCache.set(key, { user, timestamp: Date.now() });
    }
    return user;
}

export async function getUser(instance: Instance, id: string, failProof: boolean = false, allProof: boolean = false) {
    const allMembers = await getGuildMembers(instance.setup.primary.guild.id);
    let discordUser = allMembers.get(id);
    if (!discordUser) discordUser = await fetchSingleMember(instance.setup.primary.guild.id, id);

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('users').doc(id);
    const data = (await ref.get()).data();
    const databaseUser = data && data.nickname ? data as User : undefined;

    let userColor = "#ffffff";
    if (discordUser && discordUser.roles && discordUser.roles.length > 0) {
        const roles = await getGuildRoles(instance.setup.primary.guild.id);
        const memberRoles = roles.filter((r: any) => discordUser.roles.includes(r.id) && r.color !== 0);
        if (memberRoles.length > 0) {
            memberRoles.sort((a: any, b: any) => b.position - a.position);
            userColor = "#" + memberRoles[0].color.toString(16).padStart(6, '0');
        }
    }

    console.log(databaseUser, discordUser, id);

    if (databaseUser != undefined && discordUser != undefined) {
        return {
            ...databaseUser,
            color: userColor,
            pfp: discordUser.avatar ? `https://cdn.discordapp.com/guilds/${instance.setup.primary.guild.id}/users/${id}/avatars/${discordUser.avatar}.webp?size=160` : (discordUser.user.avatar ? `https://cdn.discordapp.com/avatars/${id}/${discordUser.user.avatar}.webp?size=160` : getDefaultAvatar(id))
        }
    } else if (databaseUser != undefined && discordUser == undefined && failProof) {
        return {
            ...databaseUser,
            color: "#ffffff",
            pfp: getDefaultAvatar(id),
        }
    } else if (databaseUser == undefined && discordUser != undefined && allProof) {
        const nickname = discordUser.nick ?? discordUser.user.global_name ?? discordUser.user.username;
        return {
            id: discordUser.user.id,
            nickname: nickname,
            lName: nickname.toLowerCase(),
            pronouns: null,
            channel: null,
            state: 0,
            color: userColor,
            pfp: discordUser.avatar ? `https://cdn.discordapp.com/guilds/${instance.setup.primary.guild.id}/users/${id}/avatars/${discordUser.avatar}.webp?size=160` : (discordUser.user.avatar ? `https://cdn.discordapp.com/avatars/${id}/${discordUser.user.avatar}.webp?size=160` : getDefaultAvatar(id))
        }
    } else if (allProof) {
        return {
            id: id,
            nickname: id,
            lName: id.toLowerCase(),
            pronouns: null,
            channel: null,
            state: 0,
            color: "#ffffff",
            pfp: getDefaultAvatar(id)
        }
    } else {
        throw new Error("User not found!");
    }
}

export async function getUsers(instance: Instance, ids: string[], failProof: boolean = false, allProof: boolean = false) {
    const promises = [] as Promise<CompleteUser>[];

    for (let i = 0; i < ids.length; i++) {
        promises.push(getUser(instance, ids[i], failProof, allProof));
    }

    const users = await Promise.all(promises);

    return users;
}