<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<li class="list-item ml-5">
  {@render children?.()}
</li>
