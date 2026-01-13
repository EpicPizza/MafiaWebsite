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
    import Tag from './Tag.svelte';
    import Copy from './Copy.svelte';
    import { page } from '$app/state';
    import { pushState, replaceState } from '$app/navigation';
    import { browser } from '$app/environment';
    import { toggle } from '@melt-ui/svelte/internal/helpers';
    import { Html, LayerCake } from 'layercake';
    import AxisX from '$lib/LayerCake/Scatter/AxisX.svelte';
    import AxisY from '$lib/LayerCake/Scatter/AxisY.svelte';
    import Scatter from '$lib/LayerCake/Scatter/Scatter.svelte';
    import Vote from './Vote.svelte';
    import User from './User.svelte';
    import Message from './Message.svelte';
    import TimeGraph from './TimeGraph.svelte';

    dnt.plugin(meridiem);

    const { data } = $props();

    const client = getContext("client") as Client;

    let unsubscribeStats = undefined as Unsubscribe | undefined;
    let unsubscribeVotes = undefined as Unsubscribe | undefined;

    let votes = $derived(data.votes);
    let stats = $derived(data.stats);

    $effect(() => {
        if(unsubscribeVotes) unsubscribeVotes();

        if((!client.user && data.profile == undefined) || data.global.game != data.game.id || !(data.global.started && data.global.day == selectedDay)) {
            votes = data.days[selectedDay - 1].votes;

            return;
        }

        const db = client.getFirestore();
        const votesRef = query(collection(db, "instances", data.instance, "games", data.game.id, "days", selectedDay.toString(), "votes"), orderBy("timestamp", "desc"));

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

        return () => {
            if(unsubscribeVotes) unsubscribeVotes();
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

    $inspect(data.users);

    function getTag(nickname: string) {
        return data.users.find(user => user.nickname == nickname) ?? { nickname: nickname, pfp: "/favicon.png", id: nickname, color: "#ffffff" } satisfies Omit<(typeof data)["users"][0], "pronouns" | "state" | "lName" | "channel" | "i">;
    }

    let selectedDay = $state(data.activeDay ? data.activeDay : (data.game.state == 'active' ? data.day : 1));
    let showPit = $state(data.pitStats != undefined);

    $effect(() => {
        if(unsubscribeStats) unsubscribeStats();

        if(showPit && data.pitStats) {
            const players = data.days[data.pitStats.day - 1].players ?? [];

            stats = data.pitStats.stats.filter(stat => players.length == 0 || players.includes(stat.id));
            
            return;
        }

        if((!client.user && data.profile == undefined) || data.global.game != data.game.id || !(data.global.started && data.global.day == selectedDay)) {
            const players = data.days[selectedDay - 1].players;
            
            stats = data.days[selectedDay - 1].stats.filter(stat => players.length == 0 || players.includes(stat.id));

            return;
        }

        console.log('initializer started');

        const db = client.getFirestore();
        
        const statsRef = query(collection(db, "instances", data.instance, "games", data.game.id, "days", selectedDay.toString(), "stats"));

        unsubscribeStats = onSnapshot(statsRef, async snapshot => {
            const players = data.days[selectedDay - 1].players;

            const incomingStats = (snapshot.docs.map(doc => ({ ...doc.data(), instance: data.instance, game: data.game.id, day: selectedDay.toString(), type: "add", id: doc.ref.id })) as unknown as StatsAction[]).filter(stat => data.users.find(user => user.id == stat.id));

            stats = incomingStats.filter(stat => players.length == 0 || players.includes(stat.id));
        });

        return () => {
            if(unsubscribeStats) unsubscribeStats();
        }
    });

    let sortingMessages = $state("messages");
    let typeMessages = $state("des");
    let hidePlayers: string[] = $state([]);

    let shownMessages = $derived(stats.filter(point => !hidePlayers.includes(point.id)));

    function sortMessages(which: string) {
        if(which == sortingMessages) {
            typeMessages = typeMessages == "des" ? "asc" : "des";
        } else {
            typeMessages = "des";
            sortingMessages = which;
        }
    }

    const sortedStats = $derived.by(() => {
        const copy = [...stats];

        copy.sort((a, b) => {
            if(sortingMessages == "messages") {
                return typeMessages == "des" ? b.messages - a.messages : a.messages - b.messages;
            } else if(sortingMessages == "name") {
                const aName = data.users.find(user => user.id == a.id)?.lName ?? ".";
                const bName = data.users.find(user => user.id == b.id)?.lName ?? ".";

                if(typeMessages == "des") {
                    return bName < aName ? 1 : aName < bName ? -1 : 0;
                } else {
                    return bName < aName ? -1 : aName < bName ? 1 : 0;
                }
            } else if(sortingMessages == "words") {
                return typeMessages == "des" ? b.words - a.words : a.words - b.words;
            } else if(sortingMessages == "wpm") {
                return typeMessages == "des" ?  (b.messages == 0 ? 0 : b.words / b.messages) - (a.messages == 0 ? 0 : a.words / a.messages) : (a.messages == 0 ? 0 : a.words / a.messages) - (b.messages == 0 ? 0 : b.words / b.messages);
            } else if(sortingMessages == "images" && a.images && b.images) {
                return typeMessages == "des" ? b.images - a.images : a.images - b.images;
            } else {
                return 0;
            }
        });

        return copy;
    });

    const xKeyMessages = 'messages';
    const yKeyMessages = 'words';

    const r = 4.5;
    const padding = 2.5;
    const fill = '#000';
    const stroke = '#0cf';
    const strokeWidth = 1.5;

    let userOpen = $state(false);

    let messageType = $state('pinned') as 'pinned' | 'stars';
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={() => { userOpen = false; }} class="h-[calc(100dvh)] -m-4 sm:m-0 md:h-[calc(100dvh-2rem)] flex flex-col items-center">
    <div class="max-h-full max-w-[calc(100vw)] sm:max-w-[calc(100vw-2rem)] overflow-auto w-[40rem] bg-white dark:bg-zinc-800 border-b sm:border border-border-light dark:border-border-dark p-6 sm:p-8 sm:rounded-2xl relative">
        <div class="bg-white dark:bg-zinc-800 sticky -top-8 z-50 px-4 -mx-4 pt-8 pb-2 -mb-2 -mt-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    {#if data.game.state == 'active'}
                        <div class="gap-2 text-yellow-800 bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/15 rounded-md w-8 h-8 flex justify-around items-center">
                            <Icon width=1.2rem icon=material-symbols:flight-takeoff></Icon>
                        </div>
                    {:else}
                        <div class="gap-2 text-red-800 bg-red-200 dark:text-red-400 dark:bg-red-500/15 rounded-md w-8 h-8 flex justify-around items-center">
                            <Icon width=1.2rem icon=material-symbols:flight-land></Icon>
                        </div>
                    {/if}
                    
                    <h1 class="text-xl font-bold mt-0.5">{data.game.name} Mafia</h1>
                </div>

                <div class="hidden sm:block">
                    <User {client} currentURL={page.url.pathname + page.url.search}></User>
                </div>
            
                <div class="block sm:hidden h-9 pt-0.5">
                    <button onclick={(e) => { e.stopPropagation(); userOpen = !userOpen; }} class="h-8 w-8 flex items-center justify-around bg-zinc-200 dark:bg-zinc-900 rounded-full">
                        <Icon width=1.1rem icon=material-symbols:more-vert></Icon>
                    </button>

                    {#if userOpen}
                        <div class="p-4 px-1 rounded-lg bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark right-0 top-[4.5rem] absolute z-50">
                            <User {client} currentURL={page.url.pathname + page.url.search}></User>
                        </div>
                    {/if}
                </div>
            </div>

            <div {...tabs.triggerList} class="bg-zinc-200 dark:bg-zinc-900 px-3 mt-3 py-2 relative rounded-lg border-border-light dark:border-border-dark flex gap-2 overflow-x-auto">
                {#each tabIds as id}
                    <button {...{... tabs.getTrigger(id), onclick: () => { pushTab(tabs.getTrigger(id).onclick()) } }} class="font-bold {id == tabs.value ? "" : "opacity-50"} min-w-20 relative text-base">
                        {id}
                    </button>
                {/each}

                <div style="left: {(tabIds.indexOf(tabs.value) * 5.5) + 1.5}rem" class="bg-black dark:bg-white w-14 h-[3px] bottom-0 absolute rounded-t-full transition-all"></div>
            </div>
        </div>

        {#each tabIds as id}
            <div {...tabs.getContent(id)}>
                {#if id == "Home"}
                    {#if data.game.state == 'active'}
                        <div class="flex items-center gap-2 text-yellow-800 bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/15 rounded-md px-3 py-2 mt-5">
                            <Icon width=1.2rem icon=material-symbols:flight-takeoff></Icon>
                            <p class="font-bold max-w-min sm:max-w-fit">Game In Progress</p>
                        </div>
                    {:else}
                        <div class="flex items-center gap-2 text-red-800 bg-red-200 dark:text-red-400 dark:bg-red-500/15 rounded-md px-3 py-2 mt-5">
                            <Icon width=1.2rem icon=material-symbols:flight-land></Icon>
                            <p class="font-bold max-w-min sm:max-w-fit">Game Completed</p>
                        </div>
                    {/if}
                {:else if id == "Players"}
                    {#if data.mods.length > 0}
                        <p class="opacity-75 mb-2 mt-5">Mods</p>

                        {#each data.mods as user, i}
                            <div class="flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == data.mods.length - 1 ? "rounded-b-lg" : "rounded-b-sm"} font-bold">
                                <Tag pronouns tag={user}></Tag>
                            </div>
                        {/each}
                    {/if}

                    <p class="opacity-75 my-5 mb-2">Players</p>

                    {#each data.users as user, i}
                        {@const alive = !!data.global.players.find(player => player.id == user.id)}
                        
                        <div class="flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == data.users.length - 1 ? "rounded-b-lg" : "rounded-b-sm"} font-bold">
                            <Tag pronouns tag={user}></Tag>
                            {#if data.game.state == 'active' && data.global.game == data.game.id}
                                <p class="bg-zinc-100 dark:bg-zinc-900 {alive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"} border border-border-light dark:border-border-dark p-2 py-1 rounded-md text-xs h-fit">
                                    { alive ? "Alive" : "Dead" }
                                </p>
                            {:else if data.game.state != 'active'}
                                {@const alignment = data.game.alignments[user.i]}
                                
                                <div class="flex items-center gap-2">
                                    {#if data.game.winners.includes(user.id)}
                                        <Icon width=1.25rem class="text-yellow-600 dark:text-yellow-500" icon=material-symbols:crown></Icon>
                                    {/if}

                                    <p class="bg-zinc-100 dark:bg-zinc-900 border border-border-light dark:border-border-dark p-2 py-1 rounded-md text-xs h-fit">
                                        {#if alignment == "Town"}
                                            <span class="text-green-600 dark:text-green-500">Town</span>
                                        {:else if alignment == "Neutral"}
                                            <span class="text-yellow-600 dark:text-yellow-500">Neutral</span>
                                        {:else if alignment == "Mafia"}
                                            <span class="text-red-600 dark:text-red-500">Mafia</span>
                                        {:else if alignment == "Modkilled"}
                                            <span class="text-zinc-600 dark:text-zinc-500">Modkilled</span>
                                        {:else}
                                            <span class="text-purple-600 dark:text-purple-500">{alignment}</span>
                                        {/if}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {:else if id == "Pins"}
                    {@const messages = data.messages.filter(message => messageType == 'pinned' ? message.pinned : message.stars != undefined && message.stars >= 3)}
                
                    <div class="flex items-center justify-between my-5 mb-2">
                        <p class="opacity-75">{messages.length} Message{messages.length == 1 ? "" : "s"}</p>

                        <div class="flex items-center gap-0.5 font-bold">
                            <button onclick={() => { messageType = 'stars' }} class="px-2 py-1 rounded-r-sm rounded-l-md {messageType != 'stars' ? "bg-zinc-200 dark:bg-zinc-900" : "bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black"} text-xs flex items-center gap-1">
                                <Icon icon=material-symbols:star></Icon>
                                Stars
                            </button>
                            <button onclick={() => { messageType = 'pinned' }} class="px-2 py-1 rounded-r-md rounded-l-sm {messageType != 'pinned' ? "bg-zinc-200 dark:bg-zinc-900" : "bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black"} text-xs flex items-center gap-1">
                                <Icon icon=material-symbols:keep></Icon>
                                Pins
                            </button>
                        </div>
                    </div>
                        
                    {#each messages as message, i} 
                        {@const user = data.messageUsers.find(user => user.id == message.authorId)}

                        <div class="bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 pt-3.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == messages.length - 1 ? "rounded-b-lg" : "rounded-b-sm"}">
                            <Message {message} {user}></Message>
                        </div>
                    {:else}
                        <div class="bg-zinc-200 dark:bg-zinc-900 px-3 pl-4 py-2.5 pt-2.5 mb-0.5 rounded-lg font-bold">
                            No Messages Found...
                        </div>
                    {/each}
                {:else if id == "Votes"}
                    <p class="opacity-75 mt-5 mb-2">Day</p>

                    <div class="flex gap-0.5">
                        {#each Array.from({ length: data.day }, (_, i) => i + 1) as day}
                            <button onclick={() => { selectedDay = day; showPit = false; }} class="text-base text-center {selectedDay == day ? "bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-900"} px-3 py-2.5 w-full {day == 1 ? "rounded-l-lg" : "rounded-l-sm"} {day == data.day ? "rounded-r-lg" : "rounded-r-sm"} font-bold">
                                {day}
                            </button>
                        {/each}
                    </div>

                    <div class="mt-5 mb-2 flex gap-2 items-center">
                        <p class="opacity-75">
                            {#if data.global.started && data.global.game == data.game.id && data.global.day == selectedDay}
                                Current Votes
                            {:else}
                                Final Votes
                            {/if}
                        </p>
                    </div>
                    
                    <div class="bg-zinc-200 dark:bg-zinc-900 p-4 pl-5 rounded-lg mb-4 relative overflow-hidden">
                        <p class="text-lg font-bold mb-2">Votes - {data.global.started && data.global.game == data.game.id && data.global.day == selectedDay ? "Today (Day " + selectedDay + ")" : "Day " + selectedDay}</p>
                        <p class="whitespace-pre-wrap">
                            {votes.length == 0 || votes[0].board == "" ? "No votes recorded." : votes[0].board}
                        </p>
                        {#if data.global.started && data.global.game == data.game.id && data.global.day == selectedDay}
                            <p class="text-sm opacity-50 mt-2.5">
                                {#if data.global.hammer}
                                    Hammer is at {data.half + 1} votes.
                                {:else}
                                    Auto-hammer disabled.
                                {/if}
                            </p>
                        {/if}
                        <div class="w-1 h-full bg-yellow-500 left-0 top-0 absolute"></div>
                    </div>

                    <p class="opacity-75 mt-5 mb-2">Vote History</p>

                    {#each votes as log, i (log.timestamp)}
                        <Vote {getTag} {log} top={i == 0} bottom={i == votes.length - 1} link={data.link}></Vote>
                    {:else}
                        <p class="gap-3 font-bold pl-4 sm:gap-0 flex-col sm:flex-row flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 rounded-lg">
                            No Votes Yet...
                        </p>
                    {/each}
                {:else if id == "Stats"}
                    {@const timeStats = data.days[selectedDay - 1].timeStats}

                    <div class="flex items-center justify-between opacity-75 mt-5 mb-2">
                        <p>Day</p>

                        {#if data.pitStats}
                            <a href="/legacy/{data.pitStats.id}" class="text-sm">Generated Day {data.pitStats.day}, {dnt.format(new Date(data.pitStats.timestamp), "h:mm A")}</a>
                        {/if}
                    </div>

                    <div class="flex gap-0.5">
                        {#each Array.from({ length: data.day }, (_, i) => i + 1) as day}
                            <button onclick={() => { selectedDay = day; showPit = false; }} class="text-base text-center {selectedDay == day && showPit == false ? "bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-900"} px-3 py-2.5 w-full {day == 1 ? "rounded-l-lg" : "rounded-l-sm"} {day == data.day && data.pitStats == undefined ? "rounded-r-lg" : "rounded-r-sm"} font-bold">
                                {day}
                            </button>
                        {/each}

                        {#if data.pitStats}
                            <button onclick={() => { showPit = true; }} class="text-base text-center {showPit == true ? "bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-900"} px-3 py-2.5 w-full rounded-l-sm rounded-r-lg font-bold">
                                /?
                            </button>
                        {/if}
                    </div>

                    <div class="flex opacity-75 mt-5 mb-2 px-2.5 text-xs sm:text-base">
                        <div class="w-2/5 sm:w-1/4 flex items-center">
                            {@render toggle("name")}

                            Player
                        </div>
                        <div class="w-1/5 sm:w-1/4 flex items-center">
                            {@render toggle("messages")}

                            <span class="inline sm:hidden">Mes</span>
                            <span class="hidden sm:inline">Messages</span>
                        </div>
                        <div class="w-1/5 sm:w-1/4 flex items-center">
                            {@render toggle("words")}

                            <span class="inline sm:hidden">Wrd</span>
                            <span class="hidden sm:inline">Words</span>
                        </div>
                        <div class="w-1/5 sm:w-1/4 flex items-center">
                            {@render toggle("wpm")}

                            WPM
                        </div>
                    </div>

                    {#each sortedStats as stat, i (stat.id)}
                        {@const user = data.users.find(user => user.id == stat.id) ?? getTag(stat.id)}

                        <div class="flex items-center text-sm sm:text-base bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i == 0 ? "rounded-t-lg" : "rounded-t-sm"} {i == stats.length - 1 ? "rounded-b-lg" : "rounded-b-sm"}">
                            <button onclick={() => { 
                                const index = hidePlayers.indexOf(user.id);

                                if(index == -1) {
                                    hidePlayers.push(user.id);
                                } else {
                                    hidePlayers.splice(index, 1);
                                }
                            }} class="w-2/5 sm:w-1/4 transition-all font-bold {hidePlayers.includes(user.id) ? "opacity-30" : ""}">
                                <Tag tag={user}></Tag>
                            </button>
                             <div class="w-1/5 sm:w-1/4">
                                {stat.messages}
                            </div>
                            <div class="w-1/5 sm:w-1/4">
                                {stat.words}
                            </div>
                            <div class="w-1/5 sm:w-1/4">
                                {stat.messages == 0 ? (0).toFixed(2) : (stat.words / stat.messages).toFixed(2)}
                            </div>
                        </div>
                    {:else}
                        <p class="gap-3 font-bold pl-4 sm:gap-0 flex-col sm:flex-row flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 rounded-lg">
                            No Stats Yet...
                        </p>
                    {/each}

                    <div class="flex items-center gap-1 mt-1.5 opacity-75 ml-3.5 -mb-1">
                        <Icon icon=material-symbols:arrow-upward></Icon>
                        <p class="text-sm">Click to hide on graph.</p>
                    </div>

                    <p class="opacity-75 mt-5 mb-2">Graphs</p>

                    <div class="bg-zinc-200 dark:bg-zinc-900 rounded-lg {timeStats != undefined && showPit != true ? "mb-0.5 rounded-b-sm" : ""} p-4 pl-1 pb-9">
                        <div class="chart-container ml-7">
                            <LayerCake
                                ssr
                                percentRange
                                padding={{ top: 10, right: 5, bottom: 20, left: 25 }}
                                x={xKeyMessages}
                                y={yKeyMessages}
                                xPadding={[padding, padding]}
                                yPadding={[padding, padding]}
                                data={shownMessages}
                            >
                        
                            <Html>
                                <AxisX label={xKeyMessages} />
                                <AxisY label={yKeyMessages} />
                                <Scatter
                                    {r}
                                    {fill}
                                    {stroke}
                                    {strokeWidth}
                                    formatLabel={(input: any) => (data.users.find(user => user.id == input.id)?.nickname ?? input)}
                                />
                            </Html>
                        
                            </LayerCake>
                        </div>
                    </div>

                    {#if timeStats != undefined && timeStats.length != 0 && showPit != true}
                        {@const players = data.days[selectedDay - 1].players ?? []}

                        <div class="bg-zinc-200 dark:bg-zinc-900 rounded-b-lg rounded-t-sm p-4">
                            <TimeGraph users={data.users.filter(user => players.length == 0 || players.includes(user.id))} stats={timeStats}></TimeGraph>
                        </div>  
                    {/if}
                {:else if id == "Debug"}
                    <p class="whitespace-pre">
                        {JSON.stringify(data, null, "\t")}
                    </p>
                {/if}
            </div>
        {/each}
    </div>
</div>

{#snippet toggle(field: string)}
    <button onclick={() => { sortMessages(field); }} class="h-5 w-5 min-w-5 border border-border-light dark:border-border-dark rounded-sm flex items-center justify-around sm:mr-1.5 relative">
        {#if sortingMessages != field}
            <Icon class="absolute" width=1rem icon=material-symbols:check-indeterminate-small></Icon>
        {:else if typeMessages == "des"}
            <Icon class="absolute" width=1rem icon=material-symbols:arrow-downward></Icon>
        {:else if typeMessages == "asc"}
            <Icon class="absolute" width=1rem icon=material-symbols:arrow-upward></Icon>
        {/if}
    </button>
{/snippet}

<style>
    .chart-container {
        width: calc(100%-1.75rem);
        height: 225px;
    }
</style>