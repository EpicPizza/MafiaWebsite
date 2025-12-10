import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import { getAllowed, getSession } from "../users.server";

export async function GET({ request, cookies, url }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"), true);

    if(session && users.includes(session.username)) redirect(307, `/docs/${url.searchParams.get("route")}/edit`);

    const discord = new arctic.Discord(env.CLIENT, env.SECRET, env.DOMAIN + "/docs/start");

    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();

    cookies.set("__session", JSON.stringify({
        state: state,
        codeVerifier: codeVerifier,
    }), {
        secure: true, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10 // 10 min
    });

    const redirectURL = discord.createAuthorizationURL(state, codeVerifier, ["identify"]);

    redirect(307, redirectURL);
}