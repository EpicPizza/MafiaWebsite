import { error, redirect } from '@sveltejs/kit';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getInstance } from '$lib/Discord/instance.server';

export async function load({ params }) {
    const db = firebaseAdmin.getFirestore(); 

    const legacyInstances = (await Promise.all(["ucsc", "bag"].map(id => getInstance(id)))).filter(instance => instance != undefined);
    
    let instanceFound = "";

    for(let i = 0; i < legacyInstances.length; i++) {
        const instance = legacyInstances[i];

        const query = db.collection('instances').doc(instance.id).collection('games').doc(params.game);

        const doc = await query.get();

        if(doc.exists) instanceFound = instance.id;
    }

    if(!instanceFound) error(404);

    redirect(301, "/" + instanceFound + "/" + params.game + "?tab=Votes&day=" + params.day);
}