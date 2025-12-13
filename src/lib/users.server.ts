import { env } from '$env/dynamic/private';
import { firebaseAdmin } from "./Firebase/firebase.server";

export async function getUser(id: string): Promise<User | undefined> {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').doc(id);

    const doc = await ref.get();

    const data = doc.data();

    if(!doc.exists || doc.data()?.nickname == null) {
        return undefined;
    } else if(data) {
        return data as User;
    }
}

export async function getUsers(game: Game) {
    const users = new Map() as Map<string, User>;

    for(let i = 0; i < game.signups.length; i++) {
        const user = await getUser(game.signups[i]);

        if(user == null) throw new Error("User not registered.");

        users.set(user.id, user);
    }

    return users;
}

export interface Game { 
    name: string, 
    signups: string[], 
    id: string,
    closed: boolean,
    message: {
        id: string,
    } | null,
    channels: {
        spec: string,
        mafia: string,
    }
}

export async function getGameByID(id: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(env.INSTANCE ?? "---").collection('settings').doc('game').collection('games').doc(id);

    const doc = (await ref.get());

    if(doc.data() == undefined) throw new Error("Game not found in database.");

    return { ... doc.data(), id: doc.id } as Game;
}

export interface User {
    id: string,
    nickname: string,
    emoji: string | false,
    settings: {
        auto_confirm: false,
    },
    channel: string | null;
}