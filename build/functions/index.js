/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const v2 = require("firebase-functions/v2");
const functions = require("firebase-functions");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const myRuntimeOptions = {
    concurrency: 8,
    region: 'us-west2',
    memory: "1GiB"
}

let ssrServerServer;
exports.ssrServer = v2.https.onRequest(myRuntimeOptions, async (request, response) => {
    if (!ssrServerServer) {
        functions.logger.info("Initialising SvelteKit SSR entry");
        ssrServerServer = require("./ssrServer/index").default;
        functions.logger.info("SvelteKit SSR entry initialised!");
    }
    functions.logger.info("Requested resource: " + request.originalUrl);
    return ssrServerServer(request, response);
});