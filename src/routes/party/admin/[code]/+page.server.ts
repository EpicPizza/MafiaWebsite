import { error } from "console";
import { createGroup } from "../../helpers.server";
import { redirect } from "@sveltejs/kit";
import { getGroup } from "../../helpers.server";

export async function load({ request, params, cookies, locals, url }) {
    if (!locals.profile) throw error(403);

    const group = await getGroup(params.code);

    if (group == undefined) throw error(404);
    if (!(group.mod.includes(locals.profile.uid) || group.mod.includes("989327366218215424"))) throw error(403);

    return {
        group,
        tab: url.searchParams.get("tab") ?? "Players",
    };
}