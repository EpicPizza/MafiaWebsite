import { firebaseAdmin, getUser } from '$lib/Firebase/firebase.server';
import { error } from 'console';
import type { APIUser } from 'discord.js';

export const handle = (async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get("__session");
    const session = sessionCookie ? safeParse(sessionCookie) : null;
    const step = session ? session.step as number : -1;

    await (async () => {
        if(step == 1) {
            const flow = session.flow as string;
            const id = session.id as string;

            const db = firebaseAdmin.getFirestore();
            const ref = db.collection('sessions').doc(id);
            const data = (await ref.get()).data();
            
            if(!data || data.flow != flow) {
                console.log("flow error");
                return;
            }

            const timestamp = data.timestamp;

            if((Date.now().valueOf() - timestamp) > (1000 * 60 * 5))  {
                console.log("timestamp error");
                return;
            }

            await ref.update({ flow: null });

            const discordUser = data.object as APIUser;
            
            const auth = firebaseAdmin.getAuth();

            let firebaseUser = await auth.getUser(discordUser.id).catch(() => undefined);

            if(firebaseUser == undefined) {
                firebaseUser = await auth.createUser({
                    uid: discordUser.id,
                    displayName: discordUser.username,
                    photoURL: discordUser.avatar ? ("https://cdn.discordapp.com/avatars/" + discordUser.id + "/" + discordUser.avatar + ".webp?size=160" ) : "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160",
                });
            } else {
                firebaseUser = await auth.updateUser(discordUser.id, {
                    displayName: discordUser.username,
                    photoURL: discordUser.avatar ? ("https://cdn.discordapp.com/avatars/" + discordUser.id + "/" + discordUser.avatar + ".webp?size=160" ) : "https://cdn.discordapp.com/avatars/1248187665548054588/cc206768cd2ecf8dfe96c1b047caa60f.webp?size=160",
                });
            }

            const token = await auth.createCustomToken(discordUser.id);
            
            event.locals.token = token;
            event.locals.profile = {
                uid: firebaseUser.uid,
                photoURL: firebaseUser.photoURL,
                displayName: firebaseUser.displayName,
            }
        } else if(sessionCookie) {
            const user = await getUser(sessionCookie);

            if(user) {
                event.locals.profile = {
                    uid: user.uid,
                    photoURL: user.photoURL,
                    displayName: user.displayName,
                }
            }
        }
    })();
    
    const response = await resolve(event);

    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "same-origin");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Cache-Control", "no-cache, private");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
});

export function safeParse(input: string) {
    try {
        const output = JSON.parse(input);

        return output;
    } catch(e) {
        return undefined;
    }
}