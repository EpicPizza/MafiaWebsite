<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "@iconify/svelte";

    import { page } from "$app/stores";
    import Menu from "./Menu.svelte";
    import { get, writable } from "svelte/store";
    import { browser } from "$app/environment";
    import { onMount, setContext } from "svelte";

    let { data, children } = $props();

    let current = $derived(data.indicator);

    let edit = $derived($page.route.id?.includes("/edit"));

    function commandMode() {
        const mode = writable(false);

        function set(to: boolean) {
            if(browser) {
                localStorage.setItem("commandMode", to ? "true" : "false")
            }

            mode.set(to);
        }

        function inBrowser() {
            const stored = localStorage.getItem("commandMode");

            if(typeof stored == 'string') set(stored == "true" ? true : false);
        }

        return {
            set,
            subscribe: mode.subscribe,
            update: mode.update,
            inBrowser,
        }
    }

    onMount(() => {
        mode.inBrowser();
    })

    const mode = commandMode();

    setContext("mode", mode);

    let open = $state(false);
</script>

<Background>
    <div class="flex ml-0 md:-ml-12">
        <div class="md:flex overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-2rem)] hidden flex-col gap-2 p-4 pr-8 bg-zinc-100 dark:bg-zinc-900 border-l translate-x-12 min-w-[14rem] max-w-[14rem] z-[0] border-y border-border-light dark:border-border-dark rounded-2xl rounded-r-none">
            <Menu {edit} current={current ?? "---"} pages={data.pages}></Menu>
        </div>
        <div class="z-[1]">
            {@render children?.()}
        </div>
    </div>

    
</Background>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div onclick={() => { open = false; }} class="absolute overflow-x-hidden top-4 left-4 flex overflow-y-auto max-h-[calc(100dvh-2rem)] flex-col gap-2 p-4 bg-zinc-100 dark:bg-zinc-900 border min-w-[11rem] max-w-[10rem] z-20 border-border-light dark:border-border-dark rounded-2xl">
        <Menu {edit} current={current ?? "---"} pages={data.pages}></Menu>
    </div>
{/if}

{#if open}
    <div class="w-screen h-[100dvh] bg-black/50 z-10 absolute top-0 left-0">

    </div>
{/if}

<button onclick={() => { open = !open; }} class="md:hidden z-20 bg-zinc-200 dark:bg-zinc-900 w-10 h-10 top-8 right-8 absolute rounded-lg border border-border-light dark:border-border-dark flex items-center justify-around">
    <Icon width=1.5rem icon="material-symbols:{open ? "hide" : "menu"}"></Icon>
</button>