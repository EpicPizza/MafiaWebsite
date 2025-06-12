<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";

    export let link: string;

    let clicked = false;

</script>

<button on:click={() => { clicked = true; navigator.clipboard.writeText(link); setTimeout(() => { clicked = false; }, 3000); }} class="bg-zinc-900 p-1 py-1 rounded-md font-bold text-xs">
    {#if clicked}
        <Icon scale=1rem icon="check"></Icon>
    {:else}
        <Icon scale=1rem icon="link"></Icon>
    {/if}
</button>