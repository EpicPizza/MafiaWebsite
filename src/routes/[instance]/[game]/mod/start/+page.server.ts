import { getGameByID } from '$lib/Discord/game.server.js';
import { isMod } from '$lib/Discord/mod.server.js';
import { getUsers } from '$lib/Discord/users.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    if(instance == undefined) error(404);

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    if(await isMod(instance, locals.profile.uid) == false) error(403, "You're not mod!");

    if(instance.global.started) error(400, "Game started!");
    
    const game = await getGameByID(instance, params.game);
    if(game == undefined) error(404);

    return { extensions: instance.global.extensions, game: game, users: await getUsers(instance, game.signups), loaded: true };
}