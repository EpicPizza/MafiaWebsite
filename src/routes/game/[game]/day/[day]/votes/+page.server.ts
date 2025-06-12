import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getGameByID, getUsers } from '$lib/users.server.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    if(params.day == '0') throw error(400, "Day 0 Doesn't Exist");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('day').doc(params.day).collection('votes').doc('history').collection('logs');

    const docs = (await ref.get()).docs;

    const logs = [] as { id: string, name: string, for: string | null, replacing: string | null, type: 'unvote' | 'vote', timestamp: Date, messageId: string | null }[]

    const game = await getGameByID(params.game);

    const users = await getUsers(game);
 
    for(let i = 0; i < docs.length; i++) {
        const doc = docs[i];

        const data = doc.data() as { id: string, message: string, timestamp: number, type: 'vote' | 'unvote', for: string | null, messageId?: string } | undefined;

        if(data == undefined) continue;

        const voter = users.get(data.id);
        const voted = users.get(data.for ?? "");

        if(voter == null || (data.type == 'vote' && voted == null)) continue;

        logs.push({
            id: doc.ref.id,
            timestamp: new Date(data.timestamp),
            for: voted?.nickname ?? null,
            name: voter.nickname,
            replacing: null,
            type: data.type,
            messageId: data.message ?? null,
        });
    }

    logs.sort((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf());

    const votes = new Map() as Map<string, string[]>;

    const snapshots = [] as { votes: { votes: number, message: string }[], vote: { id: string, name: string, timestamp: Date, replacing: string | null, type: 'vote' | 'unvote', for: string | null, messageId: string | null } }[];

    for(let i = 0; i < logs.length; i++) {
        const vote = logs[i];

        if(vote.name == null) continue;

        if(vote.type == "vote") {       
            if(vote.for == null) continue;

            votes.forEach((counted, key) => {
                if(counted.includes(vote.name)) {
                    counted.splice(counted.indexOf(vote.name), 1)[0];

                    vote.replacing = key;

                    votes.set(key, counted);
                }
            })

            const counted = votes.get(vote.for);

            if(counted == undefined) {
                votes.set(vote.for, [ vote.name ]);
            } else {
                votes.set(vote.for, [ ...counted, vote.name ]);
            }
        } else if(vote.type == "unvote") {
            votes.forEach((counted, key) => {
                if(counted.includes(vote.name)) {
                    counted.splice(counted.indexOf(vote.name), 1);

                    vote.replacing = key;

                    votes.set(key, counted);
                }
            })
        }

        const messages = [] as { votes: number, message: string }[];

        let voting = Array.from(votes.keys());

        voting = voting.sort((a, b) => (votes.get(b)?.length ?? -1) - (votes.get(a)?.length ?? -1));

        for(let i = 0; i < voting.length; i++) {
            const voted = votes.get(voting[i]) ?? [];

            if(voted.length == 0) continue;

            messages.push({ votes: voted.length, message: voted.length + " - " + voting[i] + " « " + voted.join(", ")});
        }

        messages.sort((a, b) => b.votes - a.votes);

        snapshots.push({
            votes: messages,
            vote: vote,
        });
    }
    
    console.log(snapshots);

    return {
        snapshots: snapshots,
        day: params.day,
        name: game.name,
    }
}