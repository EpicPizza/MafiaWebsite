<script lang=ts>
    import type { Client } from "$lib/Firebase/firebase.svelte";
    import Icon from "@iconify/svelte";

    interface Props {
        client: Client,
        currentURL: string,
    }
    
    const { client, currentURL }: Props = $props();
</script>

{#if client.user}
    <div class="bg-white dark:bg-zinc-800 p-3 py-0 gap-2.5 rounded-md flex items-center w-fit">
        <img alt="{client.user.displayName}'s Profile" src="{client.user.photoURL}" class="rounded-full w-8 h-8">
        <div class="max-w-[calc(100%-1rem)] overflow-hidden">
            <p class='text-xs opacity-75'>Logged in as</p>
            <p class="text-sm font-bold overflow-ellipsis overflow-hidden">{client.user.displayName}</p>
        </div>
        <button onclick={() => { client.signOut(currentURL); }} class="ml-1 w-7 h-7 min-w-7 rounded-full dark:bg-white/10 dark:hover:bg-white/20 bg-black/10 hover:bg-black/20 transition-all flex items-center justify-around" aria-label="Log Out">
            <Icon width=0.9rem icon=material-symbols:logout></Icon>
        </button>
    </div>
{:else}
    <div class="bg-white dark:bg-zinc-800 p-3 py-0 gap-2.5 rounded-md flex items-center w-fit">
        <div class="bg-zinc-200 dark:bg-zinc-900 w-8 h-8 rounded-full flex items-center justify-around">
            <Icon width=1rem icon=material-symbols:satellite-alt></Icon>
        </div>
        <div class="max-w-[calc(100%-1rem)] overflow-hidden">
            <p class='text-xs opacity-75'>You are signed out.</p>
            <p class="text-sm font-bold overflow-ellipsis overflow-hidden">Sign in for live stats/votes!</p>
        </div>
        <a href="/session/register?redirect={encodeURI(currentURL)}" class="ml-0.5 w-7 h-7 min-w-7 rounded-full dark:bg-white/10 dark:hover:bg-white/20 bg-black/10 hover:bg-black/20 transition-all flex items-center justify-around" aria-label="Log Out">
            <Icon width=0.9rem icon=material-symbols:arrow-forward></Icon>
        </a>
    </div>
{/if}