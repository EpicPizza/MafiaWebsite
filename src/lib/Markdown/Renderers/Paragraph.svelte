<script lang="ts">
    import { getContext } from 'svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const inMessage = getContext("inMessage") === true;
</script>

<p class="mb-4 whitespace-pre-line {inMessage ? "leading-6" : "leading-7"} tracking-[-0.015rem]">
  {@render children?.()}
</p>
