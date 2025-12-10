<script lang="ts">
  interface Props {
    depth: number;
    raw: string;
    text: string;
    children?: import('svelte').Snippet;
  }

  let {
    depth,
    raw,
    text,
    children
  }: Props = $props();

  text; //to clear annoying warning
</script>

{#if depth === 1}
  <h1>{@render children?.()}</h1>
{:else if depth === 2}
  <h2>{@render children?.()}</h2>
{:else if depth === 3}
  <h3>{@render children?.()}</h3>
{:else}
  {raw}
{/if}

<style lang="postcss">
  h1 {
    @apply text-2xl font-light mb-4;
  }

  h2 {
    @apply text-xl mb-4;
  }

  h3 {
    @apply text-lg mb-4 opacity-75;
  }
</style>
