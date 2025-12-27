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
    mods: [],
    days: number,
    alignments: string[],
    winners: string[],
    losers: string[],
    links: Link[],
    state: 'active' | 'completed' | 'counting' | 'canned',
    pinned: string | null,
}

type Link = DiscordLink | MaterialLink;

interface DiscordLink {
    type: 'Discord'
    channelName: string,
    label: string,
    url: string,
}

interface MaterialLink {
    type: 'Material',
    logo: 'Drive' | 'Slides' | 'Docs' | 'Sheets' | 'Custom',
    label: string,
    url: string,
}

export async function getGameByID(instance: Instance, id: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance.id).collection('games').doc(id);

    console.log(id)

    const doc = (await ref.get());

    if(doc.data() == undefined) throw new Error("Game not found in database.");

    return { ... doc.data(), id: doc.id } as Game;
}
