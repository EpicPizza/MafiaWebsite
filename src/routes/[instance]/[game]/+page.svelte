<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import Icon from '@iconify/svelte';
    import { Tabs } from "melt/builders";
    import { flip } from 'svelte/animate';

    const { data } = $props();

    const tabs = new Tabs({ value: "Home" as string });
    const tabIds = ["Home", "Players", "Pins", "Stats", "Votes", "Debug"];


</script>

<div class="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
    <div class="max-h-[calc(100dvh-10rem)] md:max-h-full max-w-[calc(100vw-2rem)] overflow-auto w-[40rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl relative">
        
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold mt-0.5">{data.game.name} Mafia</h1>
            <div class="flex items-center gap-1.5 text-yellow-800 bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/15 rounded-md px-3 py-1">
                <Icon width=1.2rem icon=material-symbols:flight-takeoff></Icon>
                <p class="font-bold">Game In Progress</p>
            </div>
        </div>

        <div {...tabs.triggerList} class="bg-zinc-200 dark:bg-zinc-900 px-3 mt-3 py-2 relative rounded-md border-border-light dark:border-border-dark flex gap-2">
            {#each tabIds as id}
                <button {...tabs.getTrigger(id)} class="font-bold {id == tabs.value ? "" : "opacity-50"} w-20 relative text-base">
                    {id}
                </button>
            {/each}

            <div style="left: {(tabIds.indexOf(tabs.value) * 5.5) + 1.5}rem" class="bg-black dark:bg-white w-14 h-[3px] bottom-0 absolute rounded-t-full transition-all"></div>
        </div>

        {#each tabIds as id}
            <div {...tabs.getContent(id)}>
                {#if id == "Home"}
                    <div class="border shadow-md dark:shadow-xl border-border-light dark:border-border-dark mt-6 min-h-[30rem] w-full flex items-center justify-around rounded-lg">
                        <div class="flex flex-col gap-2 items-center">
                            <div class="bg-zinc-200 dark:bg-zinc-700 h-20 w-20 rounded-full flex items-center justify-around">
                                <Icon width=3rem icon=material-symbols:construction></Icon>
                            </div>
                            <p class="text-lg font-bold">Under Construction</p>
                        </div>
                    </div>
                {:else if id == "Players"}
                    <div class="border shadow-md dark:shadow-xl border-border-light dark:border-border-dark mt-6 h-[30rem] w-full rounded-lg p-6 flex flex-col gap-3">
                        {#each data.users as user}
                            {@const alive = !!data.global.players.find(player => player.id == user.id)}
                            <div class="flex justify-between items-center {alive ? "" : "opacity-30"}">
                                <div class="flex items-center gap-2">
                                    <img alt="{user.nickname}'s Profile" class="rounded-full h-8 w-8" src="{user.pfp}">
                                    <p style="color: {user.color};" class="font-bold">{user.nickname}</p>
                                </div>
                                <p class="px-2 py-1 bg-black rounded-md font-bold text-sm">
                                    { alive ? "Alive" : "Dead" }
                                </p>
                            </div>
                            <Line></Line>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>