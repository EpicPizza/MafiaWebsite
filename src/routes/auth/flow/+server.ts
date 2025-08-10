import { error, json, redirect } from '@sveltejs/kit';
import keys from '../../../../google_client.json';
import { OAuth2Client } from 'google-auth-library';
import { encrypt, getVerifier } from '$lib/Google/helpers.server';
import { EMAIL } from '$env/static/private';
import { firebaseAdmin } from '$lib/Firebase/firebase.server';

export async function GET({ locals, url }) {
    const client = new OAuth2Client({
        clientId: keys.web.client_id,
        clientSecret: keys.web.client_secret,
        redirectUri: keys.web.redirect_uris[0],
    });

    const code = url.searchParams.get('code');
    if(code == null) throw error(400);

    const result = await client.getToken({ code, codeVerifier: await getVerifier() });

    if(!result.tokens.access_token || !result.tokens.refresh_token) throw error(500);

    const tokenInfo = await client.getTokenInfo(result.tokens.access_token);

    console.log(tokenInfo);

    if (!tokenInfo.scopes.includes("https://www.googleapis.com/auth/drive") || tokenInfo.email != EMAIL) throw error(400, "Invalid scopes or email.");

    const encryptedTokens = await encrypt(JSON.stringify(result.tokens));

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('google').doc('tokens');
    await ref.set({
        value: encryptedTokens.encryptedValue,
        iv: encryptedTokens.iv,
    });

    return json("Authentication Success");
}