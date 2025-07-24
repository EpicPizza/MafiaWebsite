<script lang=ts>
    import Line from "$lib/Builders/Line.svelte";
    import Input from "$lib/Input.svelte";
    import Markdown from "$lib/Markdown/Markdown.svelte";
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";
   import type { Page } from '../pages.server';
    import { browser } from "$app/environment";

    export let data;

    let tab = "sub";

    let page: Page | undefined = data.pages.find(page => data.page == page.route);

    let pageElement: HTMLElement | undefined = undefined;

    $: {
        if(page?.route != data.page) {
            page = data.pages.find(page => data.page == page.route);
            if(pageElement) pageElement.scrollTo({ top: 0, behavior: "instant" });
        }
    }
    
</script>

<svelte:head>
    <meta property="og:title" content="{page?.title}" />
    <meta property="og:description" content="{page?.description}" />
</svelte:head>


<div bind:this={pageElement} class="p-8 bg-white dark:bg-zinc-800 overflow-auto border-border-light dark:border-border-dark w-[40rem] max-w-[calc(100vw-2rem)] h-[calc(100svh-2rem)] border rounded-2xl">
   {#if page != undefined}
         <div class="flex items-center justify-between">
            <h1 class="flex items-center gap-1.5 font-bold text-xl">
                <Icon width=1.25rem icon=material-symbols:{page.icon}></Icon>
                {page.title}
            </h1>
        </div>

        <Line class="mb-4 mt-2"></Line>

        <Markdown content={page.content}></Markdown>
    {:else}
        <div class="flex items-center justify-around">
            <div class="flex flex-col items-center gap-2 text-red-500 font-bold">
                <Icon width=2rem icon=material-symbols:cancel-outline></Icon>
                <p class="text-xl">Page Not Found</p>
            </div>
        </div>
   {/if}
</div>
    