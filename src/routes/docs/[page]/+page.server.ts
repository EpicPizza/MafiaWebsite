import { error } from '@sveltejs/kit';

export async function load({ params }) {
    return {
        page: params.page,
    }
}