<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import Icon from '@iconify/svelte';
    import { Tabs } from "melt/builders";
    import { flip } from 'svelte/animate';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import { getContext, onMount, tick, untrack } from 'svelte';
    import type { Client } from '$lib/Firebase/firebase.svelte.js';
    import { collection, limit, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
    import { type Log, type StatsAction } from './types.js';
    import Tag from './votes/[day]/Tag.svelte';
    import Copy from './votes/[day]/Copy.svelte';
    import { page } from '$app/state';
    import { pushState, replaceState } from '$app/navigation';
    import { browser } from '$app/environment';

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
        const votesRef = query(collection(db, "instances", data.instance, "day", data.day.toString(), "votes"), orderBy("timestamp", "desc"), limit(5));
        const statsRef = query(collection(db, "instances", data.instance, "games", data.game.id, "days", data.day.toString(), "stats"));

        unsubscribeVotes = onSnapshot(votesRef, async snapshot => {
            const incoming = snapshot.docs.map(doc => doc.data()).filter(doc => doc != undefined) as Log[];

            incoming.filter(log => log.type == 'standard').map(log => {
                log.search = {
                    for: data.users.find(player => player.id == (log.vote.for == "unvote" ? "---" : log.vote.for))?.nickname,
                    replace: data.users.find(player => player.id == (log.vote.replace ?? "---"))?.nickname,
                    name: data.users.find(player => player.id == log.vote.id)?.nickname ?? "<@" + log.vote.id + ">",
                }
            });

            votes = incoming;
        });

        unsubscribeStats = onSnapshot(statsRef, async snapshot => {
            stats = snapshot.docs.map(doc => ({ ...doc.data(), instance: data.instance, game: data.game.id, day: data.day, type: "add", id: doc.ref.id })) as unknown as StatsAction[];
        });

        return () => {
            if(unsubscribeVotes) unsubscribeVotes();
            if(unsubscribeStats) unsubscribeStats();
        }
    });
    
    const tabs = new Tabs({ value: data.tab });
    const tabIds = ["Home", "Players", "Pins", "Stats", "Votes", "Debug"];

    $effect(() => {
        if('tab' in page.state) {
            tabs.value = page.state.tab as string;
        } else {
            pushTab(data.tab);
        }
    })

    async function pushTab(tab: string) {
        const url = untrack(() => new URL(page.url.toString()));

        url.searchParams.set('tab', tab);

        await tick();

        pushState(url.toString(), { tab: tab });
    }

    function getTag(nickname: string) {
        return data.users.find(user => user.nickname == nickname) ?? { nickname: nickname, pfp: "/favicon.png", id: nickname, color: "#ffffff" } satisfies Omit<(typeof data)["users"][0], "pronouns" | "lName" | "channel">;
    }
</script>

<div class="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
    <div class="max-h-[calc(100dvh-10rem)] md:max-h-full max-w-[calc(100vw-2rem)] overflow-auto w-[40rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl relative">
        
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold mt-0.5">{data.game.name} Mafia</h1>
            <div class="flex items-center gap-1.5 text-yellow-800 bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/15 rounded-md px-3 py-1">
                <Icon width=1.2rem icon=material-symbols:flight-takeoff></Icon>
                <p class="font-bold">Game In Progress</p>
            </div>
        </div>

        <div {...tabs.triggerList} class="bg-zinc-200 dark:bg-zinc-900 px-3 mt-3 py-2 relative rounded-md border-border-light dark:border-border-dark flex gap-2 overflow-x-auto">
            {#each tabIds as id}
                <button {...{... tabs.getTrigger(id), onclick: () => { pushTab(tabs.getTrigger(id).onclick()) } }} class="font-bold {id == tabs.value ? "" : "opacity-50"} min-w-20 relative text-base">
                    {id}
                </button>
            {/each}

            <div style="left: {(tabIds.indexOf(tabs.value) * 5.5) + 1.5}rem" class="bg-black dark:bg-white w-14 h-[3px] bottom-0 absolute rounded-t-full transition-all"></div>
        </div>

        {#each tabIds as id}
            <div {...tabs.getContent(id)}>
                {#if id == "Home"}
                    <div class="border shadow-md dark:shadow-xl border-border-light dark:border-border-dark mt-6 min-h-[30rem] w-full flex items-center justify-around rounded-lg">
                        <div class="flex flex-col gap-2 items-center">
                            <div class="bg-zinc-200 dark:bg-zinc-700 h-20 w-20 rounded-full flex items-center justify-around">
                                <Icon width=3rem icon=material-symbols:construction></Icon>
                            </div>
                            <p class="text-lg font-bold">Under Construction</p>
                        </div>
                    </div>
                {:else if id == "Players"}

                    <div class="mt-4">
                        {#each data.users.sort((a, b) => {
                            const aAlive = data.global.players.find(player => player.id == a.id);
                            const bAlive = data.global.players.find(player => player.id == b.id);

                            return aAlive && !bAlive ? -1 : 1;
                        }) as user, i (user.id)}
                            {@const alive = !!data.global.players.find(player => player.id == user.id)}
                            
                            <div class="flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == data.users.length - 1 ? "rounded-b-lg" : "rounded-b-sm"}">
                                <Tag tag={user}></Tag>
                                <p class="bg-zinc-100 dark:bg-zinc-900 {alive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"} border border-border-light dark:border-border-dark p-2 py-1 rounded-md font-bold text-xs h-fit font-bold">
                                    { alive ? "Alive" : "Dead" }
                                </p>
                            </div>
                        {/each}
                    </div>
                {:else if id == "Votes"}
                    <div class="mt-4 flex gap-2 items-center">
                        <p class="opacity-75">Full Vote History - </p>
                        {#each Array.from({ length: data.day }, (_, i) => i + 1) as day}
                            <a href="/{data.instance}/{data.game.id}/votes/{day}" class="block w-7 h-7 text-sm rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-around">{day}</a>
                        {/each}
                    </div>
                    
                    <div class="bg-zinc-200 dark:bg-zinc-900 p-4 pl-5 rounded-lg mt-4 mb-4 relative overflow-hidden">
                        <p class="text-lg font-bold mb-2">Votes - Today (Day {data.day})</p>
                        <p class="whitespace-pre mb-2.5">
                            {votes.length == 0 || votes[0].board == "" ? "No votes recorded." : votes[0].board}
                        </p>
                        <p class="text-sm opacity-50">
                            {#if data.global.hammer}
                                Hammer is at {data.half + 1} votes.
                            {:else}
                                Auto-hammer disabled.
                            {/if}
                        </p>
                        <div class="w-1 h-full bg-yellow-500 left-0 top-0 absolute"></div>
                    </div>

                    <p class="opacity-75 my-4">Recent Votes</p>

                    {#each votes as log, i (log.timestamp)}
                        <div class="gap-3 sm:gap-0 flex-col sm:flex-row flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == votes.length - 1 ? "rounded-b-lg" : "rounded-b-sm"}">
                            {#if log.type == 'standard'}
                                {@const vote = log.vote}

                                {#if vote.for != 'unvote'}
                                    <div class="flex items-center text-green-500 font-bold gap-0.5">
                                        <Tag tag={getTag(log.search.name)}></Tag>
                                        <Icon scale=1.2rem icon=material-symbols:keyboard-double-arrow-right></Icon>
                                        {#if log.search.replace}
                                            <Tag tag={getTag(log.search.replace)}></Tag>
                                            <Icon scale=1.2rem class="rotate-90 mx-1 text-yellow-500 font-bold" icon=material-symbols:switch-access-shortcut></Icon>
                                        {/if}
                                        <Tag tag={getTag(log.search.for ?? "---")}></Tag>
                                    </div>
                                {:else}
                                    <div class="flex items-center text-red-500 font-bold gap-0.5">
                                        <Tag tag={getTag(log.search.name)}></Tag>
                                        <Icon scale=1.2rem class="rotate-[225deg] mx-0.5 translate-y-0.5" icon=material-symbols:call-missed></Icon>
                                        {#if log.search.replace}
                                            <Tag tag={getTag(log.search.replace)}></Tag>
                                        {/if}
                                    </div>
                                {/if}
                            {:else if log.type == 'reset'}
                                <div class="flex items-center font-bold gap-2">
                                    <div class="py-1 px-2 bg-red-200 border dark:border-none border-red-900 dark:bg-red-900 text-black/70 dark:text-white/90 text-xs rounded-md">RESET</div>
                                    {log.message}
                                </div>
                            {:else}
                                <div class="flex items-center font-bold gap-[5px]">
                                    {#if log.prefix}
                                        <Tag tag={getTag(log.search.name)}></Tag>
                                    {/if}
                                    <p>{log.message}</p>
                                </div>
                            {/if}

                            {#if log.messageId != null}
                                <div class="flex gap-1 items-center ml-auto">
                                    <p class="text-sm mr-2">{dnt.format(new Date(log.timestamp), "h:mm a")}</p>

                                    <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 border border-border-light dark:border-border-dark p-2 py-1 rounded-md font-bold text-xs">
                                        Jump
                                    </a>

                                    <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {:else if id == "Stats"}
                    <p class="whitespace-pre">
                        {JSON.stringify(stats, null, "\t")}
                    </p>
                {:else if id == "Debug"}
                    <p class="whitespace-pre">
                        {JSON.stringify(data, null, "\t")}
                    </p>
                {/if}
            </div>
        {/each}
    </div>
</div>