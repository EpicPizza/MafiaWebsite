import { getGameByID } from '$lib/Discord/game.server.js';
import { isMod } from '$lib/Discord/mod.server.js';
import { getUsers } from '$lib/Discord/users.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';

interface Call {
    command: string,
    instance: string,
    timestamp: number,
    received: boolean,
    result?: any,
    sender: string,
}

export async function POST({ params, locals, url, request }) {
    const instance = await locals.getInstance();
    if(instance == undefined) error(404);

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    if(await isMod(instance, locals.profile.uid) == false) error(403, "You're not mod!");

    //if(instance.global.started) error(400, "Game started!");
    
    const commandRequest = await request.json();
    if(!('command' in commandRequest) || typeof commandRequest.command != 'string' || commandRequest.command.length == 0) error(400, "invalid request");
    const command = commandRequest.command as string;

    const db = firebaseAdmin.getFirestore();

    const ref = await db.collection('queue').add({
        command: command,
        timestamp: new Date().valueOf(),
        instance: instance.id,
        received: false,
        sender: locals.profile.uid,
    } satisfies Call);

     const stream = new ReadableStream({
        start(controller) {
            controller.enqueue('---1---');

            let recieved = false;
            let closed = false;

            const unsubscribe = ref.onSnapshot(snapshot => {
                const call = snapshot.data() as Call | undefined;
                if(call == undefined) return;

                if(recieved == false && call.received == true) {
                    controller.enqueue('---2---');
                    recieved = true;
                }
                
                if(recieved && call.result) {
                    controller.enqueue('---3---');
                    controller.enqueue(JSON.stringify(call.result));

                    unsubscribe();
                    if(!closed) controller.close();
                    closed = true;
                }
            });

            setTimeout(() => {
                unsubscribe();
                if(!closed) controller.close();
                closed = true;
            }, 60 * 1000);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain', // Or the appropriate multipart content-type
            'Transfer-Encoding': 'chunked'
        }
    });
}