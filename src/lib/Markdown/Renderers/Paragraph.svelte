<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<p class="mb-4 whitespace-pre-line tracking-[-0.015rem]">
  {@render children?.()}
</p>
