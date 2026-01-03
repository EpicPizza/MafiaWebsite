<!--
  @component
  Generates a tooltip that works on multiseries datasets, like multiline charts. It creates a tooltip showing the name of the series and the current value. This version uses percentages so you can use it to render server-side. It finds the nearest data point using the [QuadTree.percent-range.html.svelte](https://layercake.graphics/components/QuadTree.percent-range.html.svelte) component.
 -->
<script>
  import { getContext } from 'svelte';
  import { format } from 'd3-format';

  import QuadTree from './QuadTree.percent-range.html.svelte';

  const { data, width, yScale, config } = getContext('LayerCake');

  const commas = format(',');
  const titleCase = d => d.replace(/^\w/, w => w.toUpperCase());

  /**
   * @typedef {Object} Props
   * @property {Function} [formatTitle=d => d] - A function to format the tooltip title, which is `$config.x`.
   * @property {Function} [formatKey = d => titleCase(d)] - A function to format the series name.
   * @property {Function} [formatValue = d => (isNaN(+d) ? d : commas(d))] - A function to format the value.
   * @property {number} [offset=-20] - A y-offset from the hover point, in pixels.
   * @property {Array} [dataset] - The dataset to work off ofdefaults to $data if left unset. You can pass something custom in here in case you don't want to use the main data or it's in a strange format.
   */

  /** @type {Props} */
  let {
    formatTitle = d => d,
    formatKey = d => titleCase(d),
    formatValue = d => (isNaN(+d) ? d : commas(d)),
    offset = -20,
    dataset
  } = $props();

  const w = 250;
  const w2 = w / 2;

  /* --------------------------------------------
   * Sort the keys by the highest value
   */
  function sortResult(result) {
    if (Object.keys(result).length === 0) return [];
    const rows = Object.keys(result)
      .filter(d => d !== $config.x)
      .map(key => {
        return {
          key,
          value: result[key]
        };
      })
      .sort((a, b) => b.value - a.value);

    return rows;
  }
</script>

<QuadTree dataset={dataset || $data} y="x">
  {#snippet children({ x, y, visible, found, e })}
    {@const foundSorted = sortResult(found)}
    {#if visible === true}
      <div style="left:{(x / 100) * $width}px;" class="line"></div>
      <div
        class="tooltip border-border-light dark:border-border-dark border rounded-lg bg-zinc-100 dark:bg-zinc-900" 
        style="
          width:{w}px;
          display: {visible ? 'block' : 'none'};
          top:calc({$yScale(foundSorted[0].value)}% + {offset}px);
          left:{Math.min(Math.max(w2, (x / 100) * $width), $width - w2)}px;"
      >
        <div class="title">{formatTitle(found[$config.x])}</div>
        <div class="grid grid-cols-2 gap-x-2">
          {#each foundSorted.filter(row => row.value != 0) as row}
            <div class="row">
              <span class="text-zinc-600 dark:text-zinc-300">{formatKey(row.key)}:</span>
              {formatValue(row.value)}
            </div>
          {:else}
            <div class="row">
               <span class="text-zinc-600 dark:text-zinc-300">None Above 0</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/snippet}
</QuadTree>

<style>
  .tooltip {
    position: absolute;
    font-size: 13px;
    pointer-events: none;
    transform: translate(-50%, -100%);
    padding: 5px;
    z-index: 15;
  }
  .line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    border-left: 1px dotted #666;
    pointer-events: none;
  }
  .tooltip,
  .line {
    transition:
      left 250ms ease-out,
      top 250ms ease-out;
  }
  .title {
    font-weight: bold;
  }
</style>