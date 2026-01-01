// See https://kit.svelte.dev/docs/types#app

import type { Instance } from "$lib/Discord/instance.server";
import type { Game } from '$lib/Discord/game.server';

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
			origin: string | undefined,
			getInstance: () => Promise<Instance | undefined>,
			getGame: () => Promise<Game | undefined>,
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
