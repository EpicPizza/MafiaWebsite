import { json, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({ request, cookies }) => {
  cookies.delete("__session", { path: "/" });
  cookies.set("__session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  console.log("Cookie Deleted");

  return json({ deletion: "success" });
}) satisfies RequestHandler;
