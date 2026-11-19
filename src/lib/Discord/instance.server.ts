import { Transaction } from "firebase-admin/firestore";
import { firebaseAdmin } from "../Firebase/firebase.server";
import { getSetup, type Setup } from "./setup.server";

export interface Instance {
    setup: Setup,
    global: Global,
    name: string,
    id: string,
}

// Instance-wide settings from instances/{instance}/settings/game. Several games can run at once, so per-game data
// lives with each game; see getGameState.
export interface Global {
    admin: string[],
}

interface Player {
    id: string,
    alignment: 'mafia' | 'neutral' | string | null;
}

// A game's live state, as the bot stores it: instances/{instance}/games/{game}/state/game, plus extensions and hammer on
// the game doc. A game that hasn't started (or has no state yet) reads as not started.
export interface GameState {
    started: boolean,
    locked: boolean,
    players: Player[],
    day: number,
    grace: boolean,
    extensions: string[],
    hammer: boolean,
}

export async function getGameState(instance: Instance, gameId: string): Promise<GameState> {
    const db = firebaseAdmin.getFirestore();
    const gameRef = db.collection('instances').doc(instance.id).collection('games').doc(gameId);

    const [stateDoc, gameDoc] = await Promise.all([gameRef.collection('state').doc('game').get(), gameRef.get()]);

    const state = stateDoc.data() ?? {};
    const game = gameDoc.data() ?? {};

    return {
        started: state.started ?? false,
        locked: state.locked ?? false,
        players: state.players ?? [],
        day: state.day ?? 0,
        grace: state.grace ?? false,
        extensions: game.extensions ?? [],
        hammer: game.hammer ?? true,
    };
}

const map: Map<string, { instance: Instance, timestamp: number }> = new Map();
let fetched = false;

export async function getInstance(id: string) {
    const timestamp = new Date().valueOf();

    console.log("STEP i1", new Date().valueOf() - timestamp);

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection("instances").doc(id);
    const name = (await ref.get()).data()?.name as string | undefined;

    console.log("STEP i2", new Date().valueOf() - timestamp);

    if(name == undefined) return undefined;

    const setup = await getSetup(id, firebaseAdmin);

    console.log("STEP i3", new Date().valueOf() - timestamp);

    const globalRef = ref.collection('settings').doc('game');
    const globalDoc = await globalRef.get();
    const data = globalDoc.data();
    if(data == undefined) throw new Error("Database not setup.");
    const global: Global = { admin: data.admin ?? [] };

    console.log("STEP i4", new Date().valueOf() - timestamp);

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