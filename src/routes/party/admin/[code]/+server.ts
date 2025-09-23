import { error, json, redirect } from "@sveltejs/kit";
import { getAllowed, getSession } from "../../../docs/users.server";
import { Encrypted, getGroup } from "../../helpers.server";
import { firebase } from "googleapis/build/src/apis/firebase";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { encrypt } from "$lib/Google/helpers.server";

export async function POST({ request, params, cookies }) {
    const users = await getAllowed();
    const session = await getSession(cookies.get("__session"));

    if(!session) throw redirect(307, "/party/signin");
    if(!users.includes(session.username)) throw error(403);

    let group = await getGroup(params.code);
    if(group == undefined) throw error(404);

    if(!(group.mod.includes(session.username) || group.mod.includes("alejandroest"))) throw error(403);

    const action = await request.json() as Request;

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('party').doc(params.code);

    switch(action.action) {
        case 'show':
            await ref.update({ state: action.type == 'roles' ? 384 : 385 });
            break;
        case 'hide':
            await ref.update({ state: 390 });
            break;
        case 'start': 
            const encyrptedStart = await encrypt(JSON.stringify({
                roles: [],
                messages: [],
            }));

            group.players.forEach(player => {
                player.role = false;
                player.message = null;
            })

            await ref.update({ state: 312, players: group.players, encrypted: encyrptedStart.encryptedValue, iv: encyrptedStart.iv  });
            break;
        case 'end':
            await ref.update({ state: 425 });
            break;
        case 'roles':
            const encyrptedRoles = await encrypt(JSON.stringify({
                roles: action.roles,
                messages: group.encrypted.messages,
            }));

            group.players.forEach(player => {
                player.role = true;
            });

            await ref.update({ state: 345, players: group.players, encrypted: encyrptedRoles.encryptedValue, iv: encyrptedRoles.iv });
            break;
        case 'messages':
            action.messages.forEach(message => {
                message.id = crypto.randomUUID();
            });

            const encyrptedMessages = await encrypt(JSON.stringify({
                roles: group.encrypted.roles,
                messages: action.messages.concat(group.encrypted.messages),
            }));

            action.messages.forEach(message => {
                if(group == undefined) return;

                const player = group.players.find(player => message.for == player.id);
                if(player == undefined) return;
                
                player.message = message.id;
                
            })

            await ref.update({ state: 390, players: group.players, encrypted: encyrptedMessages.encryptedValue, iv: encyrptedMessages.iv });
            break;
        case 'remove':
            const playerIndex = group.players.findIndex(player => player.id == action.id);
            const roleIndex = group.encrypted.roles.findIndex(role => role.id == action.id);

            if(playerIndex != -1) group.players.splice(playerIndex, 1);
            if(roleIndex != -1) group.encrypted.roles.splice(roleIndex, 1);

            const encyrptedUpdate = await encrypt(JSON.stringify({
                roles: group.encrypted.roles,
                messages: group.encrypted.messages,
            }));

            await ref.update({ players: group.players, encrypted: encyrptedUpdate.encryptedValue, iv: encyrptedUpdate.iv });
            break;

    }

    group = await getGroup(params.code);
    if(group == undefined) throw error(405);

    return json(group);
}

export type Request = Show | Hide | Start | End | Roles | Messages | Remove;

export interface Show {
    action: 'show',
    type: 'roles' | 'messages',
}

export interface Hide {
    action: 'hide',
}

export interface Start {
    action: 'start'
}

export interface End {
    action: 'end'
}

export interface Remove {
    action: 'remove'
    id: string,
}


export interface Messages {
    action: 'messages',
    messages: NonNullable<Encrypted["messages"]>,
}

export interface Roles {
    action: 'roles',
    roles: NonNullable<Encrypted["roles"]>,
}