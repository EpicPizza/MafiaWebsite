import { env } from '$env/dynamic/private';
import { getUsers } from '$lib/Discord/users.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error } from '@sveltejs/kit';

export async function load({ params, locals }) {
    if(params.day == '0') error(400, "Day 0 Doesn't Exist");

    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(params.day).collection('votes');

    const docs = (await ref.get()).docs;
   
    const users = await getUsers(instance, game.signups);
 
    const logs = docs.map(doc => doc.data()) as Log[];

    logs.filter(log => log.type == 'standard').map(log => {
        log.search = {
            for: users.find(user => user.id == (log.vote.for == "unvote" ? "---" : log.vote.for))?.nickname,
            replace: users.find(user => user.id == (log.vote.replace ?? "---"))?.nickname,
            name: users.find(user => user.id == log.vote.id)?.nickname ?? "<@" + log.vote.id + ">",
        }
    });

    logs.sort((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());

    const tags = await getTags();

    return {
        logs, 
        users,
        day: params.day,
        name: game.name,
        tags
    }
}

interface Vote {
    id: string,
    for: string | 'unvote',
    replace?: string,
    timestamp: number,
}

type Log = (StandardLog & Search) | CustomLog | ResetLog;

interface Search {
    search: { //for vote history search, add nicknames
        for?: string,
        replace?: string,
        name: string,
    },
}

interface StandardLog {
    vote: Vote,
    board: string,
    messageId: string | null, 
    type: 'standard',
    timestamp: number,
}

interface CustomLog {
    search: { //for vote history search, add nicknames
        for?: string,
        replace?: string,
        name: string,
    },
    message: string,
    prefix: boolean, //prefix nickname to the beginning of the name
    board: string,
    messageId: string | null,
    type: 'custom'
    timestamp: number,
}

interface ResetLog {
    message: string,
    board: string,
    messageId: string | null,
    type: 'reset',
    timestamp: number,
}

interface Tag {
    color: string,
    id: string,
    nickname: string,
    pfp: string,
}

async function getTags() {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('tags');

    const docs = (await ref.get()).docs;

    return docs.map(doc => doc.data() as Tag);
}