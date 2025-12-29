import { redirect } from '@sveltejs/kit';

export async function load({ params }) {
    redirect(301, "/bag/" + params.game + "?tab=Votes&day=" + params.day);
}