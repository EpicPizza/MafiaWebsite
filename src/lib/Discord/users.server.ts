import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import client from "./client.server";
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

export async function getUser(instance: Instance, id: string, failProof: boolean = false, allProof: boolean = false) {
    const discordUser = await instance.setup.primary.guild.members.fetch({ user: id, cache: true }).catch(() => undefined);
    
    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('users').doc(id);
    const data = (await ref.get()).data();
    const databaseUser = data && data.nickname ? data as User : undefined;

    if(databaseUser != undefined && discordUser != undefined) {
        return {
            ...databaseUser,
            color: discordUser.displayHexColor,
            pfp: discordUser.avatarURL() ?? discordUser.displayAvatarURL() ?? client.user?.displayAvatarURL() ?? "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160"
        }
    } else if(databaseUser != undefined && discordUser == undefined && failProof) {
        return {
            ...databaseUser,
            color: "#ffffff",
            pfp: client.user?.displayAvatarURL() ?? "",
        }
    } else if(databaseUser == undefined && discordUser != undefined && allProof) {
        return {
            id: discordUser.id,
            nickname: discordUser.nickname ?? discordUser.displayName,
            lName: (discordUser.nickname ?? discordUser.displayName).toLowerCase(),
            pronouns: null,
            channel: null,
            state: 0,
            color: discordUser.displayHexColor == "#000000" ? "#ffffff" : discordUser.displayHexColor,
            pfp: discordUser.avatarURL() ?? discordUser.displayAvatarURL() ?? client.user?.displayAvatarURL() ?? "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160"
        }
    } else if(allProof) {
        return {
            id: id,
            nickname: id,
            lName: id.toLowerCase(),
            pronouns: null,
            channel: null,
            state: 0,
            color: "#ffffff",
            pfp: client.user?.displayAvatarURL() ?? "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160"
        }
    } else {
        throw new Error("User not found!");
    }
}

export async function getUsers(instance: Instance, ids: string[], failProof: boolean = false, allProof: boolean = false) {
    const promises = [] as Promise<CompleteUser>[];

    for(let i = 0; i < ids.length; i++) {
        promises.push(getUser(instance, ids[i], failProof, allProof));
    }

    const users = await Promise.all(promises);

    return users;
}