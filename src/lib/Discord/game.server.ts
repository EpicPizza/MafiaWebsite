import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { Instance } from "./instance.server";

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
    confirmations: string[],
    mods?: string[],
}

export async function getGameByID(instance: Instance, id: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance.id).collection('settings').doc('game').collection('games').doc(id);

    console.log(id)

    const doc = (await ref.get());

    if(doc.data() == undefined) throw new Error("Game not found in database.");

    return { ... doc.data(), id: doc.id } as Game;
}
