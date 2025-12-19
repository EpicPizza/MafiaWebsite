// See https://kit.svelte.dev/docs/types#app

import type { Instance } from "$lib/Discord/instance.server";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			token?: string
			profile?: {
				photoURL: string | undefined,
				uid: string,
				displayName: string | undefined,
			},
			getInstance: () => Promise<Instance | undefined>,
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
