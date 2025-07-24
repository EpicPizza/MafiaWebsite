<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "@iconify/svelte";
    import type { Page } from './pages.server';

    import { page } from "$app/stores";
    import Menu from "./Menu.svelte";

    export let data;

    $: current = data.indicator;

    $: edit = $page.route.id?.includes("/edit");

    let open = false;
</script>

<Background>
    <div class="flex ml-0 md:-ml-12">
        <div class="md:flex overflow-y-auto max-h-[calc(100dvh-2rem)] hidden flex-col gap-2 p-4 pr-8 bg-zinc-100 dark:bg-zinc-900 border-l translate-x-12 min-w-[14rem] max-w-[14rem] z-[0] border-y border-border-light dark:border-border-dark rounded-2xl rounded-r-none">
            <Menu {edit} current={current ?? "---"} pages={data.pages}></Menu>
        </div>
        <div class="z-[1]">
            <slot></slot>
        </div>
    </div>

    
</Background>

<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div on:click={() => { open = false; }} class="absolute overflow-x-hidden top-4 left-4 flex overflow-y-auto max-h-[calc(100dvh-2rem)] flex-col gap-2 p-4 bg-zinc-100 dark:bg-zinc-900 border min-w-[11rem] max-w-[10rem] z-20 border-border-light dark:border-border-dark rounded-2xl">
        <Menu {edit} current={current ?? "---"} pages={data.pages}></Menu>
    </div>
{/if}

{#if open}
    <div class="w-screen h-[100dvh] bg-black/50 z-10 absolute top-0 left-0">

    </div>
{/if}

<button on:click={() => { open = !open; }} class="md:hidden z-20 bg-zinc-200 dark:bg-zinc-900 w-10 h-10 top-8 right-8 absolute rounded-lg border border-border-light dark:border-border-dark flex items-center justify-around">
    <Icon width=1.5rem icon="material-symbols:{open ? "hide" : "menu"}"></Icon>
</button>