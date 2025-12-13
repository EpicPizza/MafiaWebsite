import { error, redirect } from '@sveltejs/kit';
import { getAllowed } from '../../../session/users.server.js';
import { getUser } from '$lib/Firebase/firebase.server.js';

export async function load({ params, cookies, url, locals }) {
    console.log(url.pathname.substring(0, url.pathname.lastIndexOf("/")));
    console.log(url.searchParams.get("signout"));

    if(url.searchParams.get("signout")) throw redirect(307, url.pathname.substring(0, url.pathname.lastIndexOf("/")));

    const users = await getAllowed();

    if(!locals.profile) throw redirect(307, "/session/register?redirect=" + encodeURI(url.pathname));
    if(!users.includes(locals.profile.uid)) error(403);

    return {
        page: params.page,
    }
}