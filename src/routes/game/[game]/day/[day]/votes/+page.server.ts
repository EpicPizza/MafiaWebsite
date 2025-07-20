import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getGameByID, getUsers } from '$lib/users.server.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    if(params.day == '0') throw error(400, "Day 0 Doesn't Exist");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('day').doc(params.day).collection('votes');

    const docs = (await ref.get()).docs;
   
    const game = await getGameByID(params.game);
    const users = await getUsers(game);
 
    const logs = docs.map(doc => doc.data()) as Log[];

    logs.filter(log => log.type == 'standard').map(log => {
        log.search = {
            for: users.get(log.vote.for == "unvote" ? "---" : log.vote.for)?.nickname,
            replace: users.get(log.vote.replace ?? "---")?.nickname,
            name: users.get(log.vote.id)?.nickname ?? "<@" + log.vote.id + ">",
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