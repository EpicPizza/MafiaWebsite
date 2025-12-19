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
}

export async function load({ params, locals, url }) {
    const instance = await locals.getInstance();
    if(instance == undefined) error(404);

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    if(await isMod(instance, locals.profile.uid) == false) error(403, "You're not mod!");

    if(instance.global.started) error(400, "Game started!");
    
    const game = await getGameByID(instance, params.game);
    if(game == undefined) error(404);

    const db = firebaseAdmin.getFirestore();

    const ref = await db.collection('queue').add({
        command: "?mod websitestart " + game.name,
        timestamp: new Date().valueOf(),
        instance: instance.id,
        received: false,
    } satisfies Call);

    const received = await new Promise<boolean>(async (resolve) => {
        const firstUnsubscribe = ref.onSnapshot(snapshot => {
            const call = snapshot.data() as Call | undefined;

            if(call == undefined || call.received == false) return;

            resolve(true);

            firstUnsubscribe();
        });

        setTimeout(() => {
            resolve(false);

            firstUnsubscribe();
        }, 10 * 1000);
    });

    return { 
        extensions: instance.global.extensions, 
        game: game, 
        received: received,
        stream: {
            command: (async () => {
                const result = await new Promise<Call["result"]>(async (resolve) => {
                    const secondUnsubscribe = ref.onSnapshot(snapshot => {
                        const call = snapshot.data() as Call | undefined;

                        if(call == undefined || !call.result) return;

                        resolve(call.result);

                        secondUnsubscribe();
                    });

                    setTimeout(() => {
                        resolve(undefined);

                        secondUnsubscribe();
                    }, 10 * 1000);
                });

                return result;
            })()
        }
    };
}