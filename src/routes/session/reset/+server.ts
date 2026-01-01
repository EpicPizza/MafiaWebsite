import { env } from "$env/dynamic/private";
import {
  firebaseAdmin,
  getUser,
} from "$lib/Firebase/firebase.server";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { DecodedIdToken } from "firebase-admin/auth";

export const POST = (async ({ request, cookies }) => {
  const authorized = await getUser(cookies.get("__session") ?? "---");

  if (authorized) {
    const token: DecodedIdToken = (await firebaseAdmin.getAuth().verifySessionCookie(cookies.get("__session") ?? "---", true).catch(() => undefined)) as DecodedIdToken;

    await firebaseAdmin.getAuth().revokeRefreshTokens(token.sub); //tldr signs out all devices

    cookies.delete("session", { 
      domain: env.DEV === "TRUE" ? undefined : "frcmafia.com",
      path: "/" 
    });

    return json({ deletion: "success" });
  } else {
    throw error(403, "AUTHORIZED");
  }
}) satisfies RequestHandler;
