import { getGameByID } from '$lib/Discord/game.server.js';
import { isMod } from '$lib/Discord/mod.server.js';
import { getUsers } from '$lib/Discord/users.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { APIMessage, Attachment, MessageType } from 'discord.js';

interface TrackedMessage { 
    channelId: string,
    guildId: string,
    id: string,
    createdTimestamp: number,
    editedTimestamp: number | null,
    type: MessageType,
    content: string,
    cleanContent: string,
    authorId: string,
    pinned: boolean,
    pinning: string | null,
    embeds: APIMessage["embeds"],
    attachments: Attachment[],
    mentions: string[],
    reference: string | null,
    poll: boolean,
    reactions: Reaction[],
    deleted?: boolean,
    logs?: Log[],
    sniped?: string,
}

interface Reaction {
    id: string[];
    emoji: string | null;
}

interface Log {
    content: string,
    cleanContent: string,
    timestamp: number,
}

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    
    const mod = await isMod(instance, locals.profile.uid);

    if(!instance.global.started) error(400, "Game not started!");

    const users = await getUsers(instance, game.signups);

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days');

    const currentRef = ref.doc(instance.global.day.toString());
    const nextRef = ref.doc((instance.global.day + 1).toString());
    
    const currentData = (await currentRef.get()).data() as { start?: number } | undefined;
    const nextData = (await nextRef.get()).data() as { start?: number } | undefined;

    if(currentData == undefined || !('start' in currentData) || currentData.start == undefined) error(500, "Database setup issue.");

    let query = db.collection('channels').doc(instance.setup.primary.chat.id).collection('messages').orderBy('createdTimestamp', 'desc');

    if(nextData && nextData.start) {
        query = query.startAt(nextData.start);
    }

    query = query.endAt(currentData.start);

    const messages = (await query.get()).docs.map(doc => doc.data()) as TrackedMessage[];

    const fiveMinutes = 5 * 60 * 1000;
    let countingFrom = Math.round(currentData.start / fiveMinutes) * fiveMinutes;
    let countingTo = Math.round((nextData && nextData.start ? nextData.start : new Date().valueOf()) / fiveMinutes) * fiveMinutes;

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

    const stats = [] as {[key: string]: number }[];

    const last = {
        interval: at
    } as typeof stats[0];

    users.forEach(signup => { last[signup.id] = 0; });

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

    return { game: game, users: users, mod, day: currentData, stats };
}