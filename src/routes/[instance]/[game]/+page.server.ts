import { env } from "$env/dynamic/private";
import { isMod } from "$lib/Discord/mod.server";
import { getUser, getUsers, type User } from "$lib/Discord/users.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";
import type { Log, StatsAction, TrackedMessage } from "./types";
import type { Attachment } from "discord.js";
import type { Instance } from "$lib/Discord/instance.server";
import type { Game } from "$lib/Discord/game.server";

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    //if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    
    const mod = !locals.profile ? false : await isMod(instance, locals.profile.uid);

    if(!instance.global.started && game.state == 'active') error(400, "Game not started!");

    const users = (await getUsers(instance, game.signups, true, true)).map((user, i) => ({ ...user, i: i }));
    
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

    const dayRequest = parseInt(url.searchParams.get('day') ?? "");
    const day = instance.global.started && instance.global.game == game.id ? instance.global.day : game.days;

    const statRequest = url.searchParams.get('pit');
    let statsGraph = undefined as undefined | { 
        stats: StatsAction[],
        name: string,
        day: number, 
        timestamp: number,
        id: string,
    };

    if(statRequest != null) {
        const ref = db.collection('graphs').doc(statRequest);

        const data = (await ref.get()).data();

        if(data == undefined) error(404, "Stats graph not found.");

        statsGraph = data as any;

        if(statsGraph != undefined) {
            statsGraph.id = ref.id;

            const convertedStats= statsGraph.stats.map(stat => ({
                type: 'add' as 'add',
                id: stat.id,
                day: statsGraph?.day ?? day,
                instance: instance.id,
                game: statsGraph?.name ?? game.name,
                messages: stat.messages,
                images: stat.images ?? 0,
                words: stat.words,
            }));

            statsGraph.stats = convertedStats.filter(stat => game.signups.includes(stat.id));;
        }
    }

    const messages = [] as TrackedMessage[];
    const messageUsers = [] as string[];
    
    if(game.start != null) {
        const pinQuery = db.collection('channels').doc(instance.setup.primary.chat.id).collection('messages').orderBy('createdTimestamp', 'asc').where('createdTimestamp', '>=', game.start).where('createdTimestamp', '<=', game.end == null ? new Date().valueOf() : game.end).where('pinned', '==', true);
        const starQuery = db.collection('channels').doc(instance.setup.primary.chat.id).collection('messages').orderBy('createdTimestamp', 'asc').where('createdTimestamp', '>=', game.start).where('createdTimestamp', '<=', game.end == null ? new Date().valueOf() : game.end).where('stars', '>=', 3);

        const docs = [... (await pinQuery.get()).docs, ...(await starQuery.get()).docs];

        messages.push(... (await Promise.all(docs.map(async doc => {
            const message = doc.data() as TrackedMessage;

            if(!messageUsers.includes(doc.data().authorId)) messageUsers.push(doc.data().authorId);

            if(message.attachments.length > 0) {
                const discordMessage = await instance.setup.primary.chat.messages.fetch(message.id).catch(() => undefined);

                if(discordMessage == undefined) {
                    message.attachments = [];
                    return;
                }

                message.attachments = message.attachments.map(attachment => discordMessage.attachments.get(attachment as unknown as string)).filter(attachment => attachment != undefined).map(attachment => attachment.toJSON() as Attachment);
            }

            return message;
        }))).filter(data => data != undefined && 'createdTimestamp' in data) );
    }
        
    const promises = [] as Promise<{ players: string[], stats: StatsAction[], votes: Log[], half: number, timeStats: { [key: string]: number; }[] | undefined, }>[];

    for(let i = 1; i <= day; i++) {
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

            let timeStats = undefined as undefined | { [key: string]: number; }[];
            try {
                timeStats = cutoffStats(await getTimeStats(instance, game, users, i));
            } catch(e) {
                console.log(e);
            }

            return { players: currentPlayers, votes: votes, stats: stats, half: half, timeStats: timeStats };
        })());
    }

    const days = await Promise.all(promises);

    const index = !isNaN(dayRequest) ? (dayRequest - 1) : (instance.global.started && instance.global.game == game.id ? day - 1 : 0);

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
        activeDay: !isNaN(dayRequest) ? dayRequest : undefined,
        instance: instance.id,
        link: instance.setup.primary.guild.id + "/" + instance.setup.primary.chat.id,
        votes: days[index].votes,
        players: days[index].players,
        stats: statsGraph ? statsGraph.stats : days[index].stats,
        half: days[index].half,
        tab: url.searchParams.get("tab") ?? "Home",
        mods: 'mods' in game && game.mods ? await getUsers(instance, game.mods, true, true) : [],
        days,
        pitStats: statsGraph,
        messages,
        messageUsers: await Promise.all(messageUsers.map((id) => {
            const existing = users.find(user => user.id == id);

            if(existing) return existing;

            return getUser(instance, id, true, true);
        })) 
    };
}


function shallowObjectCompare(a: {[key: string]: number }, b: {[key: string]: number }) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (a[key] !== b[key]) return false;
    }

    return true;
}

function cutoffStats(stats: { [key: string]: number; }[]) {
    let startCutoff = 0;
    const startStat = { ...stats[0], interval: 0};

    for(let i = 0; i < stats.length; i++) {
        if(shallowObjectCompare({ ...stats[i], interval: 0}, startStat)) {
            break;
        } else {
            startCutoff = i;
        }
    }

    let endCutoff = stats.length - 1;
    const endStat = { ...stats[stats.length - 1], interval: 0 };

    for(let i = endCutoff - 1; i >= 0; i--) {
        if(!shallowObjectCompare({ ...stats[i], interval: 0 }, endStat)) {
            break;
        } else {
            endCutoff = i;
        }
    }

    return stats.slice(startCutoff, endCutoff);
}

async function getTimeStats(instance: Instance, game: Game, users: User[], day: number) {
    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days');

    const currentRef = ref.doc(day.toString());
    const nextRef = ref.doc((day + 1).toString());
    
    const currentData = (await currentRef.get()).data() as { start?: number } | undefined;
    const nextData = (await nextRef.get()).data() as { start?: number } | undefined;

    if(currentData == undefined || !('start' in currentData) || currentData.start == undefined) error(500, "Database setup issue.");

    const fiveMinutes = 5 * 60 * 1000;

    let countingFrom = Math.round(currentData.start / fiveMinutes) * fiveMinutes;
    let countingTo = Math.round((nextData && nextData.start ? nextData.start : new Date().valueOf()) / fiveMinutes) * fiveMinutes;

    const cacheRef = ref.doc(day.toString()).collection('etc').doc('increments');
    const cache = (await cacheRef.get()).data() as { countingFrom: number, countingTo: number, stats: {[key: string]: number }[] } | undefined;

    const stats = [] as {[key: string]: number }[];

    if(cache != undefined) {
        if(countingTo == cache.countingTo) {
            return cache.stats;
        } else {
            countingFrom = cache.countingTo;
            stats.push(...cache.stats);

            countingFrom -= fiveMinutes;
        }
    }

    let query = db.collection('channels').doc(instance.setup.primary.chat.id).collection('messages').orderBy('createdTimestamp', 'desc');

    if(nextData && nextData.start) {
        query = query.startAt(nextData.start);
    }

    if(cache) {
        query = query.endAt(countingFrom);
    } else {
        query = query.endAt(currentData.start);
    }


    const messages = (await query.get()).docs.map(doc => doc.data()) as TrackedMessage[];

    const intervals = new Map<number, TrackedMessage[]>();

    messages.forEach((message) => {
        const roundedTimestamp = Math.round(message.createdTimestamp / fiveMinutes) * fiveMinutes;

        const interval = intervals.get(roundedTimestamp);

        if(interval == undefined) {
            intervals.set(roundedTimestamp, [ message ]);
        } else {
            interval.push(message);
        }
    });

    let at = countingFrom;

    const last = cache ? cache.stats[cache.stats.length - 1] : {
        interval: at
    } as typeof stats[0];

    if(!cache) users.forEach(signup => { last[signup.id] = 0; });

    while(at <= countingTo) {
        const interval = intervals.get(at);

        if(interval == undefined) {
            stats.push({
                ...last,
                interval: at,
            });
        } else {
            interval.forEach(message => {
                if(!game.signups.includes(message.authorId)) return;

                last[message.authorId] += message.content.split(" ").length;
            });

            stats.push({
                ...last,
                interval: at,
            });
        }

        at += fiveMinutes;
    }

    const current = instance.global.started && game.id == instance.global.game && day == instance.global.day;
    
    if(stats.length < 5) return stats;

    if(cache) {
        await cacheRef.update({
            stats: current ? stats.slice(0, -3) : stats,
            countingTo: current ? countingTo - (fiveMinutes * 2) : countingTo,
        });
    } else {
        await cacheRef.set({
            stats: current ? stats.slice(0, -2) : stats,
            countingFrom: countingFrom,
            countingTo: current ? countingTo - (fiveMinutes * 2) : countingTo,
        });
    }

    return stats;
}   