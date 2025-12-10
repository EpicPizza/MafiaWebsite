<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<strong class="text-teal-800 dark:text-teal-300">
  {@render children?.()}
</strong>
