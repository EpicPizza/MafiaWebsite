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

    export let formatLabel = (/** @type {any} */ input) => input;

    /** @type {Number|undefined} */
    let slope = undefined;

    /** @type {Number|undefined} */
    let yIntercept = undefined;

    $: {
      if ($data.length > 1) {
        const xVals = $data.map($xGet);
        const yVals = $data.map($yGet);

        const sumX = xVals.reduce((/** @type {any} */ acc, /** @type {any} */ val) => acc + val, 0);
        const sumY = yVals.reduce((/** @type {any} */ acc, /** @type {any} */ val) => acc + val, 0);
        const sumXY = $data.reduce((/** @type {number} */ acc, /** @type {any} */ d) => acc + $xGet(d) * $yGet(d), 0);
        const sumX2 = xVals.reduce((/** @type {number} */ acc, /** @type {number} */ val) => acc + val * val, 0);
        const n = $data.length;

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const c = (sumY - m * sumX) / n;

        slope = m;
        yIntercept = c;
      } else {
        slope = undefined;
        yIntercept = undefined;
      }
    }

    $: console.log(slope, yIntercept);
  </script>
  
  <div class="scatter-group">
    {#each $data as d}
          <div
          class="circle border-white dark:border-black bg-accent-500 z-10"
          style="
            left: {$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}%;
            top: {$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}%;
            width: {r * 2}px;
            height: {r * 2}px;
            border-width: {strokeWidth}px;
          "
        >
        </div>
        <p class="text-xs dark:bg-black bg-white px-2 py-1 rounded-md absolute -translate-x-1/2 translate-y-1.5 z-10 opacity-75" style="
        left: {$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}%;
        top: {$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}%;">
          {formatLabel(d)}
        </p>
    {/each}
    {#if slope !== undefined && yIntercept !== undefined}
      {@const x1 = 0}
      {@const y1 = slope * x1 + yIntercept}
      {@const x2 = 100}
      {@const y2 = slope * x2 + yIntercept}
      <svg class="absolute top-0 left-0 w-full h-full pointer-events-none stroke-orange-500" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path id="trendline" d="M{x1} {y1} L{x2} {y2}" stroke-width="0.5" />
      </svg>
    {/if}
  </div>
  
  <style>
    .circle {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
    }
  </style>