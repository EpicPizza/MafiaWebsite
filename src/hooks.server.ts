
export const handle = (async ({ event, resolve }) => {
    const response = await resolve(event);

    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "same-origin");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Cache-Control", "no-cache, private");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
});