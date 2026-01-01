<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";

    interface Props {
        link: string;
    }

    let { link }: Props = $props();

    let clicked = $state(false);

</script>

<button onclick={() => { clicked = true; navigator.clipboard.writeText(link); setTimeout(() => { clicked = false; }, 3000); }} class="bg-zinc-100 dark:bg-zinc-900 p-1 py-1 rounded-md font-bold text-xs border border-border-light dark:border-border-dark ">
    {#if clicked}
        <Icon scale=1rem icon="check"></Icon>
    {:else}
        <Icon scale=1rem icon="link"></Icon>
    {/if}
</button>