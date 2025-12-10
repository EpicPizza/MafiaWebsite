<script lang="ts">
  interface Props {
    header: boolean;
    align: 
    | "left"
    | "center"
    | "right"
    | "justify"
    | "char"
    | null
    | undefined;
    children?: import('svelte').Snippet;
  }

  let { header, align, children }: Props = $props();
</script>

{#if header}
  <th
    class="px-2 py-1 border-[1px] border-b-[3px] border-border-light dark:border-border-dark border-b-text-light dark:border-b-text-dark"
    {align}>{@render children?.()}</th
  >
{:else}
  <td
    class="px-2 py-2 border-[1px] border-border-light dark:border-border-dark"
    {align}>{@render children?.()}</td
  >
{/if}
