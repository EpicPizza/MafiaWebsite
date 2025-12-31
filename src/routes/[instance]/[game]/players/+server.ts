import type { CompleteUser } from "$lib/Discord/users.server";
import { getUsers, type User } from "$lib/Discord/users.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, json } from "@sveltejs/kit";

export async function GET({ locals }) {
    const instance = await locals.getInstance();
    const game = await locals.getGame();
    if(instance == undefined || game == undefined) error(404);

    const users = (await getUsers(instance, game.signups, true)).map((user, i) => ({ ...user, i: i }));

    const day = instance.global.started && instance.global.game == game.id ? instance.global.day : game.days;

    const promises = [] as Promise<{ players: CompleteUser[] }>[];

    const db = firebaseAdmin.getFirestore();
    
    for(let i = 1; i <= day; i++) {
        promises.push((async () => {
            const currentPlayers = (await db.collection('instances').doc(instance.id).collection('games').doc(game.id).collection('days').doc(i.toString()).get()).data()?.players as string[] | undefined ?? [];

            return { players: currentPlayers.map(player => users.find(user => user.id == player)).filter(player => player != undefined) };
        })());
    }

    const days = await Promise.all(promises);

    return json(days);
}