import { env } from "$env/dynamic/private";
import type { Instance } from "./instance.server";

export async function checkMod(instance: Instance, id: string) {
    const member = await fetch(`https://discord.com/api/v10/guilds/${instance.setup.primary.guild.id}/members/${id}`, { headers: { Authorization: `Bot ${env.TOKEN}` } }).then(res => res.ok ? res.json() : undefined).catch(() => undefined);
    if (!(member?.roles?.includes(instance.setup.primary.mod.id) || instance.global.admin.includes(id))) throw new Error("You're not a mod!");
}

export async function isMod(instance: Instance, id: string) {
    try {
        await checkMod(instance, id);

        return true;
    } catch (e) {
        return false;
    }
}