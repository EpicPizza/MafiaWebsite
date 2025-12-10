<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<strong class="text-orange-800 dark:text-orange-300">
  {@render children?.()}
</strong>
