import { env } from "$env/dynamic/private";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({ request, cookies }) => {
  cookies.delete("__session", { 
    domain: env.DEV === "TRUE" ? undefined : "frcmafia.com",
    path: "/" 
  });
  cookies.set("__session", "", {
    domain: env.DEV === "TRUE" ? undefined : "frcmafia.com",
    maxAge: 0,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  console.log("Cookie Deleted");

  return json({ deletion: "success" });
}) satisfies RequestHandler;
