import { isMod } from "$lib/Discord/mod.server";
import { getUsers } from "$lib/Discord/users.server";
import { error, redirect } from "@sveltejs/kit";

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    
    const mod = await isMod(instance, locals.profile.uid);

    if(!instance.global.started) error(400, "Game not started!");

    const users = await getUsers(instance, game.signups);

    return { users, mod, game, 
        global: { 
            ...instance.global,
            extensions: [],
            players: instance.global.players.map(player => ({ ...player, alignment: null })),
        }
    };
}