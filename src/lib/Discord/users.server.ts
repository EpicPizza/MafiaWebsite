import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { User } from "$lib/users.server";
import client from "./client.server";
import type { Instance } from "./instance.server";

export type CompleteUser = Awaited<ReturnType<typeof getUser>>;

export async function getUser(instance: Instance, id: string) {
    const discordUser = await instance.setup.primary.guild.members.fetch({ user: id, cache: true }).catch(() => undefined);
    
    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('users').doc(id);
    const data = (await ref.get()).data();
    const databaseUser = data && data.nickname ? data as User : undefined;

    if(databaseUser == undefined || discordUser == undefined) throw new Error("User not found!")

    return {
        ...databaseUser,
        color: discordUser.displayHexColor,
        pfp: discordUser.avatarURL() ?? discordUser.displayAvatarURL() ?? client.user?.displayAvatarURL() ?? "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160"
    }
}

export async function getUsers(instance: Instance, ids: string[]) {
    const promises = [] as Promise<CompleteUser>[];

    for(let i = 0; i < ids.length; i++) {
        promises.push(getUser(instance, ids[i]));
    }

    const users = await Promise.all(promises);

    return users;
}