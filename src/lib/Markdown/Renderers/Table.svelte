<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<table class="border-[1px] my-4 border-border-light dark:border-border-dark">
  {@render children?.()}
</table>
