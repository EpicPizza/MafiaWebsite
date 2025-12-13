import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";

export async function getAllowed() {
    const db = firebaseAdmin.getFirestore();

    const users = (await db.collection('sessions').doc('allowed').get()).data()?.users as string[] ?? [];

    return users;
}