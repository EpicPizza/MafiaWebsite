<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";

    import { LayerCake, Svg, WebGL, Html } from 'layercake';

    import Scatter from '$lib/LayerCake/Scatter.svelte';
    import AxisX from '$lib/LayerCake/AxisX.svelte';
    import AxisY from '$lib/LayerCake/AxisY.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem'

    dnt.plugin(meridiem);

    export let data;


    const xKey = 'messages';
    const yKey = 'words';

    const r = 4.5;
    const padding = 2.5;
    const fill = '#000';
    const stroke = '#0cf';
    const strokeWidth = 1.5;

    data.stats.forEach(d => {
        d[yKey] = +d[yKey];
    });

    $: shown = data.stats.filter(point => point.show);

    let sorting = "-";
    let type = "des";

    function sort(which: string) {
        if(which == sorting) {
            type = type == "des" ? "acc" : "des";
        } else {
            type = "des";
        }

        data.stats = data.stats.sort((a, b) => {
            if(which == "messages") {
                return type == "des" ? b.messages - a.messages : a.messages - b.messages;
            } else if(which == "name") {
                if(type == "des") {
                    return b.name < a.name ? 1 : a.name < b.name ? -1 : 0;
                } else {
                    return b.name < a.name ? -1 : a.name < b.name ? 1 : 0;
                }
            } else if(which == "words") {
                return type == "des" ? b.words - a.words : a.words - b.words;
            } else if(which == "wpm") {
                return type == "des" ?  (b.messages == 0 ? 0 : b.words / b.messages) - (a.messages == 0 ? 0 : a.words / a.messages) : (a.messages == 0 ? 0 : a.words / a.messages) - (b.messages == 0 ? 0 : b.words / b.messages);
            } else if(which == "images") {
                return type == "des" ? b.images - a.images : a.images - b.images;
            } else {
                return 0;
            }
        });

        sorting = which;
    }

    sort("messages")
</script>

<div class="p-8 bg-white dark:bg-zinc-800 h-full overflow-x-hidden overflow-y-auto border-border-light dark:border-border-dark w-[40rem] max-w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] border rounded-2xl">
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

                    <button on:click={() => { sort("name"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sorting != "name"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if type == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {:else if type == "acc"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Messages

                    <button on:click={() => { sort("messages"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sorting != "messages"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if type == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {:else if type == "acc"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Words

                    <button on:click={() => { sort("words"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sorting != "words"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if type == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {:else if type == "acc"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    WPM
                    
                    <button on:click={() => { sort("wpm"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sorting != "wpm"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if type == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {:else if type == "acc"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {/if}
                    </button>
                </div>
                <div class="w-1/5 pl-2 border-l border-zinc-500 dark:border-border-dark flex justify-between items-center">
                    Images
                    
                    <button on:click={() => { sort("images"); }} class="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-around mr-2 relative">
                        {#if sorting != "images"}
                            <Icon class="absolute" scale=1rem icon=check_indeterminate_small></Icon>
                        {:else if type == "des"}
                            <Icon class="absolute" scale=1rem icon=arrow_upward></Icon>
                        {:else if type == "acc"}
                            <Icon class="absolute" scale=1rem icon=arrow_downward></Icon>
                        {/if}
                    </button>
                </div>
            </div>

            {#each data.stats as stat}
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
        x={xKey}
        y={yKey}
        xPadding={[padding, padding]}
        yPadding={[padding, padding]}
        data={shown}
        >
    
        <Html>
            <AxisX/>
            <AxisY/>
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
        {#each data.stats as point}
            <button on:click={() => { point.show = point.show ? false : true; }} class="p-1 px-2 {point.show ? "" : "opacity-25"} transition-all rounded-md text-sm bg-zinc-100 dark:bg-zinc-900">
                {point.name}
            </button>
        {/each}
    </div>
    <p class="opacity-50 mt-4 text-sm">All information on this page was generated and saved on request, so some information like nicknames may be out of date.</p>
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