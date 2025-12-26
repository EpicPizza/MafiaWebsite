import { env } from '$env/dynamic/private';
import { getGameByID } from '$lib/Discord/game.server.js';
import { isMod } from '$lib/Discord/mod.server.js';
import { getUser, getUsers } from '$lib/Discord/users.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { Log, StatsAction } from './types';
import { getFuture } from '$lib/Discord/timing.server';

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    if(instance == undefined) error(404);

    if(!locals.profile) redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));

    const user = await getUser(instance, locals.profile.uid);
    if(!user) error(403, "Not registered!");

    if(!instance.global.started) error(400, "Game not started!");
    
    const game = await getGameByID(instance, instance.global.game ?? "---");
    if(game == undefined) error(404, "Game not found.");

    const db = firebaseAdmin.getFirestore();
    
    const currentPlayers = (await db.collection('instances').doc(instance.id).collection('day').doc(instance.global.day.toString()).get()).data()?.players as string[] | undefined ?? [];

    const ref = db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(instance.global.day.toString()).collection('stats');
    const stats = (await ref.get()).docs.map(doc => ({ ...doc.data(), instance: instance.id, game: game.id, day: instance.global.day, type: "add", id: doc.ref.id })) as unknown as StatsAction[];

    const custom = parseInt(env.HAMMER_THRESHOLD_PLAYERS ?? '-1');
    const playerCount = custom === -1 ? instance.global.players.length : custom;
    const half = Math.floor(playerCount / 2);

    const votes = (await db.collection('instances').doc(instance.id).collection('day').doc(instance.global.day.toString()).collection('votes').orderBy('timestamp', 'desc').limit(3).get()).docs.map(vote => vote.data()).filter(vote => vote != undefined) as Log[];

    const players = await getUsers(instance, currentPlayers);

    votes.filter(log => log.type == 'standard').map(log => {
        log.search = {
            for: players.find(player => player.id == (log.vote.for == "unvote" ? "---" : log.vote.for))?.nickname,
            replace: players.find(player => player.id == (log.vote.replace ?? "---"))?.nickname,
            name: players.find(player => player.id == log.vote.id)?.nickname ?? "<@" + log.vote.id + ">",
        }
    });

    return { 
        day: instance.global.day, 
        instance: instance.id, 
        game: game,
        players: players, 
        stats: stats, 
        threshold: half, 
        votes: votes,
        locking: await getFuture(instance),
    };
}