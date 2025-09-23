import { error, redirect } from "@sveltejs/kit";
import { getSession } from "../../docs/users.server";
import { getGroup } from "../helpers.server";

export async function load({ cookies, params, }) {
    const session = await getSession(cookies.get("__session"));
    if(session == undefined) throw redirect(307, "/party/signin");

    const group = await getGroup(params.group);
    if(group == undefined) throw error(404);

    if(group.players.find(player => player.id == session.username) == undefined) throw error(400, "You're not part of this party.");

    return {
        code: params.group,
        id: session.username
    }
}