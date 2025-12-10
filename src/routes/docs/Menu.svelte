<script lang=ts>
    import { invalidateAll } from "$app/navigation";
    import Icon from "@iconify/svelte";
    import type { getOrder, Page } from './pages.server';
    import { fade } from "svelte/transition";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    interface Props {
        pages: Page[];
        current: string;
        edit?: boolean;
    }

    let { pages, current, edit = false }: Props = $props();

    function findParent(page: Page | undefined): Page | undefined {
        if(page == undefined) return undefined;

        const parent = pages.find(p => p.subpages.find(s => s == page.id));

        return parent == undefined ? undefined : findParent(parent) ?? parent;
    }

    async function addPage() {
        const result = await fetch("/documents", {
            method: "POST",
            body: JSON.stringify({
                title: "Unnamed",
                icon: "book-2-outline",
                content: "",
                description: "A new unnamed page.",
                route: crypto.randomUUID() as string,
                hide: false,
                subpages: [],
            })
        });

        if(result.status != 200) {
            alert("Page unable to create!");
            return;
        }

        invalidateAll();
    }

    let homeButton = $state(false);
    let commandButton = $state(false);
    let editButton = $state(false);

    const mode = getContext('mode') as Writable<boolean>;
</script>

{#each pages.filter(page => page.hide != true).sort((a, b) => a.order - b.order) as page}
    {@const parent = findParent(pages.find(page => page.route == current))}

    <a href="/docs/{page.route}{edit ? "/edit" : ""}" class="w-36 min-h-12 h-12 flex items-center justify-around font-bold rounded-lg border-2 {current == page.route || parent?.route == page.route ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
        {page.title}
    </a>

    {#if page.subpages.length > 0}
        <div class="pl-2 py-2 border-l-2 border-l-border-light dark:border-l-border-dark pb-2">
            {#each page.subpages as subpageId}
                {@const subpage = pages.find(page => page.id == subpageId)}

                {#if subpage != undefined}
                    <a href="/docs/{subpage.route}{edit ? "/edit" : ""}" class="w-full text-left inline-block relative mb-1">
                        {#if subpage.route == current}
                            <div class="w-0.5 absolute -left-[10px] top-1/2 -translate-y-1/2 h-6 bg-black dark:bg-white"></div>
                        {/if}
                        <p class="font-bold text-sm">{subpage.title}</p>
                    </a>
                {/if}
            {/each}
        </div>
    {/if}
{/each}

<div class="mt-auto pt-4 flex flex-col items-center mr-8 pb-4 w-[10rem] -ml-[0.5rem] sticky bottom-0 translate-y-4 bg-zinc-100 dark:bg-zinc-900">
    {#if edit}
        <a class="mb-2 text-sm opacity-50" href="/docs/{current}">Leave Edit Mode</a>

        <button onclick={() => { addPage(); }} class="w-36 h-12 flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark">
            Add
        </button>
    {:else} 
        {#if homeButton || commandButton || editButton}
            <div transition:fade={{ duration: 100 }} class="bg-black text-white dark:bg-white dark:text-black rounded-md w-[calc(100%-0.75rem)] h-10 mb-2 -mt-12 font-bold tracking-tight flex items-center text-base justify-around">
                {#if homeButton}
                    Home
                {:else if commandButton}
                    Slash/Text Mode
                {:else}
                    Edit
                {/if}
            </div>
        {/if}


        <div class="flex items-center gap-2">
            <a onmouseenter={() => { homeButton = true; }} onmouseleave={() => { homeButton = false; }} ontouchstart={() => { homeButton = true; }} ontouchend={() => { homeButton = false; }} href="/" class="w-11 h-11 flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark">
                <Icon width=1.25rem icon=material-symbols:home-outline></Icon>
            </a>
            <button onclick={() => { $mode = !$mode; }} onmouseenter={() => { commandButton = true; }} onmouseleave={() => { commandButton = false; }} ontouchstart={() => { commandButton = true; }} ontouchend={() => { commandButton = false; }} class="w-11 h-11  flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark text-lg">
                {#if $mode}
                    /
                {:else}
                    ?
                {/if}
            </button>
            <a onmouseenter={() => { editButton = true; }} onmouseleave={() => { editButton = false; }} ontouchstart={() => { editButton = true; }} ontouchend={() => { editButton = false; }} data-sveltekit-preload-data={false} href="/docs/register?route={current}" class="w-11 h-11  flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark">
                <Icon width=1.25rem icon=material-symbols:edit-outline></Icon>
            </a>
        </div>
    {/if}
</div>