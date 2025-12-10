import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";

export async function getAllowed() {
    const db = firebaseAdmin.getFirestore();

    const users = (await db.collection('sessions').doc('allowed').get()).data()?.users as string[] ?? [];

    return users;
}

export async function getSession(session: string | undefined, skip: boolean = false) {
    if(session == undefined) {
        if(skip) {
            return undefined;
        } else {
            error(401);
        }
    }

    const parsed = JSON.parse(session);

    if(!('session' in parsed)) {
        if(skip) {
            return undefined;
        } else {
            error(401);
        }
    }

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('sessions').doc(parsed.session);

    const user = (await ref.get()).data() as { timestamp: number, username: string } | undefined;

    if(user == undefined) {
        if(skip) {
            return undefined;
        } else {
            error(403);
        }
    }

    if(new Date().valueOf() - user.timestamp > (1000 * 60 * 60 * 254 * 7)) redirect(307, "/docs/register");

    return user;
}