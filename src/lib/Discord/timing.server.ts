import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { Instance } from "./instance.server";

// A game's scheduled lock/unlock (the bot keeps one per game).
export async function getFuture(instance: Instance, gameId: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance.id).collection('games').doc(gameId).collection('state').doc("lock");

    const data = (await ref.get()).data();

    if(!data || data.when == null) return undefined;

    return { 
        when: data.when.toDate() as Date,
        increment: data.increment as boolean,
        type: data.type as boolean,  
    }
}