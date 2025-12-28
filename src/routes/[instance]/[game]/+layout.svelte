<script lang="ts">
    import Background from "$lib/Builders/Background.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

</script>

<Background>
    {@render children?.()}
</Background>