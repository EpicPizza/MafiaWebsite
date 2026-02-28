import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import { getAllowed } from "../users.server";
import { safeParse } from "$lib/tools";
import { error } from "@sveltejs/kit";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";

export async function load({ request, cookies, url }) {
    const redirectTo = url.searchParams.get("redirect") ?? "/";
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");

    if (!id || !token) error(401);

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('sessions').doc(id);
    const data = (await ref.get()).data();

    if (!data || data.token != token || (Date.now().valueOf() - data.timestamp) > (1000 * 60 * 5)) error(403);

    const user = await fetch(`https://discord.com/api/v10/users/${id}`, {
        headers: { Authorization: `Bot ${env.TOKEN}` }
    }).then(res => res.ok ? res.json() : undefined).catch(() => undefined);

    if (user == undefined) error(404);

    const flow = crypto.randomUUID();

    await ref.set({
        object: user,
        timestamp: new Date().valueOf(),
        flow: flow,
        token: null,
    }, { merge: true });

    cookies.set("__session", JSON.stringify({
        flow: flow,
        id: user.id,
        step: 1,
    }), {
        domain: env.DEV === "TRUE" ? undefined : "frcmafia.com",
        secure: true, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 5
    });

    redirect(307, redirectTo);
}
