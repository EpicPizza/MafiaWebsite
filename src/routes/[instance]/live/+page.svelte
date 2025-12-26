<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import { getContext } from 'svelte';
    import User from '../../User.svelte';
    import type { Client } from '$lib/Firebase/firebase.svelte.js';
    import Icon from '@iconify/svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { page } from '$app/state';
    import { collection, limit, onSnapshot, orderBy, query, type Unsubscribe } from '@firebase/firestore';
    import type { Log, StatsAction } from './types';
    import Background from '$lib/Builders/Background.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import Tag from '../../game/[game]/day/[day]/votes/Tag.svelte';
    import Copy from '../../game/[game]/day/[day]/votes/Copy.svelte';

    dnt.plugin(meridiem);

    const { data } = $props();

    const client = getContext("client") as Client;

    let unsubscribeStats = undefined as Unsubscribe | undefined;
    let unsubscribeVotes = undefined as Unsubscribe | undefined;

    let votes = $derived(data.votes);
    let stats = $derived(data.stats);

    $effect(() => {
        if(!client.user) return;

        if(unsubscribeVotes) unsubscribeVotes();
        if(unsubscribeStats) unsubscribeStats();

        const db = client.getFirestore();
        const votesRef = query(collection(db, "instances", data.instance, "day", data.day.toString(), "votes"), orderBy("timestamp", "desc"), limit(3));
        const statsRef = query(collection(db, "instances", data.instance, "games", data.game.id, "days", data.day.toString(), "stats"));

        unsubscribeVotes = onSnapshot(votesRef, async snapshot => {
            votes = snapshot.docs.map(doc => doc.data()).filter(doc => doc != undefined) as Log[];
        });

        unsubscribeStats = onSnapshot(statsRef, async snapshot => {
            stats = snapshot.docs.map(doc => ({ ...doc.data(), instance: data.instance, game: data.game.id, day: data.day, type: "add", id: doc.ref.id })) as unknown as StatsAction[];
        });

        return () => {
            if(unsubscribeVotes) unsubscribeVotes();
            if(unsubscribeStats) unsubscribeStats();
        }
    })

    function getTag(nickname: string) {
        return data.players.find(tag => tag.nickname == nickname) ?? { nickname: nickname, pfp: "/favicon.png", id: nickname, color: "#ffffff" } as unknown as (typeof data)["players"][0];
    }
</script>

<Background>
    <div class="bg-zinc-800 w-[50rem] max-w-[calc(100%+2rem)] -mx-4 h-[100dvh] -my-4 shadow-xl p-6">
        <div class="bg-zinc-900 p-4 rounded-xl flex justify-between items-center mb-4">
            <div>
                <h1 class="text-xl font-bold">{data.game.name} Mafia</h1>
                <h2 class="text-base opacity-50 italic">
                    {#if data.locking}
                        Game will {data.locking.type ? "lock" : "unlock"} at {dnt.format(new Date(data.locking.when), "MMMM D, h:mm:ss A")}
                    {:else}
                        No scheduled lock/unlock.
                    {/if}
                </h2>
            </div>

            <div class="bg-red-600 rounded-md px-3 py-1.5 animate-pulse">
                <p class="text-white font-extrabold">Day {data.day}</p>
            </div>
        </div>

        <div class="flex gap-2 w-full">
            <div class="bg-zinc-900 w-1/3 p-4 rounded-xl">
                <p class="font-bold text-lg">Votes</p>

                {#each votes as log}  
                    {#if log.type == 'standard'}
                        {@const vote = log.vote}

                        <div class="flex justify-between items-center mb-2">
                            {#if vote.for != 'unvote'}
                                <div class="flex items-center text-green-500 font-bold gap-0.5">
                                    <Tag tag={getTag(log.search.name)}></Tag>
                                    <Icon scale=1.2rem icon="material-symbols:keyboard-double-arrow-right"></Icon>
                                    {#if log.search.replace}
                                        <Tag tag={getTag(log.search.replace)}></Tag>
                                        <Icon scale=1.2rem class="rotate-90 mx-1 text-yellow-500 font-bold" icon="switch_access_shortcut"></Icon>
                                    {/if}
                                    <Tag tag={getTag(log.search.for ?? "---")}></Tag>
                                </div>
                            {:else}
                                <div class="flex items-center text-red-500 font-bold gap-0.5">
                                    <Tag tag={getTag(log.search.name)}></Tag>
                                    <Icon scale=1.2rem class="rotate-[225deg] mx-0.5 translate-y-0.5" icon="material-symbols:call-missed"></Icon>
                                    {#if log.search.replace}
                                        <Tag tag={getTag(log.search.replace)}></Tag>
                                    {/if}
                                </div>
                            {/if}

                            {#if log.messageId != null}
                                <div class="flex gap-1">
                                    <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 p-2 py-1 rounded-md font-bold text-xs">
                                        Jump
                                    </a>

                                    <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}

                <div class="dark:bg-zinc-800 bg-zinc-100 w-full p-3 px-5 relative overflow-hidden rounded-lg mb-6">
                    <div class="h-full absolute top-0 left-0 w-1 bg-yellow-400"></div>
                    {#if votes.length > 0 && votes[0].board != ""}
                        <p class="mb-1 text-sm whitespace-pre-wrap">{votes[0].board}</p>
                    {:else}
                        <p class="mb-1 text-sm whitespace-pre-wrap">No Votes Recorded</p>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</Background>

{#if client.user}
    <div class="fixed bottom-4 left-4 z-10 shadow-lg">
        <User {client} user={client.user} size=large></User>
    </div>
{/if}