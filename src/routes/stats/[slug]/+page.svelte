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
</script>

<div class="p-8 bg-white dark:bg-zinc-800 h-full border-border-light dark:border-border-dark max-w-[40rem] w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] overflow-auto border rounded-2xl">
    <div class="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 justify-between">
        <h1 class="text-xl font-bold">Stats Day {data.day} > {data.name} Mafia</h1>
        <p class="opacity-50 text-sm">Generated {dnt.format(new Date(data.timestamp), "MMMM D, h:mm A")}</p>
    </div>
    <Line class="mb-4 mt-2"></Line>
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