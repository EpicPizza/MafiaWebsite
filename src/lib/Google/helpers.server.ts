import { env } from "$env/dynamic/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { error } from "node:console";

export async function hash() {
	const random = crypto.randomUUID();
	
	const db = firebaseAdmin.getFirestore();

	const ref = db.collection("google").doc("flow");

	const { encryptedValue, iv } = await encrypt(random);

	ref.set({
		verifier: encryptedValue,
		iv: iv,
	});

	const hash = createHash("sha256").update(crypto.randomUUID()).digest("hex");

	return createHash("sha256").update(random).digest("base64url");
}

export async function getVerifier() {
	const db = firebaseAdmin.getFirestore();

	const ref = db.collection("google").doc("flow");

	const doc = await ref.get();

	const data = doc.data();

	if (!doc.exists || data == undefined || !("verifier" in data) || !("iv" in data)) throw error(400);

	const verifier = data.verifier as string;
	const iv = data.iv as string;

	const { value } = await decrypt(verifier, iv);

	return value;
}

export async function encrypt(value: string) {
	const key = Buffer.from(env.GOOGLE_KEY, "hex");
	const iv = randomBytes(16);

	const cipher = createCipheriv("aes-256-cbc", key, iv);

	const encryptedValue =
		cipher.update(value, "utf8", "hex") + cipher.final("hex");

	return { encryptedValue, iv: iv.toString("hex") };
}

export async function decrypt(encryptedValue: string, iv: string) {
	const key = Buffer.from(env.GOOGLE_KEY, "hex");

	const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));

	const value =
		decipher.update(encryptedValue, "hex", "utf8") + decipher.final("utf8");

	return { value };
}
