import { error } from "console";
import { getAllowed, getSession } from "../../../docs/users.server";
import { createGroup } from "../../helpers.server";
import { redirect } from "@sveltejs/kit";
import { getGroup } from "../../helpers.server";

export async function load({ request, params, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session) throw redirect(307, "/party/signin");
    if(!users.includes(session.username)) throw error(403);

    const group = await getGroup(params.code);

    if(group == undefined) throw error(404);
    if(!(group.mod.includes(session.username) || group.mod.includes("alejandroest"))) throw error(403);

    return group;
}