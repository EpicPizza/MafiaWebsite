<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem'
    import Icon from '$lib/Builders/Icon.svelte'
    import Copy from './Copy.svelte';
    import { createCombobox, createDropdownMenu, melt } from '@melt-ui/svelte'
    import Tag from './Tag.svelte';

    dnt.plugin(meridiem);

    export let data;

    function getTag(nickname: string) {
        return data.tags.find(tag => tag.nickname == nickname) ?? { nickname: nickname, pfp: "/favicon.png", id: nickname, color: "#ffffff" } satisfies (typeof data)["tags"][0];
    }

    let names: string[] = [];

    data.logs.filter(log => log.type != 'reset').forEach((log) => {
        if(log.search.for && !names.includes(log.search.for)) {
            names.push(log.search.for);
        }

        if(log.search.replace && !names.includes(log.search.replace)) {
            names.push(log.search.replace);
        }

        if(log.search.name && !names.includes(log.search.name)) {
            names.push(log.search.name);
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

    let logs: (typeof data)["logs"];
    
    $: {
        logs = data.logs.filter((log) => { 
            if(log.type == 'reset') return true;

            if($selected == undefined) return true;

            if(type == 'votedFor') {
                return log.search.for?.toLowerCase() == ($searching.trim().toLowerCase()) || log.search.replace?.toLowerCase() == ($searching.trim().toLowerCase());
            } else if(type == 'person') {
                return log.search.name?.toLowerCase() == ($searching.trim().toLowerCase());
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
        <p class="opacity-50 text-sm">{logs.length} Votes</p>
    </div>
    <Line class="mb-4 mt-2"></Line>

    <div class="mb-4 flex items-center gap-1 relative">
        <button use:melt={$trigger} class="bg-zinc-100 dark:bg-zinc-900 min-w-[9.5rem] px-3 py-2 rounded-l-lg rounded-r-sm flex items-center gap-1.5">
            {#if type == 'votedFor'}
                <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                Voted for
            {:else}
                <Icon scale=1.2rem icon="person"></Icon>
                Person
            {/if}
            <Icon scale=1.2rem class="ml-auto {$open ? "rotate-180" : ""} -mr-1" icon="arrow_drop_down"></Icon>
        </button>
        <div use:melt={$menu} class="bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 border-2 w-[9.5rem] rounded-md py-1">
            <button on:click={() => { type = "votedFor"; }} class="px-3 py-2 w-full flex items-center gap-1.5 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 transition-all" use:melt={$item}>
                <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                Voted for
                {#if type == "votedFor"}
                    <Icon scale=1.2rem class="ml-auto -mr-1" icon="check"></Icon>
                {/if}
            </button>
            <button on:click={() => { type = "person"; }} class="px-3 py-2 w-full flex items-center gap-1.5 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 transition-all" use:melt={$item}>
                <Icon scale=1.2rem icon="person"></Icon>
                Person
                {#if type == "person"}
                    <Icon scale=1.2rem class="ml-auto -mr-1" icon="check"></Icon>
                {/if}
            </button>
        </div>
        <input use:melt={$input} placeholder="Search" class="bg-zinc-100 dark:bg-zinc-900 px-4 w-full py-2 rounded-l-sm rounded-r-lg">
        {#if $comboOpen}
            <div use:melt={$comboMenu} class="bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 border-2 w-[9.5rem] rounded-md py-1 max-h-[calc(100dvh-10rem)] overflow-auto">
                {#each filteredNames as name}
                    {@const tag = getTag(name)}
                    <button style="color: {tag.color};" class="px-3 py-2 w-full flex items-center gap-1.5  data-[highlighted]:bg-black  data-[highlighted]:bg-opacity-10  dark:data-[highlighted]:bg-white  dark:data-[highlighted]:bg-opacity-10  transition-all" use:melt={$option({ value: name })}>
                        <img src="{tag.pfp}" alt="{tag.nickname}'s profile" class="w-5 h-5 rounded-full">{name}
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

    {#each logs.filter(log => (log.type == 'standard' && log.vote.for != log.vote.replace) || log.type != 'standard') as log (log.timestamp)}
        {#if log.type == 'standard'}
            {@const vote = log.vote}
        
            <div class="flex justify-between items-center mb-2">
                {#if vote.for != 'unvote'}
                    <div class="flex items-center text-green-500 font-bold gap-0.5">
                        <Tag tag={getTag(log.search.name)}></Tag>
                        <Icon scale=1.2rem icon="keyboard_double_arrow_right"></Icon>
                        {#if log.search.replace}
                             <Tag tag={getTag(log.search.replace)}></Tag>
                            <Icon scale=1.2rem class="rotate-90 mx-1 text-yellow-500 font-bold" icon="switch_access_shortcut"></Icon>
                        {/if}
                        <Tag tag={getTag(log.search.for ?? "---")}></Tag>
                    </div>
                {:else}
                    <div class="flex items-center text-red-500 font-bold gap-0.5">
                        <Tag tag={getTag(log.search.name)}></Tag>
                        <Icon scale=1.2rem class="rotate-[225deg] mx-0.5 translate-y-0.5" icon="call_missed"></Icon>
                        {#if log.search.replace}
                            <Tag tag={getTag(log.search.replace)}></Tag>
                        {/if}
                    </div>
                {/if}

                {#if log.messageId != null}
                    <div class="flex gap-1">
                        <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 p-2 py-1 rounded-md font-bold text-xs">
                            Jump
                        </a>

                    <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                    </div>
                {/if}
            </div>

            <div class="dark:bg-zinc-900 bg-zinc-100 w-full p-3 px-5 relative overflow-hidden rounded-lg mb-6">
                <div class="h-full absolute top-0 left-0 w-1 bg-yellow-400"></div>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg">Votes</h2>
                    <p class="text-sm opacity-50">{dnt.format(new Date(vote.timestamp), "MMMM D, h:mm:ss A")}</p>
                </div>
                {#if log.board != ""}
                    <p class="mb-1 whitespace-pre-wrap">{log.board}</p>
                {:else}
                    <p class="mb-1 whitespace-pre-wrap">No Votes Recorded</p>
                {/if}
            </div>
        {:else if log.type == 'reset'}
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center font-bold gap-2">
                    <div class="py-1 px-2 bg-red-200 dark:bg-red-900 text-black/70 dark:text-white/90 text-xs rounded-md">RESET</div>
                    {log.message}
                </div>

                {#if log.messageId != null}
                    <div class="flex items-center gap-1">
                        <p class="text-sm opacity-50 mr-3">{dnt.format(new Date(log.timestamp), "MMMM D, h:mm:ss A")}</p>

                        <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 p-2 py-1 rounded-md font-bold text-xs">
                            Jump
                        </a>

                        <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                    </div>
                {/if}
            </div>
        {:else if log.type == 'custom'}
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center font-bold gap-[5px]">
                    {#if log.prefix}
                        <Tag tag={getTag(log.search.name)}></Tag>
                    {/if}
                    <p>{log.message}</p>
                </div>

                {#if log.messageId != null}
                    <div class="flex gap-1">
                        <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 p-2 py-1 rounded-md font-bold text-xs">
                            Jump
                        </a>

                    <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                    </div>
                {/if}
            </div>
            
            <div class="dark:bg-zinc-900 bg-zinc-100 w-full p-3 px-5 relative overflow-hidden rounded-lg mb-6">
                <div class="h-full absolute top-0 left-0 w-1 bg-yellow-400"></div>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg">Votes</h2>
                    <p class="text-sm opacity-50">{dnt.format(new Date(log.timestamp), "MMMM D, h:mm:ss A")}</p>
                </div>
                {#if log.board != ""}
                    <p class="mb-1 whitespace-pre-wrap">{log.board}</p>
                {:else}
                    <p class="mb-1 whitespace-pre-wrap">No Votes Recorded</p>
                {/if}
            </div>
        {/if}
    {:else}
        <p class="mb-6">No Votes Recorded</p>
    {/each}
</div>