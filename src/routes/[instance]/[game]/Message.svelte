<script lang=ts>
    import type { CompleteUser } from "$lib/Discord/users.server";
    import Markdown from "$lib/Markdown/Markdown.svelte";
    import meridiem from "date-and-time/plugin/meridiem";
    import type { TrackedMessage } from "./types";
    import dnt from 'date-and-time';
    import Icon from "@iconify/svelte";
    import Copy from "./votes/[day]/Copy.svelte";
    import { startsWith } from "zod";
    
    dnt.plugin(meridiem);

    interface Props {
        user: CompleteUser | undefined,
        message: TrackedMessage,
    }

    const { user, message }: Props = $props();
</script>

{#if user != undefined}
    <div class="flex gap-3 group">
        <img alt="{user.nickname}'s Profile" src="{user.pfp}" class="h-10 w-10 rounded-full">

        <div class="w-full mb-0">
            <div class="items-center justify-between flex">
                <p style="color:{user.color};" class="font-bold -mt-1"><span class="text-black dark:text-inherit">{user.nickname}</span><span class="text-black dark:text-white opacity-50 text-xs ml-2">{dnt.format(new Date(message.createdTimestamp), "MM/D, h:mm A")}</span></p>

                <div class="hidden group-hover:flex items-center gap-1 -mt-2 -my-1">
                    <a target="_blank" href="https://discord.com/channels/{message.guildId}/{message.channelId}/{message.id}" class="bg-zinc-100 dark:bg-zinc-900 border border-border-light dark:border-border-dark p-2 py-1 rounded-md font-bold text-xs">
                        Jump
                    </a>

                    <Copy link="https://discord.com/channels/{message.guildId}/{message.channelId}/{message.id}"></Copy>
                </div>
            </div>

            {#if message.cleanContent.length > 0}
                <div class="-mt-5 -mb-3">
                    <Markdown content={message.cleanContent}></Markdown>
                </div>
            {/if}

            {#if message.attachments}
                {#each message.attachments as attachment}
                    {#if attachment.contentType?.startsWith('image/')}
                        <img src={attachment.url} alt={attachment.name} class="max-w-full max-h-96 rounded-lg mt-2" />
                    {:else if attachment.contentType?.startsWith('video/')}
                        <!-- svelte-ignore a11y_media_has_caption -->
                        <video controls src={attachment.url} class="max-w-full max-h-96 rounded-lg mt-2"></video>
                    {:else}
                        <div class="flex items-center gap-2 mt-2 p-3 bg-white dark:bg-zinc-800 rounded-lg w-fit">
                            <Icon width=1.5rem icon=material-symbols:file-present-outline></Icon>

                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline font-medium">
                                {attachment.name}
                            </a>
                            <span class="text-xs text-gray-500">({(attachment.size / 1024).toFixed(2)} KB)</span>
                        </div>
                    {/if}
                {/each}
            {/if}

            {#if message.embeds}
                <div class="mb-2">
                    {#each message.embeds as embed}
                        <div class="mt-2 p-4 pt-3.5 pl-5 rounded-lg bg-white dark:bg-zinc-800 relative overflow-hidden">
                            <div class="absolute w-1 h-full top-0 left-0" style="background-color: {"#" + (embed.color?.toString(16) ?? '202225')};"></div>

                            {#if embed.author}
                                <div class="flex items-center mb-2">
                                    {#if embed.author.icon_url}
                                        <img src={embed.author.icon_url} alt="author icon" class="w-6 h-6 rounded-full mr-2">
                                    {/if}
                                    {#if embed.author.url}
                                        <a href={embed.author.url} target="_blank" rel="noopener noreferrer" class="font-bold text-sm hover:underline">{embed.author.name}</a>
                                    {:else}
                                        <span class="font-bold text-sm">{embed.author.name}</span>
                                    {/if}
                                </div>
                            {/if}

                            {#if embed.title}
                                {#if embed.url}
                                    <a href={embed.url} target="_blank" rel="noopener noreferrer" class="text-base font-bold hover:underline">{embed.title}</a>
                                {:else}
                                    <h2 class="text-base font-bold">{embed.title}</h2>
                                {/if}
                            {/if}

                            {#if embed.description}
                                <p class="text-sm mt-1.5 whitespace-pre-wrap">{embed.description}</p>
                            {/if}

                            {#if embed.fields && embed.fields.length > 0}
                                <div class="grid gap-4 mt-4" style:grid-template-columns={embed.fields.some((f: { inline: any; }) => f.inline) ? 'repeat(auto-fit, minmax(150px, 1fr))' : '1fr'}>
                                    {#each embed.fields as field}
                                        <div>
                                            <h3 class="font-bold text-sm">{field.name}</h3>
                                            <p class="text-sm whitespace-pre-wrap">{field.value}</p>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            {#if embed.image}
                                <img src={embed.image.url} alt="embed" class="max-w-full rounded-lg mt-4">
                            {/if}

                            {#if embed.footer}
                                <div class="flex items-center text-xs mt-2 text-gray-500 dark:text-gray-400">
                                    {#if embed.footer.icon_url}
                                        <img src={embed.footer.icon_url} alt="footer icon" class="w-4 h-4 rounded-full mr-2">
                                    {/if}
                                    <span>{embed.footer.text}</span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            {#if message.reactions && message.reactions.length > 0}
                <div class="flex flex-wrap gap-1 mb-2">
                    {#each message.reactions.filter(reaction => reaction.id.length > 0) as reaction}
                        <div class="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md text-sm">
                            {#if reaction.emoji && reaction.emoji.startsWith("<:")}
                                <img 
                                    src={`https://cdn.discordapp.com/emojis/${reaction.emoji.substring(reaction.emoji.lastIndexOf(":") + 1, reaction.emoji.length - 1)}.png`} 
                                    alt={reaction.emoji} 
                                    class="w-4 h-4 object-contain"
                                >
                            {:else}
                                <span>{reaction.emoji}</span>
                            {/if}
                            <span class="font-bold text-xs">{reaction.id.length}</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        
    </div>
{:else}

{/if}