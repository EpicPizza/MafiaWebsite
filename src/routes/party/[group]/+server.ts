import { error } from "console";
import { getAllowed, getSession } from "../../docs/users.server";
import { createGroup, getGroup } from "../helpers.server";
import { json, redirect } from "@sveltejs/kit";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";

export async function POST({ request, params, cookies }) {
    const session = await getSession(cookies.get("__session"));
    if(session == undefined) throw redirect(307, "/party/signin");

    const group = await getGroup(params.group);
    if(group == undefined) throw error(404);

    if(group.players.find(player => player.id == session.username) == undefined) throw error(400, "You're not part of this game?");

    const playerRequest = await request.json() as PlayerRequest;

    if(playerRequest.action == "role") {
        const role = group.encrypted.roles.find(role => role.id == session.username);

        if(role == undefined) throw error(404);

        return json(role);
    } else if(playerRequest.action == "message") {
        const message = group.encrypted.messages.find(message => message.id == playerRequest.id);

        if(message == undefined) throw error(404);
        if(message.for != session.username) throw error(400);

        return json(message);
    }
}

export type PlayerRequest = GetRole | GetMessage;

export interface GetRole  {
    action: "role"
}

export interface GetMessage {
    action: "message"
    id: string,
}

export async function PATCH({ request, params, cookies }) {
    const session = await getSession(cookies.get("__session"));
    if(session == undefined) throw redirect(307, "/party/signin");

    const group = await getGroup(params.group);
    if(group == undefined) throw error(404);

    if(group.players.find(player => player.id == session.username)) return json({ joined: true });

    const db = firebaseAdmin.getFirestore();
    const ref = db.collection('party').doc(params.group);

    group.players.push({
        id: session.username,
        role: false,
        message: null
    });

    await ref.update({ players: group.players });

    return json({ joined: true });
}