<script lang="ts">
  export let header: boolean;
  export let align:
    | "left"
    | "center"
    | "right"
    | "justify"
    | "char"
    | null
    | undefined;
</script>

{#if header}
  <th
    class="px-2 py-1 border-[1px] border-b-[3px] border-border-light dark:border-border-dark border-b-text-light dark:border-b-text-dark"
    {align}><slot /></th
  >
{:else}
  <td
    class="px-2 py-2 border-[1px] border-border-light dark:border-border-dark"
    {align}><slot /></td
  >
{/if}
