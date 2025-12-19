import { Transaction } from "firebase-admin/firestore";
import { firebaseAdmin } from "../Firebase/firebase.server";
import { getSetup, type Setup } from "./setup.server";

export interface Instance {
    setup: Setup,
    global: Global,
    name: string,
    id: string,
}

export interface Global {
    started: boolean,
    locked: boolean,
    players: Player[]
    day: number,
    game: string | null,
    bulletin: string | null, 
    extensions: string[],
    grace: boolean,
    admin: string[],
    hammer: boolean,
}

interface Player {
    id: string,
    alignment: 'mafia' | 'neutral' | string | null;
}

const map: Map<string, { instance: Instance, timestamp: number }> = new Map();
let fetched = false;

export async function getInstance(id: string) {
    const db = firebaseAdmin.getFirestore();
    const ref = db.collection("instances").doc(id);
    const name = (await ref.get()).data()?.name as string | undefined;

    if(name == undefined) return undefined;

    const setup = await getSetup(id, firebaseAdmin);

    const globalRef = ref.collection('settings').doc('game');
    const globalDoc = await globalRef.get();
    const global = globalDoc.data() ? globalDoc.data() as Global : undefined;
    if(global == undefined) throw new Error("Database not setup.");

    const instance = { setup, global, name, id };

    map.set(id, { instance, timestamp: new Date().valueOf() });

    return instance;
}

export async function getCachedInstance(id: string) {
    const cached = map.get(id);

    if(cached && (new Date().valueOf() - cached.timestamp) < (1000 * 20)) {
        return cached.instance;
    } else {
        return await getInstance(id);
    }
} 

export async function getAuthority(id: string, useCache: boolean = true) {
    if(!fetched || !useCache) {
        await getInstances();
        fetched = true;
    }

    const cached = Array.from(map.values());
    
    for(let i = 0; i < cached.length; i++) {
        const setup = cached[i].instance.setup;

        if(![setup.primary.guild.id, setup.secondary.guild.id, setup.tertiary.guild.id].includes(id)) continue;

        return await getCachedInstance(cached[i].instance.id);
    };

    return undefined;
}

export async function getCachedInstances() {
    if(!fetched) {
        await getInstances();
        fetched = true;
    }

    const cached = Array.from(map.values());

    return cached.map(cachedInstance => cachedInstance.instance);
}

export async function getInstances() {
    const db = firebaseAdmin.getFirestore();

    const docs = await db.collection("instances").listDocuments();

    const instances = Promise.all(docs.map((doc) => getInstance(doc.id)));

    return instances;
}