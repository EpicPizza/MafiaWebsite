<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";

    import { LayerCake, Svg, WebGL, Html } from 'layercake';

    import Scatter from '$lib/LayerCake/Scatter/Scatter.svelte';
    import AxisX from '$lib/LayerCake/Scatter/AxisX.svelte';
    import AxisY from '$lib/LayerCake/Scatter/AxisY.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem'
    import { slide } from "svelte/transition";

    dnt.plugin(meridiem);

    let { data } = $props();

    let statsMessages = $state(structuredClone(data.stats).filter(stat => stat.alive || !('alive' in stat)));
    let statsReactions = $state(structuredClone(data.stats));

    const xKeyMessages = 'messages';
    const yKeyMessages = 'words';
    const xKeyReactions = 'reactionCount';
    const yKeyReactions = 'messages';

    const r = 4.5;
    const padding = 2.5;
    const fill = '#000';
    const stroke = '#0cf';
    const strokeWidth = 1.5;

    statsMessages.forEach(d => {
        d[yKeyMessages] = +d[yKeyMessages];
    });

    statsReactions.forEach((d) => {
        const reactions = (d.reactions ?? []).filter(reaction => reaction.message != undefined);
        d[xKeyReactions] = reactions.length;
        d[yKeyReactions] = (new Set(reactions.map(reaction => reaction.message))).size;
    });

    let shownMessages = $derived(statsMessages.filter(point => point.show));
    let shownReactions = $derived(statsReactions.filter(point => point.show));

    let sortingMessages = $state("-");
    let typeMessages = $state("des");
    let sortingReactions = $state("-");
    let typeReactions = $state("des");

    function sortMessages(which: string) {
        if(which == sortingMessages) {
            typeMessages = typeMessages == "des" ? "asc" : "des";
        } else {
            typeMessages = "des";
        }

        statsMessages = statsMessages.sort((a, b) => {
            if(which == "messages") {
                return typeMessages == "des" ? b.messages - a.messages : a.messages - b.messages;
            } else if(which == "name") {
                if(typeMessages == "des") {
                    return b.name < a.name ? 1 : a.name < b.name ? -1 : 0;
                } else {
                    return b.name < a.name ? -1 : a.name < b.name ? 1 : 0;
                }
            } else if(which == "words") {
                return typeMessages == "des" ? b.words - a.words : a.words - b.words;
            } else if(which == "wpm") {
                return typeMessages == "des" ?  (b.messages == 0 ? 0 : b.words / b.messages) - (a.messages == 0 ? 0 : a.words / a.messages) : (a.messages == 0 ? 0 : a.words / a.messages) - (b.messages == 0 ? 0 : b.words / b.messages);
            } else if(which == "images" && a.images && b.images) {
                return typeMessages == "des" ? b.images - a.images : a.images - b.images;
            } else {
                return 0;
            }
        });

        sortingMessages = which;
    }

    sortMessages("messages");

    const reactionCheck = !statsReactions.find(stat => !(stat.reactions) || stat.reactions.find(reaction => !(reaction.message)))

    function sortReactions(which: string) {
        if(!reactionCheck) return;

        if(which == sortingReactions) {
            typeReactions = typeReactions == "des" ? "asc" : "des";
        } else {
            typeReactions = "des";
        }

        statsReactions = statsReactions.sort((a, b) => {
            if(!(a.reactions) || a.reactions.find(reaction => !(reaction.message))) return 0;
            if(!(b.reactions) || b.reactions.find(reaction => !(reaction.message))) return 0;

            if(which == "reactions") {
                return typeReactions == "des" ? b.reactions.length - a.reactions.length : a.reactions.length - b.reactions.length;
            } else if(which == "name") {
                if(typeReactions == "des") {
                    return b.name < a.name ? 1 : a.name < b.name ? -1 : 0;
                } else {
                    return b.name < a.name ? -1 : a.name < b.name ? 1 : 0;
                }
            } else if(which == "messages") {
                return typeReactions == "des" ? b.messages - a.messages : a.messages - b.messages;
            } else if(which == "rpm") {
                return typeReactions == "des" ?  (b.messages == 0 ? 0 : b.reactions.length / b.messages) - (a.messages == 0 ? 0 : a.reactions.length / a.messages) : (a.messages == 0 ? 0 : a.reactions.length / a.messages) - (b.messages == 0 ? 0 : b.reactions.length / b.messages);
            } else {
                return 0;
            }
        });

        sortingReactions = which;
    }

    sortReactions("reactions");

    let reactionsOpen = $state(false);
</script>

<div class="p-8 bg-white dark:bg-zinc-800 h-full overflow-x-auto overflow-y-auto border-border-light dark:border-border-dark w-[40rem] max-w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] border rounded-2xl">
    <div class="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 justify-between">
        <h1 class="text-xl font-bold">Stats Day {data.day} > {data.name} Mafia</h1>
        <p class="opacity-50 text-sm">Generated {dnt.format(new Date(data.timestamp), "MMMM D, h:mm A")}</p>
    </div>
    <Line class="mb-4 mt-2"></Line>

    <div class="w-full overflow-auto">
        <div class="min-w-[35rem] w-full bg-zinc-200 dark:bg-zinc-900 rounded-xl p-2.5 text-sm mb-4">
            <div class="w-full flex bg-zinc-800 text-white dark:bg-zinc-800 px-0 py-2 rounded-md">
                <div class="w-1/5 pl-2 flex justify-between items-center">
                    Player

                    <button onclick={() => { sortMessages("name"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sortingMessages != "name"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if typeMessages == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {:else if typeMessages == "asc"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Messages

                    <button onclick={() => { sortMessages("messages"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sortingMessages != "messages"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if typeMessages == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {:else if typeMessages == "asc"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Words

                    <button onclick={() => { sortMessages("words"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sortingMessages != "words"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if typeMessages == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {:else if typeMessages == "asc"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    WPM
                    
                    <button onclick={() => { sortMessages("wpm"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sortingMessages != "wpm"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if typeMessages == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {:else if typeMessages == "asc"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Images
                    
                    <button onclick={() => { sortMessages("images"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sortingMessages != "images"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if typeMessages == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {:else if typeMessages == "asc"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {/if}
                    </button>
                </div>
            </div>

            {#each statsMessages as stat}
                <div class="mt-2 flex">
                    <div class="w-1/5 pl-2">
                        {stat.name}
                    </div>
                    <div class="w-1/5 pl-2 border-l border-zinc-400 dark:border-border-dark">
                        {stat.messages}
                    </div>
                    <div class="w-1/5 pl-2 border-l border-zinc-400 dark:border-border-dark">
                        {stat.words}
                    </div>
                    <div class="w-1/5 pl-2 border-l border-zinc-400 dark:border-border-dark">
                        {stat.messages == 0 ? (0).toFixed(2) : (stat.words / stat.messages).toFixed(2)}
                    </div>
                    <div class="w-1/5 pl-2 border-l border-zinc-400 dark:border-border-dark">
                        {stat.images ?? 0}
                    </div>
                </div>
            {/each}
        </div>
    </div>  

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
            />
        </Html>
    
        </LayerCake>
    </div>
    <div class="mt-8 flex gap-1 flex-wrap">
        {#each statsMessages as point}
            <button onclick={() => { point.show = point.show ? false : true; }} class="p-1 px-2 {point.show ? "" : "opacity-25"} transition-all rounded-md text-sm bg-zinc-100 dark:bg-zinc-900">
                {point.name}
            </button>
        {/each}
    </div>

    <div class="pt-8"></div>

    {#if reactionCheck}
        <div class="{reactionsOpen ? "border-border-light dark:border-border-dark border shadow-md dark:shadow-2xl" : "border border-zinc-200 dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-900"}  p-3 pb-0 -m-3 mb-7 rounded-xl transition-all">
            <div class="flex items-center justify-between mb-3">
                <p class="text-lg font-bold">Reactions Stats</p>
                
                <button onclick={() => { reactionsOpen = !reactionsOpen; }} class="w-7 h-7 bg-zinc-200 dark:bg-zinc-700 border-zinc-400 border dark:border-0 rounded-full flex items-center justify-around">
                    {#if reactionsOpen}
                        <Icon scale=1rem icon=collapse_all></Icon>
                    {:else}
                        <Icon scale=1rem icon=expand_all></Icon>
                    {/if}
                </button>
            </div>

            {#if reactionsOpen}
                <div transition:slide>
                    <div class="w-full overflow-auto">
                        <div class="min-w-[35rem] w-full bg-zinc-200 dark:bg-zinc-900 rounded-xl p-2.5 text-sm mb-4">
                            <div class="w-full flex bg-zinc-800 text-white dark:bg-zinc-800 px-0 py-2 rounded-md">
                                <div class="w-1/4 pl-2 flex justify-between items-center">
                                    Player

                                    <button onclick={() => { sortReactions("name"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                                        {#if sortingReactions != "name"}
                                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                                        {:else if typeReactions == "des"}
                                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                                        {:else if typeReactions == "asc"}
                                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                                        {/if}
                                    </button>
                                </div>
                                <div class="w-1/4 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                                    Reactions

                                    <button onclick={() => { sortReactions("reactions"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                                        {#if sortingReactions != "reactions"}
                                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                                        {:else if typeReactions == "des"}
                                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                                        {:else if typeReactions == "asc"}
                                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                                        {/if}
                                    </button>
                                </div>
                                <div class="w-1/4 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                                    Messages

                                    <button onclick={() => { sortReactions("messages"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                                        {#if sortingReactions != "messages"}
                                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                                        {:else if typeReactions == "des"}
                                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                                        {:else if typeReactions == "asc"}
                                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                                        {/if}
                                    </button>
                                </div>
                                <div class="w-1/4 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                                    RPM
                                    
                                    <button onclick={() => { sortReactions("rpm"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                                        {#if sortingReactions != "rpm"}
                                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                                        {:else if typeReactions == "des"}
                                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                                        {:else if typeReactions == "asc"}
                                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                                        {/if}
                                    </button>
                                </div>
                            </div>

                            {#each statsReactions as stat}
                                <div class="mt-2 flex">
                                    <div class="w-1/4 pl-2">
                                        {stat.name}
                                    </div>
                                    <div class="w-1/4 pl-2 border-l border-zinc-400 dark:border-border-dark">
                                        {stat.reactions?.length}
                                    </div>
                                    <div class="w-1/4 pl-2 border-l border-zinc-400 dark:border-border-dark">
                                        {stat.messages}
                                    </div>
                                    <div class="w-1/4 pl-2 border-l border-zinc-400 dark:border-border-dark">
                                        {stat.messages == 0 ? (0).toFixed(2) : (stat.reactions?.length ?? 0 / stat.messages).toFixed(2)}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>  

                    <div class="chart-container">
                        <LayerCake
                        ssr
                        percentRange
                        padding={{ top: 10, right: 5, bottom: 20, left: 65 }}
                        x={xKeyReactions}
                        y={yKeyReactions}
                        xPadding={[padding, padding]}
                        yPadding={[padding, padding]}
                        data={shownReactions}
                        >
                    
                        <Html>
                            <AxisX label={xKeyReactions} />
                            <AxisY label={yKeyReactions} />
                            <Scatter
                            {r}
                            {fill}
                            {stroke}
                            {strokeWidth}
                            />
                        </Html>
                    
                        </LayerCake>
                    </div>
                    <div class="mt-8 flex gap-1 flex-wrap pb-4">
                        {#each statsReactions as point}
                            <button onclick={() => { point.show = point.show ? false : true; }} class="p-1 px-2 {point.show ? "" : "opacity-25"} transition-all rounded-md text-sm bg-zinc-100 dark:bg-zinc-900">
                                {point.name}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

        </div>
    {/if}
    
    <p class="opacity-50 mt-4 text-sm">The messages count in the reactions section refers to the number of messages to which a user has reacted. All information on this page was generated and saved on request, so some information like nicknames may be out of date.</p>
</div>

<style>
    /*
      The wrapper div needs to have an explicit width and height in CSS.
      It can also be a flexbox child or CSS grid element.
      The point being it needs dimensions since the <LayerCake> element will
      expand to fill it.
    */
    .chart-container {
      width: calc(100%-1.75rem);
      height: 225px;
    }
    .circle {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(171,0, 214);
      transform: translate(-50%, -50%);
      pointer-events: none;
      width: 10px;
      height: 10px;
    }
  </style>