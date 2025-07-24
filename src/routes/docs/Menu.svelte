<script lang=ts>
    import { invalidateAll } from "$app/navigation";
    import type { getOrder, Page } from './pages.server';

    export let pages: Page[];
    export let current: string;
    export let edit: boolean = false;

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
                            <div class="w-0.5 absolute -left-[10px] top-1/2 -translate-y-1/2 h-6 bg-white"></div>
                        {/if}
                        <p class="font-bold text-sm">{subpage.title}</p>
                    </a>
                {/if}
            {/each}
        </div>
    {/if}
{/each}

<div class="mt-auto pt-4 flex flex-col items-center mr-8 pb-4 w-[10rem] -ml-[0.5rem] sticky bottom-0 translate-y-4 bg-zinc-200 dark:bg-zinc-900">
    {#if edit}
        <a class="mb-2 text-sm opacity-50" href="/docs/{current}">Leave Edit Mode</a>

        <button on:click={() => { addPage(); }} class="w-36 h-12 flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark">
            Add
        </button>
    {:else} 
        <a data-sveltekit-preload-data={false} href="/docs/register?route={current}" class="w-36 h-12 flex items-center justify-around font-bold rounded-lg border-2 bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark">
            Edit
        </a>
    {/if}
</div>