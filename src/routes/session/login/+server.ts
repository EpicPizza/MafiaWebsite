import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import type { Auth, DecodedIdToken, UserRecord } from "firebase-admin/auth";

export const POST = (async ({ request, cookies }) => {
  console.log("setting cookie");

  const encodedToken = request.headers.get("Authorization")?.split(" ")[1];

  if (encodedToken == undefined) {
    throw error(401, "UNAUTHORIZED REQUEST");
  }

  const expiresIn = 1000 * 60 * 60 * 24 * 7 * 2;

  var recent = await checkRecent(encodedToken);

  if (!recent) {
    throw error(401, "UNAUTHORIZED REQUEST");
  }

  try {
    const sessionCookie = await firebaseAdmin
      .getAuth()
      .createSessionCookie(encodedToken, { expiresIn });

    cookies.set("__session", sessionCookie, {
      domain: "frcmafia.com",
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    });

    const user = await getUser(sessionCookie);

    if(user == undefined) throw error(500);

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').doc(user.uid);

    const cookiesRef = db.collection('cookies').doc(user.uid);

    if((await cookiesRef.get()).data() == undefined) {
      await ref.set({
        verified: user.emailVerified,
        cookies: -1,
      });
    } else {
      await ref.set({
        verified: user.emailVerified,
      }, { merge: true });
    }

    return json({ Authorization: "Success" });
  } catch(e) {
    throw error(401, "UNAUTHORIZED REQUEST");
  }
}) satisfies RequestHandler;

async function checkRecent(idToken: string): Promise<Boolean> {
  //prevents using stolen token
  const decodedIdToken = await firebaseAdmin.getAuth().verifyIdToken(idToken);

  return new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60;
}