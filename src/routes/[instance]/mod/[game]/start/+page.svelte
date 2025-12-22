<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import { getContext } from 'svelte';
    import User from '../../../../User.svelte';
    import type { Client } from '$lib/Firebase/firebase.svelte.js';
    import Icon from '@iconify/svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { page } from '$app/state';

    const { data } = $props();

    const client = getContext("client") as Client;

    let loaded = $derived(data.loaded)

    let clicked = $state(false);
</script>

{#if client.user}
    <div class="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
        <div class="max-h-[calc(100dvh-10rem)] md:max-h-full max-w-[calc(100vw-2rem)] overflow-auto w-[30rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl relative">
            <h1 class="text-xl font-bold">Start {data.game.name} Mafia</h1>
            <button onclick={() => { loaded = false; invalidateAll(); }} class="absolute right-8 top-7 w-8 h-8 bg-black/10 dark:bg-white/10 transition-all {loaded ? "opacity-100" : "opacity-50"} rounded-md flex items-center justify-around">
                <Icon width=1.3rem icon=material-symbols:refresh></Icon>
            </button>

            <Line class="mb-4 mt-2"></Line>
        
            {#if data.game.signups.map(signup => data.game.confirmations.includes(signup)).filter(signup => !signup).length > 0 }
                <div class="border-2 rounded-xl border-red-500 bg-red-500/20 p-4 flex items-center gap-2">
                    <Icon width=1.3rem icon=material-symbols:cancel></Icon>
                    <p>Confirmations Incomplete</p>
                </div>
            {:else}
                <div class="border-2 rounded-xl border-green-500 bg-green-500/20 p-4 flex items-center gap-2">
                    <Icon width=1.3rem icon=material-symbols:verified></Icon>
                    <p>Confirmations Complete</p>
                </div>
            {/if}   

            <p class="font-semibold text-lg my-4">Signups</p>

            {#each data.game.signups as signup, i}
                {@const user = data.users.find(user => user.id == signup)}

                <div class="flex h-11 items-center justify-between bg-black/10 dark:bg-zinc-900/75 px-2 mb-0.5 {i == 0 ? "rounded-t-xl" : "rounded-t-sm"} {i == data.game.signups.length - 1 ? "rounded-b-xl" : "rounded-b-sm"}">
                    {#if user}
                        <div class="flex items-center gap-2 ml-0.5">
                            <img src="{user.pfp}" alt="{user.nickname}'s profile" class="w-6 h-6 rounded-full">

                            <p class="font-bold text-base" style="color: {user.color};">{user.nickname}</p>
                        </div>
                    {:else}
                        {signup}
                    {/if}

                    <div class="relative z-0">
                        {#if data.game.confirmations.includes(signup)}
                            <Icon class="text-green-600 dark:text-green-600" width=1.6rem icon=material-symbols:verified></Icon>
                        {:else}
                            <Icon class="text-red-600 dark:text-red-600" width=1.6rem icon=material-symbols:cancel></Icon>
                        {/if}
                        <div class="w-4 h-4 bg-white rounded-full absolute -z-10 left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                    </div>
                </div>
            {/each}

            <p class="font-semibold text-lg mb-4 pt-5">Extensions</p>

            {#each data.extensions as extension, i}  
                <div class="flex h-11 items-center justify-between bg-black/10 dark:bg-zinc-900/75 px-3 mb-0.5 {i == 0 ? "rounded-t-xl" : "rounded-t-sm"} {i == data.extensions.length - 1 ? "rounded-b-xl" : "rounded-b-sm"}">
                    <p class="font-semibold">{extension} Extension</p>
                </div>
            {/each}

            <button onclick={() => { clicked = true; goto(page.url.pathname + "/confirm"); }} disabled={data.game.signups.map(signup => data.game.confirmations.includes(signup)).filter(signup => !signup).length > 0 || clicked} class="w-full disabled:opacity-25 h-12 mt-8 flex items-center justify-around font-bold rounded-xl border-2 disabled:cursor-not-allowed bg-orange-200 dark:bg-orange-800 border-orange-400 transition-all">
                {#if clicked == false}
                    Start
                {:else}
                    <div class="w-[18.5px] h-[18.5px] rounded-full border-2 bg-none animate-spin border-t-black border-l-black dark:border-t-white dark:border-l-white border-r-transparent border-b-transparent"></div>
                {/if}
            </button>
        </div>
    </div>

    <div class="fixed bottom-4 left-4">
        <User {client} user={client.user} size=large></User>
    </div>
{/if}