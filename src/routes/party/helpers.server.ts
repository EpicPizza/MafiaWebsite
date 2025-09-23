import { env } from "$env/dynamic/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { decrypt, encrypt } from "$lib/Google/helpers.server";
import en from "date-and-time/locale/en";

export interface Party {
    players: {
        message: string | null,
        role: boolean,
        id: string,
    }[],  
    encrypted: Encrypted | string, 
    iv: string,
    mod: string[],
    state: number,
}

export interface Encrypted {
    roles: {
        name: string,
        description: string,
        type: string,
        message: string,
        id: string,
    }[],
    messages: {
        id: string,
        for: string,
        message: string,
    }[], 
}

export async function getGroup(id: string) {
    const db = firebaseAdmin.getFirestore();
    
    const ref = db.collection('party').doc(id);
    const doc = await ref.get();
    const data = doc.data();
    if(data == undefined) return undefined;

    const decrypted = JSON.parse((await decrypt(data.encrypted, data.iv)).value);

    return {
        ...(data as Party),
        encrypted: decrypted as Encrypted,
        code: id,
    };
}

export async function createGroup(id: string, admin: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('party').doc(id);
    
    const encrypted = await encrypt(JSON.stringify({
        roles: [],
        messages: []
    } satisfies Encrypted));

    await ref.set({
        players: [],
        encrypted: encrypted.encryptedValue,
        iv: encrypted.iv,
        mod: [ env.OWNER ?? "---", admin ],
        state: 312,
    } satisfies Party);
}

// 312 -- game intialized
// 345 -- roles set
// 384 -- showing roles
// 385 -- showing messages
// 390 -- hiding
// 425 -- game ends

