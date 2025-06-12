<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem'
    import Icon from '$lib/Builders/Icon.svelte'
    import Copy from './Copy.svelte';
    import { createCombobox, createDropdownMenu, melt } from '@melt-ui/svelte'

    dnt.plugin(meridiem);

    export let data;

    let names: string[] = [];

    data.snapshots.forEach((snapshot) => {
        if(snapshot.vote.for && !names.includes(snapshot.vote.for)) {
            names.push(snapshot.vote.for);
        }

        if(snapshot.vote.name && !names.includes(snapshot.vote.name)) {
            names.push(snapshot.vote.name);
        }
    });

    const {
        elements: { menu, item, trigger, arrow },
        states: { open }
    } = createDropdownMenu();

    const {
        elements: { menu: comboMenu, input, option, label },
        states: { open: comboOpen, inputValue, touchedInput, selected },
        helpers: { isSelected },
    } = createCombobox<string>({
        forceVisible: true,
    });

    $: if (!$comboOpen) {
        $inputValue = $selected?.label ?? '';
    }

    $: searching = inputValue;

    let type: 'votedFor' | 'person' = "votedFor";

    let snapshots: (typeof data)["snapshots"];
    
    $: {
        snapshots = data.snapshots.filter((snapshot) => { 
            if($selected == undefined) return true;

            if(type == 'votedFor') {
                return snapshot.vote.for?.toLowerCase() == ($searching.trim().toLowerCase()) || snapshot.vote.replacing?.toLowerCase() == ($searching.trim().toLowerCase());
            } else if(type == 'person') {
                return snapshot.vote.name?.toLowerCase() == ($searching.trim().toLowerCase());
            } else {
                return true;
            }
        });
    }

    let filteredNames: string[];

    $: {
        filteredNames = names.filter((name) => {
            const normalizedInput = $inputValue.toLowerCase().trim();

            return name.toLowerCase().includes(normalizedInput);
        })
    }
</script>

<div class="p-8 pb-2 bg-white dark:bg-zinc-800 h-full border-border-light dark:border-border-dark max-w-[40rem] w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] overflow-auto border rounded-2xl">
    <div class="flex flex-col sm:flex-row items-start sm:items-end gap-0.5 justify-between">
        <h1 class="text-xl font-bold">Votes Day {data.day} > {data.name} Mafia</h1>
        <p class="opacity-50 text-sm">{snapshots.length} Votes</p>
    </div>
    <Line class="mb-4 mt-2"></Line>

    <div class="mb-4 flex items-center gap-1 relative">
        <button use:melt={$trigger} class="bg-zinc-900 min-w-[9.5rem] px-3 py-2 rounded-l-lg rounded-r-sm flex items-center gap-1.5">
            {#if type == 'votedFor'}
                <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                Voted for
            {:else}
                <Icon scale=1.2rem icon="person"></Icon>
                Person
            {/if}
            <Icon scale=1.2rem class="ml-auto {$open ? "rotate-180" : ""} -mr-1" icon="arrow_drop_down"></Icon>
        </button>
        <div use:melt={$menu} class="bg-zinc-900 border-zinc-600 border-2 w-[9.5rem] rounded-md py-1">
            <button on:click={() => { type = "votedFor"; }} class="px-3 py-2 w-full flex items-center gap-1.5 hover:bg-white hover:bg-opacity-10 transition-all" use:melt={$item}>
                <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                Voted for
                {#if type == "votedFor"}
                    <Icon scale=1.2rem class="ml-auto -mr-1" icon="check"></Icon>
                {/if}
            </button>
            <button on:click={() => { type = "person"; }} class="px-3 py-2 w-full flex items-center gap-1.5 hover:bg-white hover:bg-opacity-10 transition-all" use:melt={$item}>
                <Icon scale=1.2rem icon="person"></Icon>
                Person
                {#if type == "person"}
                    <Icon scale=1.2rem class="ml-auto -mr-1" icon="check"></Icon>
                {/if}
            </button>
        </div>
        <input use:melt={$input} placeholder="Search" class="bg-zinc-900 px-4 w-full py-2 rounded-l-sm rounded-r-lg">
        {#if $comboOpen}
            <div use:melt={$comboMenu} class="bg-zinc-900 border-zinc-600 border-2 w-[9.5rem] rounded-md py-1 max-h-[calc(100dvh-10rem)] overflow-auto">
                {#each filteredNames as name}
                    <button class="px-3 py-2 w-full flex items-center gap-1.5 hover:bg-white hover:bg-opacity-10  data-[highlighted]:bg-white  data-[highlighted]:bg-opacity-10 transition-all" use:melt={$option({ value: name })}>
                        {name}
                    </button>
                {:else}
                    <p class="px-3 py-2">
                        ts pmo
                    </p>
                {/each}
            </div>
        {/if}
        {#if $selected}
            <button on:click={() => { $selected = undefined; $inputValue = ""; }} class="absolute top-1/2 -translate-y-1/2 right-1 p-2">
                <Icon scale=1.2rem icon=close></Icon>
            </button>
        {/if}
    </div>

    {#each snapshots as snapshot (snapshot.vote.id)}
        {@const vote = snapshot.vote}
        
        <div class="flex justify-between items-center mb-2">
            {#if vote.type == 'vote'}
                <div class="flex items-center text-green-500 font-bold gap-0.5">
                    <p>{vote.name}</p>
                    <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                    {#if vote.replacing}
                        <p>{vote.replacing}</p>
                        <Icon scale=1.2rem class="rotate-90 mx-1 text-yellow-500 font-bold" icon="switch_access_shortcut"></Icon>
                    {/if}
                    <p>{vote.for}</p>
                </div>
            {:else if vote.type == 'unvote'}
                <div class="flex items-center text-red-500 font-bold gap-0.5">
                    <p>{vote.name}</p>
                    <Icon scale=1.2rem class="rotate-[225deg] mx-0.5 translate-y-0.5" icon="call_missed"></Icon>
                    {#if vote.replacing}
                        <p>{vote.replacing}</p>
                    {/if}
                </div>
            {/if}

            {#if vote.messageId != null}
                <div class="flex gap-1">
                    <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{vote.messageId}" class="bg-zinc-900 p-2 py-1 rounded-md font-bold text-xs">
                        Jump
                    </a>

                  <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{vote.messageId}"></Copy>
                </div>
            {/if}
        </div>

        <div class="dark:bg-zinc-900 bg-zinc-100 w-full p-3 px-5 relative overflow-hidden rounded-lg mb-6">
            <div class="h-full absolute top-0 left-0 w-1 bg-yellow-400"></div>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg">Votes</h2>
                <p class="text-sm opacity-50">{dnt.format(new Date(vote.timestamp), "MMMM D, h:mm:ss A")}</p>
            </div>
            {#each snapshot.votes as segment}
                <p class="mb-1">{segment.message}</p>
            {:else}
                <p class="mb-1">No Votes Recorded</p>
            {/each}
        </div>
    {:else}
        <p class="mb-6">No Votes Recorded</p>
    {/each}
</div>