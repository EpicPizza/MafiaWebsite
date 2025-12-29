import { env } from "$env/dynamic/private";
import { isMod } from "$lib/Discord/mod.server";
import { getUsers } from "$lib/Discord/users.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";
import type { Log, StatsAction } from "./types";

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    //if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    
    const mod = !locals.profile ? false : await isMod(instance, locals.profile.uid);

    if(!instance.global.started && game.state == 'active') error(400, "Game not started!");

    const users = (await getUsers(instance, game.signups, true)).map((user, i) => ({ ...user, i: i }));
    
    users.sort((a, b) => {
        if(game.state == 'active' && instance.global.game == game.id) {
            const aAlive = instance.global.players.find(player => player.id == a.id);
            const bAlive = instance.global.players.find(player => player.id == b.id);

            return aAlive && !bAlive ? -1 : 1;
        }
        
        if(game.state != 'active') {
            const aWon = game.winners.includes(a.id);
            const bWon = game.winners.includes(b.id);

            return aWon && !bWon ? -1 : 1;
        }

        return 0;
    })

    const db = firebaseAdmin.getFirestore();

    const day = instance.global.started && instance.global.game == game.id ? instance.global.day : game.days;
        
    const promises = [] as Promise<{ players: string[], stats: StatsAction[], votes: Log[], half: number }>[];

    for(let i = (locals.profile ? day : 1); i <= day; i++) {
        promises.push((async () => {
            const currentPlayers = (await db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(i.toString()).get()).data()?.players as string[] | undefined ?? [];

            const ref = db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(i.toString()).collection('stats');
            const stats = ((await ref.get()).docs.map(doc => ({ ...doc.data(), instance: instance.id, game: game.id, day: i, type: "add", id: doc.ref.id })) as unknown as StatsAction[]).filter(stat => users.find(user => user.id == stat.id));

            const custom = parseInt(env.HAMMER_THRESHOLD_PLAYERS ?? '-1');
            const playerCount = custom === -1 ? instance.global.players.length : custom;
            const half = Math.floor(playerCount / 2);

            const votes = (await db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(i.toString()).collection('votes').orderBy('timestamp', 'desc').get()).docs.map(vote => vote.data()).filter(vote => vote != undefined) as Log[];

            votes.filter(log => log.type == 'standard').map(log => {
                log.search = {
                    for: users.find(player => player.id == (log.vote.for == "unvote" ? "---" : log.vote.for))?.nickname,
                    replace: users.find(player => player.id == (log.vote.replace ?? "---"))?.nickname,
                    name: users.find(player => player.id == log.vote.id)?.nickname ?? "<@" + log.vote.id + ">",
                }
            });

            console.log({ players: currentPlayers, votes: votes, stats: stats, half: half });

            return { players: currentPlayers, votes: votes, stats: stats, half: half };
        })());
    }

    const days = await Promise.all(promises);

    console.log(days);

    const index = locals.profile ? 0 : (instance.global.started && instance.global.game == game.id ? day - 1 : 0);
    
    return { 
        users, 
        mod, 
        game, 
        global: instance.global.started ? { 
            ...instance.global,
            extensions: [],
            players: instance.global.players.map(player => ({ ...player, alignment: null })),
        } : instance.global,
        day,
        instance: instance.id,
        votes: days[index].votes,
        players: days[index].players,
        stats: days[index].stats,
        half: days[index].half,
        tab: url.searchParams.get("tab") ?? "Home",
        mods: 'mods' in game && game.mods ? await getUsers(instance, game.mods) : [],
        days,
    };
}