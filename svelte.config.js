import {preprocessMeltUI, sequence} from "@melt-ui/pp";
import {vitePreprocess} from '@sveltejs/kit/vite';
import firebase from "svelte-adapter-firebase";
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: firebase(),
    csrf: {
      checkOrigin: true,
    },
    csp: {
       directives: {
        'script-src': ['self']
      },
    }
  }
};
export default config;
