import { error, redirect } from "@sveltejs/kit";
import { getGroup } from "../helpers.server";

export async function load({ cookies, params, locals }) {
    if (locals.profile == undefined) throw redirect(307, `/session/register?redirect=/party/${params.group}`);

    const group = await getGroup(params.group);
    if (group == undefined) throw error(404);

    if (group.players.find(player => player.id == locals.profile?.uid) == undefined) throw error(400, "You're not part of this party.");

    return {
        code: params.group,
        id: locals.profile.uid,
        displayName: locals.profile.displayName
    }
}