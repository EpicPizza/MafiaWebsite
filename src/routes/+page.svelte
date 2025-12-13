
<script lang="ts">
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import type { Client } from "$lib/Firebase/firebase.svelte";
    import Icon from "@iconify/svelte";
    import { getContext } from "svelte";
    import User from "./User.svelte";
    
    const client = getContext("client") as Client;

    $inspect(client.user)
</script>

<svelte:head>
    <meta property="og:title" content="UCSC '29 Mafia" />
    <meta property="og:description" content="Play mafia on the UCSC '29 discord server!" />
</svelte:head>

<Background>
    <div class="h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
        <div class="max-w-[calc(100vw-2rem)] overflow-auto w-[42rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 justify-between">
                <h1 class="text-2xl font-bold">UCSC '29 Mafia</h1>
            </div>
            <Line class="mb-6 mt-2"></Line>

            <div class="mb-8">
                <div class="grid sm:grid-cols-2 gap-3">
                    <a href="/docs/join-mafia" class="p-4 bg-teal-200 dark:bg-teal-900 border-2 border-teal-400 rounded-md relative overflow-hidden">
                        <div class="flex items-center gap-1.5 text-lg mb-2">
                            <Icon width=1.25rem icon="material-symbols:diamond-shine-outline"></Icon>
                            <p class="font-bold">Play Mafia</p>
                        </div>
                        <p class="text-sm opacity-80">Join the #FRCBayAreaGang discord server.</p>
                    </a>
                    <a href="/docs/overview" class="p-4 bg-zinc-200 dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-md relative overflow-hidden">
                        <div class="flex items-center gap-1.5 text-lg mb-2">
                            <Icon width=1.25rem icon="material-symbols:book-outline"></Icon>
                            <p class="font-bold">Rules</p>
                        </div>
                        <p class="text-sm opacity-80">View how to play and all the rules of BAG mafia.</p>
                    </a>
                    <a href="/docs/help" class="p-4 bg-zinc-200 dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-md relative overflow-hidden">
                        <div class="flex items-center gap-1.5 text-lg mb-2">
                            <Icon width=1.25rem icon="material-symbols:code-blocks-outline"></Icon>
                            <p class="font-bold">Help</p>
                        </div>
                        <p class="text-sm opacity-80">How to use Mafia Bot to join, play, and mod games.</p>
                    </a>
                    <a href="https://docs.frcmafia.com/" class="p-4 bg-zinc-200 dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-md relative overflow-hidden">
                        <div class="flex items-center gap-1.5 text-lg mb-2">
                            <Icon width=1.25rem icon="material-symbols:document-search-outline"></Icon>
                            <p class="font-bold">Documentation</p>
                        </div>
                        <p class="text-sm opacity-80"><span class="line-through">In progress</span> documentation on the inner workings of Mafia Bot.</p>
                    </a>
                </div>
            </div>    

            <div class="flex flex-col sm:flex-row gap-5 sm:items-center justify-between opacity-75 dark:opacity-100">
                <p class="text-base opacity-80 flex items-center gap-2 italic">
                    we are not a cult
                </p>
            </div>
        </div>
    </div>
    
    {#if client.user}
        <div class="bottom-4 left-4 fixed">
            <User {client} user={client.user}></User>
        </div>
    {/if}
</Background>