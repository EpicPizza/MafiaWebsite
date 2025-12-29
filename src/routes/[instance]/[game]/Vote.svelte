<script lang=ts>
    import Icon from "@iconify/svelte";
    import type { Log } from "./types";
    import Tag from "./votes/[day]/Tag.svelte";
    import User from "../../User.svelte";
    import Copy from "./votes/[day]/Copy.svelte";
    import dnt from 'date-and-time';
    import meridiem from 'date-and-time/plugin/meridiem';
    import { slide } from "svelte/transition";

    dnt.plugin(meridiem);

    interface Props {
        log: Log,
        getTag: (input: string) => {
            nickname: string;
            pfp: string;
            id: string;
            color: string;
        },
        top: boolean,
        bottom: boolean,
    }

    const { log, getTag, top, bottom }: Props = $props();

    let open = $state(false);
</script>

<div class="bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {top ? "rounded-t-lg" : "rounded-t-sm"} {bottom ? "rounded-b-lg" : "rounded-b-sm"}">
    <div class="flex items-center">
        <div class="gap-3 sm:gap-0 flex-col sm:flex-row flex justify-between w-full">
            {#if log.type == 'standard'}
                {@const vote = log.vote}

                {#if vote.for != 'unvote'}
                    <div class="flex items-center text-green-700 dark:text-green-500 font-bold gap-0.5">
                        <Tag tag={getTag(log.search.name)}></Tag>
                        <Icon width=1.2rem icon=material-symbols:keyboard-double-arrow-right></Icon>
                        {#if log.search.replace}
                            <Tag tag={getTag(log.search.replace)}></Tag>
                            <Icon width=1.2rem class="rotate-90 mx-1 text-yellow-600 dark:text-yellow-500 font-bold" icon=material-symbols:switch-access-shortcut></Icon>
                        {/if}
                        <Tag tag={getTag(log.search.for ?? "---")}></Tag>
                    </div>
                {:else}
                    <div class="flex items-center text-red-600 dark:text-red-500 font-bold gap-0.5">
                        <Tag tag={getTag(log.search.name)}></Tag>
                        <Icon width=1.2rem class="rotate-[225deg] mx-0.5 translate-y-0.5" icon=material-symbols:call-missed></Icon>
                        {#if log.search.replace}
                            <Tag tag={getTag(log.search.replace)}></Tag>
                        {/if}
                    </div>
                {/if}
            {:else if log.type == 'reset'}
                <div class="flex items-center font-bold gap-2">
                    <div class="py-1 px-2 bg-red-200 border dark:border-none border-red-900 dark:bg-red-900 text-black/70 dark:text-white/90 text-xs rounded-md">RESET</div>
                    {log.message}
                </div>
            {:else}
                <div class="flex items-center font-bold gap-[5px]">
                    {#if log.prefix}
                        <Tag tag={getTag(log.search.name)}></Tag>
                    {/if}
                    <p>{log.message}</p>
                </div>
            {/if}

            {#if log.messageId != null}
                <div class="flex gap-1 items-center ml-auto">
                    <p class="text-sm mr-2">{dnt.format(new Date(log.timestamp), "h:mm a")}</p>

                    <a target="_blank" href="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}" class="bg-zinc-100 dark:bg-zinc-900 border border-border-light dark:border-border-dark p-2 py-1 rounded-md font-bold text-xs">
                        Jump
                    </a>

                    <Copy link="https://discord.com/channels/569988266657316884/695129859147694174/{log.messageId}"></Copy>
                </div>
            {/if}
        </div>

        <button onclick={() => { open = !open; }} class="ml-0 p-2 -m-2">
            {#if open}
                <Icon icon=material-symbols:collapse-all></Icon>
            {:else}
                <Icon icon=material-symbols:expand-all></Icon>
            {/if}
        </button>
    </div>

    {#if open}
        <p class="whitespace-pre-wrap text-sm p-2 bg-white dark:bg-zinc-800 rounded-sm mt-2.5" transition:slide={{ duration: 250 }}>
            {log.board == "" ? "No votes recorded." : log.board}
        </p>
    {/if}
</div>