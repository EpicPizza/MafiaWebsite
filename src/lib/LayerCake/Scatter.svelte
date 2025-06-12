<!--
  @component
  Generates an HTML scatter plot. This component can also work if the x- or y-scale is ordinal, i.e. it has a `.bandwidth` method. See the [timeplot chart](https://layercake.graphics/example/Timeplot) for an example.
 -->
 <script>
    import { getContext } from 'svelte';
  
    const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake');
  
    /** @type {Number} [r=5] - The circle's radius. */
    export let r = 5;
  
    /** @type {String} [fill='#0cf'] - The circle's fill color. */
    export let fill = '#0cf';
  
    /** @type {String} [stroke='#000'] - The circle's stroke color. */
    export let stroke = '#000';
  
    /** @type {Number} [strokeWidth=1] - The circle's stroke width. */
    export let strokeWidth = 1;
  </script>
  
  <div class="scatter-group">
    {#each $data as d}
      {#if d.show}
          <div
          class="circle border-white dark:border-black bg-accent-500"
          style="
            left: {$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}%;
            top: {$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}%;
            width: {r * 2}px;
            height: {r * 2}px;
            border-width: {strokeWidth}px;
          "
        >
        </div>
        <p class="text-xs dark:bg-black bg-zinc-200 px-2 py-1 rounded-md absolute -translate-x-1/2 translate-y-1.5 z-10 opacity-75" style="
        left: {$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}%;
        top: {$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}%;">
          {d.name}
        </p>
      {/if}
    {/each}
  </div>
  
  <style>
    .circle {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
    }
  </style>