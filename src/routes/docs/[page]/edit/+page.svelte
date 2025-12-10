<script lang=ts>
   import { run } from 'svelte/legacy';

    import Line from "$lib/Builders/Line.svelte";
    import Input from "$lib/Input.svelte";
    import Markdown from "$lib/Markdown/Markdown.svelte";
    import Icon from "@iconify/svelte";
    import { onMount } from "svelte";
    import type { Page } from '../../pages.server';
    import { goto, invalidateAll } from "$app/navigation";

   let { data = $bindable() } = $props();

    let tab = $state("edit");

    let page: Page | undefined = $state(undefined);
    let unedited: Page | undefined = $state(undefined);

    run(() => {
        if(unedited?.route != data.page) {
            page = data.pages.find(page => data.page == page.route);
            unedited = JSON.parse(JSON.stringify(page));
        }
    });

    let save = $derived(JSON.stringify(unedited) != JSON.stringify(page));

    async function savePage() {
        if(page == undefined) return;

        const result = await fetch("/documents", {
            method: "PATCH",
            body: JSON.stringify(page)
        });

        if(result.status != 200) {
            alert("Page unable to save!");
            return;
        }

        await invalidateAll();

        if(page.route != data.page) await goto("/docs/" + page.route + "/edit");

        page = data.pages.find(page => data.page == page.route);
        unedited = structuredClone(page);
    } 

    async function reorder(id: string, type: string) {
        if(page == undefined) return;

        const result = await fetch("/documents", {
            method: "PUT",
            body: JSON.stringify({
                id: id,
                type: type,
            })
        });

        if(result.status != 200) {
            alert("Page unable to reorder!");
            return;
        }

        await invalidateAll();

        page = data.pages.find(page => data.page == page.route);
        unedited = structuredClone(page);
    } 

    async function deletePage() {
        if(page == undefined) return;

        const result = await fetch("/documents", {
            method: "DELETE",
            body: JSON.stringify({
                id: page.id,
            })
        });

        if(result.status != 200) {
            alert("Page unable to delete!");
            return;
        }

        data.page = "";
        invalidateAll();
    } 

    async function addSubpage() {
        if(page == undefined) return;

        const result = await fetch("/documents", {
            method: "POST",
            body: JSON.stringify({
                title: "Unnamed",
                icon: "book-2-outline",
                content: "",
                description: "A new unnamed subpage.",
                route: crypto.randomUUID() as string,
                hide: true,
                order: -1,
                subpages: [],
            })
        });

        if(result.status != 200) {
            alert("Page unable to save!");
            return;
        }

        page.subpages.push(await result.text());

        const save = await fetch("/documents", {
            method: "PATCH",
            body: JSON.stringify(page)
        });

        if(save.status != 200) {
            alert("Page unable to save!");
            return;
        }

        await invalidateAll();
    }
    

</script>

<div class="p-8 bg-white dark:bg-zinc-800 overflow-auto border-border-light dark:border-border-dark w-[40rem] max-w-[calc(100vw-2rem)] h-[calc(100svh-2rem)] border rounded-2xl">
   {#if page != undefined}
         <div class="flex items-center justify-between">
            <h1 class="flex items-center gap-1.5 font-bold text-xl">
                <Icon width=1.25rem icon="material-symbols:{page.icon}"></Icon>
                {page.title}
            </h1>

            <div class="mr-10 md:mr-0">   
                <button disabled={save == false} onclick={() => { savePage(); }}  class="w-full transition-all px-3 text-sm py-1 flex items-center justify-around font-bold rounded-lg border-2 { save ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white opacity-50 dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
                    Save
                </button>
            </div>
        </div>

        <Line class="mb-4 mt-2"></Line>

        <div class="flex gap-2.5">
            <button onclick={() => { tab = "edit"; }}  class="w-full h-12 flex items-center justify-around font-bold rounded-full border-2 {tab == "edit" ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
                Edit
            </button>
            <button onclick={() => { tab = "view"; }} class="w-full h-12 flex items-center justify-around font-bold rounded-full border-2 {tab == "view" ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
                View
            </button>
            <button onclick={() => { tab = "sub"; }} class="w-full h-12 flex items-center justify-around font-bold rounded-full border-2 {tab == "sub" ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
                Subpages
            </button>
            <button onclick={() => { tab = "other"; }} class="w-full h-12 flex items-center justify-around font-bold rounded-full border-2 {tab == "other" ? "bg-orange-200 dark:bg-orange-800 border-orange-400" : "bg-white dark:bg-zinc-800 border-border-light dark:border-border-dark"}">
                Settings
            </button>
        </div>

        {#if tab == "edit"}
            <textarea bind:value={page.content} class="dark:bg-zinc-900 bg-zinc-200 w-full min-h-[100rem] max-w-full min-w-full p-4 rounded-lg mt-4"></textarea>
        {:else if tab == "view"}
            <div class="dark:bg-zinc-900 bg-zinc-200 p-4 rounded-lg mt-4">
                <Markdown content={page.content}></Markdown>
            </div>
        {:else if tab == "sub"}
            <div class="dark:bg-zinc-900 bg-zinc-200 p-4 pb-6 rounded-lg mt-4">
                <h1 class="text-xl mb-6 font-bold">Subpages</h1>

                {#if page.hide == false}
                    {#each page.subpages as subpageId}
                        {@const subpage = data.pages.find(page => page.id == subpageId)}

                        {#if subpage != undefined}
                            <a href="/docs/{subpage.route}/edit" class="p-4 bg-zinc-200 w-full text-left inline-block dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-md relative overflow-hidden">
                                <div class="flex items-center gap-1.5 text-lg mb-2">
                                    <Icon width=1.25rem icon="material-symbols:{subpage.icon}"></Icon>
                                    <p class="font-bold">{subpage.title}</p>
                                </div>
                                <p class="text-sm opacity-80">{subpage.description}</p>
                            </a>
                        {/if}
                    {:else}
                        <p class="text-red-500 font-bold pt-2">This page has no subpages.</p>
                    {/each}
                    
                    <button onclick={() => { addSubpage(); }} class="w-full h-12 mt-8 flex items-center justify-around font-bold rounded-full border-2 bg-orange-200 dark:bg-orange-800 border-orange-400">
                        Add Subpage
                    </button>
                {:else}
                    <div class="flex items-center gap-1.5 text-red-500 font-bold">
                        <Icon width=1.5rem icon=material-symbols:cancel-outline></Icon>
                        <p>Subpages cannot have their own subpages.</p>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="dark:bg-zinc-900 bg-zinc-200 p-4 pb-6 rounded-lg mt-4">
                <h1 class="text-xl mb-8 font-bold">General</h1>

                <Input name="title" bind:value={page.title} label="Title"></Input>
                <Input name="description" bind:value={page.description} label="Description"></Input>
                <Input name="icon" bind:value={page.icon} label="Icon"></Input>
                <Input disabled={page.route == "overview"} name="route" bind:value={page.route} label="Route"></Input>

                {#if page.order != -1}
                    <h1 class="text-xl mb-2 font-bold">Order</h1>

                    <div class="flex gap-2 mb-6">
                        <button onclick={() => { reorder(page?.id ?? "---", "up"); }} disabled={page.order == data.order.top} class="disabled:opacity-25 w-full h-12 mt-2 flex items-center justify-around font-bold rounded-full border-2 bg-zinc-200 dark:bg-zinc-800 border-zinc-400">
                            <Icon width=1.5rem icon=material-symbols:keyboard-double-arrow-up></Icon>
                        </button>
                        <button onclick={() => { reorder(page?.id ?? "---", "down"); }}  disabled={page.order == data.order.bottom} class="disabled:opacity-25 w-full h-12 mt-2 flex items-center justify-around font-bold rounded-full border-2 bg-zinc-200 dark:bg-zinc-800 border-zinc-400">
                            <Icon width=1.5rem icon=material-symbols:keyboard-double-arrow-down></Icon>
                        </button>
                    </div>
                {/if}
                
                <h1 class="text-xl mb-8 font-bold">Integrations</h1>

                <Input disabled name="integration" value={page.integration ?? "None"} label="Integration"></Input>

                <div class="flex items-center gap-1.5 text-red-500 font-bold -mt-4 mb-6">
                    <Icon width=1.5rem icon=material-symbols:cancel-outline></Icon>
                    <p>This cannot be edited.</p>
                </div>

                <h1 class="text-xl mb-4 font-bold">Danger</h1>

                <button disabled={page.route == "overview"} onclick={() => { deletePage(); }} class="w-full disabled:opacity-25 h-12 mt-4 flex items-center justify-around font-bold rounded-full border-2 bg-red-200 dark:bg-red-800 border-red-400">
                    Delete
                </button>
            </div>
        {/if}
   {:else}
        <div class="flex items-center justify-around">
            <div class="flex flex-col items-center gap-2 text-red-500 font-bold">
                <Icon width=2rem icon=material-symbols:cancel-outline></Icon>
                <p class="text-xl">Page Not Found</p>
            </div>
        </div>
   {/if}
</div>