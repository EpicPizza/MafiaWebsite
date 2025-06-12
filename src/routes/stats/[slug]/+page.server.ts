import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('graphs').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Stats graph not found.");

    return data as { 
        stats: { 
            words: number, 
            messages: number, 
            name: string, 
            show: boolean,
            reactions: {
                reaction: string,
                timestamp: number,
            }[],
            images: number,
        }[],
        name: string,
        day: number, 
        timestamp: number,
    };
}