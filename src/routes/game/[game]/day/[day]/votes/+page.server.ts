import { redirect } from '@sveltejs/kit';

export async function load({ params }) {
    redirect(301, "/bag/" + params.game + "/votes/" + params.day);
}