import { firebaseAdmin } from '$lib/Firebase/firebase.server.js'
import { getOrder, type Page } from './pages.server';

export async function load({ params, route }) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('documents');

    const docs = (await ref.get()).docs;

    const pages = docs.map(doc => ({ ...doc.data(), id: doc.ref.id } as Page));

    const order = await getOrder();

    return {
        indicator: params.page,
        pages,
        order,
    }
}

