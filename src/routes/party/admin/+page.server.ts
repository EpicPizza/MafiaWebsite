import { error } from "console";
import { createGroup } from "../helpers.server";
import { redirect } from "@sveltejs/kit";
export async function load({ request, params, cookies, locals }) {
    if (!locals.profile) throw error(403);

    let code = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    await createGroup(code, locals.profile.uid);

    throw redirect(307, "/party/admin/" + code);
}