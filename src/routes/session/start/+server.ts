import { env } from "$env/dynamic/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import type { APIUser } from "discord-api-types/v10";

export async function GET({ url, cookies }) {
    if(url.searchParams.get("error")) throw redirect(307, "/");

    const discord = new arctic.Discord(env.CLIENT, env.SECRET, env.DOMAIN + "/session/start");

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const session = cookies.get("__session");
    if(session == undefined) error(401);
    const cookie = JSON.parse(session);
    if(!('codeVerifier' in cookie) || !('state' in cookie) || !('redirectTo' in cookie)) error(401);

    console.log(cookie);

    const storedState = cookie.state;
    const storedCodeVerifier = cookie.codeVerifier;
    const redirectTo = cookie.redirectTo;

    if (code === null || storedState === undefined || state !== storedState || storedCodeVerifier === undefined) error(400, "Invalid request.");

    const tokens = await discord.validateAuthorizationCode(code, storedCodeVerifier);

    const response = await fetch("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`
        }
    });

    if(response.status != 200) error(500);

    const user = await response.json() as APIUser;

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('sessions').doc(user.id);

    const flow = crypto.randomUUID();

    await ref.set({
        object: user,
        timestamp: new Date().valueOf(),
        flow: flow,
    }, { merge: true });

    cookies.set("__session", JSON.stringify({
        flow: flow,
        id: user.id,
        step: 1,
    }), {
        domain: "frcmafia.com",
        secure: true, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 5
    });

    redirect(307, redirectTo);
}