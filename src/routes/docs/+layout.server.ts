import { firebaseAdmin } from '$lib/Firebase/firebase.server.js'
import { getOrder, type Page } from './pages.server';

export async function load({ params, route }) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('documents');

    const docs = (await ref.get()).docs;
    
    const pages = docs.map(doc => ({ ...doc.data(), id: doc.ref.id } as Page));

    const order = await getOrder();

    const commands = ((await db.collection('commands').doc('help').get()).data()?.entries ?? {}) as { [key: string]: { type: string, name: string, slash?: string, text?: string, arguments: { name: string, description: string, type: 'slash' | 'text' }[], description: string, shorthand: string } };

    return {
        indicator: params.page,
        pages,
        order,
        commands,
    }
}

