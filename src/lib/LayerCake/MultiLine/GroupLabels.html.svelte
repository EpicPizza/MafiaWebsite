<!--
  @component
  Generates HTML text labels for a nested data structure. It places the label near the y-value of the highest x-valued data point. This is useful for labeling the final point in a multi-series line chart, for example. It expects your data to be an array of objects where each has `values` field that is an array of data objects. It uses the `z` field accessor to pull the text label.
 -->
<script>
  import { getContext } from 'svelte';
  import { max } from 'd3-array';

  const { data, x, y, xScale, yScale, xRange, yRange, z } = getContext('LayerCake');

  /* --------------------------------------------
   * Title case the first letter
   */
  const cap = val => val.replace(/^\w/, d => d.toUpperCase());

  /* --------------------------------------------
   * Put the label on the highest value
   */
  let left = $derived(values => $xScale(max(values, $x)) / Math.max(...$xRange));
  let top = $derived(values => $yScale(max(values, $y)) / Math.max(...$yRange));

  let { formatLabel } = $props();
</script>

{#each $data as group}
  <div
    class="label px-1.5 py-0.5 bg-black dark:bg-white rounded-sm text-white dark:text-black"
    style="
      top:{top(group.values) * 100}%;
      left:{left(group.values) * 100}%;
    "
  >
    {formatLabel(cap($z(group)))}
  </div>
{/each}

<style>
  .label {
    position: absolute;
    transform: translate(-100%, -100%) translateY(-3px);
    font-size: 13px;
  }
</style>