import { env } from '$env/dynamic/private';

export async function load({ locals }) {
    console.log(locals);

    console.log("hi!");

    return {
        token: locals.token,
        profile: locals.profile,
    }
}