import { error } from "console";
import { getAllowed, getSession } from "../../docs/users.server";
import { createGroup } from "../helpers.server";
import { redirect } from "@sveltejs/kit";

export async function load({ request, params, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) throw error(403);

    let code = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for ( let i = 0; i < 6; i++ ) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    await createGroup(code, session.username);

    throw redirect(307, "/party/admin/" + code);
}