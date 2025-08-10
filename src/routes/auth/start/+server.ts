import { redirect } from '@sveltejs/kit';
import keys from '../../../../google_client.json';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { hash } from '$lib/Google/helpers.server';

export async function GET({ locals }) {
    const client = new OAuth2Client({
        clientId: keys.web.client_id,
        clientSecret: keys.web.client_secret,
        redirectUri: keys.web.redirect_uris[0],
    });

    const authorizeUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/drive'
        ],
        prompt: "consent",
        code_challenge: await hash(),
        code_challenge_method: CodeChallengeMethod.S256,
    });

    throw redirect(307, authorizeUrl);
    
}