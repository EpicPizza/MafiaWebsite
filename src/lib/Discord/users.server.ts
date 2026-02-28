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

export async function getUser(instance: Instance, id: string, failProof: boolean = false, allProof: boolean = false) {
    const discordUser = await fetch(`https://discord.com/api/v10/guilds/${instance.setup.primary.guild.id}/members/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    }).then(res => res.ok ? res.json() : undefined).catch(() => undefined);

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('users').doc(id);
    const data = (await ref.get()).data();
    const databaseUser = data && data.nickname ? data as User : undefined;

    if (databaseUser != undefined && discordUser != undefined) {
        return {
            ...databaseUser,
            color: "#ffffff",
            pfp: discordUser.avatar ? `https://cdn.discordapp.com/guilds/${instance.setup.primary.guild.id}/users/${id}/avatars/${discordUser.avatar}.webp?size=160` : (discordUser.user.avatar ? `https://cdn.discordapp.com/avatars/${id}/${discordUser.user.avatar}.webp?size=160` : "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160")
        }
    } else if (databaseUser != undefined && discordUser == undefined && failProof) {
        return {
            ...databaseUser,
            color: "#ffffff",
            pfp: "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160",
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
            color: "#ffffff",
            pfp: discordUser.avatar ? `https://cdn.discordapp.com/guilds/${instance.setup.primary.guild.id}/users/${id}/avatars/${discordUser.avatar}.webp?size=160` : (discordUser.user.avatar ? `https://cdn.discordapp.com/avatars/${id}/${discordUser.user.avatar}.webp?size=160` : "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160")
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
            pfp: "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160"
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