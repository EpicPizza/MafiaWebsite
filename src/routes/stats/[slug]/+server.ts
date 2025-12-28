import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export async function POST({ params }) {
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve(0);
        }, 1500);
    })

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('graphs').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) error(404, "Stats graph not found.");

    return json(data as { 
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
    });
}