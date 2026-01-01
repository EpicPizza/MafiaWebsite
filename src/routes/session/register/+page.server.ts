import { env } from "$env/dynamic/private";
import { redirect } from "@sveltejs/kit";
import * as arctic from "arctic";
import { getAllowed } from "../users.server";
import { safeParse } from "$lib/tools";

export async function load({ request, cookies, url }) {
    const session = safeParse(cookies.get("__session") ?? "-");
    const redirectTo = url.searchParams.get("redirect") ?? "/";

    const discord = new arctic.Discord(env.CLIENT, env.SECRET, env.DOMAIN + "/session/start");

    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();

    cookies.set("__session", JSON.stringify({
        state: state,
        codeVerifier: codeVerifier,
        redirectTo: redirectTo,
        step: 0,
    }), {
        domain: env.DEV === "TRUE" ? undefined : "frcmafia.com",
        secure: true, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10 // 10 min
    });

    const redirectURL = discord.createAuthorizationURL(state, codeVerifier, ["identify"]);

    redirect(307, redirectURL);
}