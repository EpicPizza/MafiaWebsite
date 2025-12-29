import type { Game } from '$lib/Discord/game.server.js';
import { getInstance } from '$lib/Discord/instance.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params }) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('graphs').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) error(404, "Stats graph not found.");

    const graph = data as { 
        stats: { 
            words: number, 
            messages: number, 
            name: string, 
            show: boolean,
            alive?: boolean,
            reactions?: {
                reaction: string,
                timestamp: number,
                message?: string,
            }[],
            images?: number,
            reactionCount: number,
        }[],
        name: string,
        day: number, 
        timestamp: number,
    };

    const legacyInstances = (await Promise.all(["ucsc", "bag"].map(id => getInstance(id)))).filter(instance => instance != undefined);

    for(let i = 0; i < legacyInstances.length; i++) {
        const instance = legacyInstances[i];

        const query = db.collection('instances').doc(instance.id).collection('games').where('name', '==', graph.name);

        const docs = (await query.get()).docs;

        if(docs.length != 1) continue;

        throw redirect(307, "/" + instance.id + "/" + docs[0].ref.id + "?tab=Stats&pit=" + params.slug);
    }

    throw redirect(307, "/legacy/" + params.slug);
}