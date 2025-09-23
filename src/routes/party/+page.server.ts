import { error } from '@sveltejs/kit';
import { getAllowed, getSession } from '../docs/users.server';

export async function load({ params, cookies }) {
    const session = await getSession(cookies.get("__session"), true);

    if(!session) return { username: null };

    return { username: session.username };
}