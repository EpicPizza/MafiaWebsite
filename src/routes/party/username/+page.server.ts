import { error, redirect } from '@sveltejs/kit';
import { getAllowed, getSession } from '../../docs/users.server';

export async function load({ params, cookies }) {
    const session = await getSession(cookies.get("__session"), true);

    if(session) throw redirect(307, "/party");
}