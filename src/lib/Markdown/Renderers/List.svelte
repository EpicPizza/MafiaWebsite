<script lang="ts">
  interface Props {
    ordered: Boolean;
    start: number | null | undefined;
    children?: import('svelte').Snippet;
  }

  let { ordered, start, children }: Props = $props();
</script>

{#if ordered}
  <ol {start} class="mb-4">{@render children?.()}</ol>
{:else}
  <ul class="mb-4">{@render children?.()}</ul>
{/if}

<style lang="postcss">
  ol {
    @apply list-decimal;
  }

  ul {
    @apply list-disc;
  }
</style>
