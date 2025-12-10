import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, text } from '@sveltejs/kit';
import z from 'zod';
import { getAllowed, getSession } from '../docs/users.server';
import { DocumentData, FieldValue } from 'firebase-admin/firestore';
import { getOrder } from '../docs/pages.server';
import { page } from '$app/stores';
import { Page as PageEntry } from '../docs/pages.server';

export async function PATCH({ request, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) error(403);

    const page = Page.parse(await request.json());

    if(page.id == undefined) throw new Error("ID not defined.");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('documents').doc(page.id);

    await ref.set(page);

    return new Response(null, { status: 200 });
}

export async function DELETE({ request, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) error(403);

    const page = Delete.parse(await request.json());

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('documents').doc(page.id);

    await ref.delete();

    const query = db.collection('documents').where('subpages', 'array-contains', page.id);

    const docs = (await query.get()).docs;

    await Promise.allSettled(docs.map(doc => doc.ref.update({ subpages: FieldValue.arrayRemove(page.id) })));

    return new Response(null, { status: 200 });
}

export async function PUT({ request, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) error(403);

    const reorder = Reorder.parse(await request.json());

    const ranges = await getOrder();

    const db = firebaseAdmin.getFirestore();

    const page = (await db.collection('documents').doc(reorder.id).get()).data() as PageEntry;

    if(page.order == -1) error(400);

    if(ranges.top == page.order && reorder.type == 'up') error(400);
    if(ranges.bottom == page.order && reorder.type == 'down') error(400);

    const query = db.collection('documents').where('order', '==', reorder.type == 'up' ? page.order - 1 : page.order + 1);

    (await query.get()).docs[0].ref.update({ order: page.order });
    await db.collection('documents').doc(reorder.id).update({ order: reorder.type == 'up' ? page.order - 1 : page.order + 1 });

    return new Response(null, { status: 200 });
}

export async function POST({ request, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) error(403);

    const page = Page.parse(await request.json());

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('documents').doc();

    const ranges = await getOrder();

    await ref.set({ ...page, order: page.order == -1 ? -1 : ranges.bottom + 1 });

    return text(ref.id);
}

const Delete = z.object({
    id: z.string(),
});

const Reorder = z.object({
    id: z.string(),
    type: z.union([ z.literal('up'), z.literal('down') ])
})

const Page = z.object({
    content: z.string(),
    description: z.string(),
    id: z.string().optional(),
    icon: z.string(),
    title: z.string(),
    route: z.string(),
    subpages: z.string().array(),
    hide: z.boolean(),
    order: z.number().optional(),
    integration: z.string().optional(),
})