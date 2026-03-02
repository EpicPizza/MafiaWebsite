import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, json } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

export async function POST({ cookies, request }) {
    const login = await request.json();

    if(!('nickname' in login && 'code' in login)) throw error(400);

    const nickname = "---" + (login.nickname as string).toLowerCase();
    const code = login.code as number;

    const db = firebaseAdmin.getFirestore();

    const query = db.collection('sessions').where('username', '==', nickname);
    const docs = (await query.get()).docs;

    if(docs.length > 1) {
        const existingCode = docs[0].data().code as number;

        if(existingCode != code) throw error(401);
    }

    const ref = db.collection('sessions').doc(crypto.randomUUID());

    await ref.set({
        username: nickname,
        code: code,
        timestamp: new Date().valueOf(),
    });

    cookies.set("__session", JSON.stringify({
        session: ref.id
    }), {
        secure: true, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7
    });

    return json({ success: true });
}