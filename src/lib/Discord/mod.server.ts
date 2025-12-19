import type { Instance } from "./instance.server";

export async function checkMod(instance: Instance, id: string) {
    const member = await instance.setup.primary.guild.members.fetch(id);
    if(!(member?.roles.cache.has(instance.setup.primary.mod.id) || instance.global.admin.includes(id))) throw new Error("You're not a mod!");
}

export async function isMod(instance: Instance, id: string) {
    try {
        await checkMod(instance, id);

        return true;
    } catch(e) {
        return false;
    }
}