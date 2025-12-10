import { error } from '@sveltejs/kit';
import { getAllowed, getSession } from '../../users.server.js';

export async function load({ params, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session || !users.includes(session.username)) error(403);

    return {
        page: params.page,
    }
}