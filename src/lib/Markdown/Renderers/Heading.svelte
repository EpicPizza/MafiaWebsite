<script lang="ts">
  export let depth: number;
  export let raw: string;
  export let text: string;

  text; //to clear annoying warning
</script>

{#if depth === 1}
  <h1><slot /></h1>
{:else if depth === 2}
  <h2><slot /></h2>
{:else if depth === 3}
  <h3><slot /></h3>
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
