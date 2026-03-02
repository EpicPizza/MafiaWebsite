import { error } from '@sveltejs/kit';

export async function load({ params, cookies, locals }) {
    if (!locals.profile) return { username: null };

    return { username: locals.profile.displayName };
}