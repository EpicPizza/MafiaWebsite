import { env } from "$env/dynamic/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, redirect } from "@sveltejs/kit";
import * as arctic from "arctic";

export async function GET({ url, cookies }) {
    const discord = new arctic.Discord(env.CLIENT, env.SECRET, env.DOMAIN + "/docs/start");

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const session = cookies.get("__session");
    if(session == undefined) error(401);
    const cookie = JSON.parse(session);
    if(!('codeVerifier' in cookie) || !('state' in cookie)) error(401);

    const storedState = cookie.state;
    const storedCodeVerifier = cookie.codeVerifier;

    if (code === null || storedState === undefined || state !== storedState || storedCodeVerifier === undefined) error(400, "Invalid request.");

    const tokens = await discord.validateAuthorizationCode(code, storedCodeVerifier);

    const response = await fetch("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`
        }
    });

    const user = await response.json();

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('sessions').doc(crypto.randomUUID());

    await ref.set({
        username: user.username,
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

    redirect(307, "/docs/overview/edit");
}