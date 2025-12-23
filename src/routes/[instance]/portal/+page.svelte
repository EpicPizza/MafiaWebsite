<script lang=ts>
    import Line from '$lib/Builders/Line.svelte';
    import { getContext } from 'svelte';
    import type { Client } from '$lib/Firebase/firebase.svelte.js';
    import Icon from '@iconify/svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import User from '../../User.svelte';
    import { page } from '$app/state';
    import Input from '$lib/Input.svelte';

    const { data } = $props();

    const client = getContext("client") as Client;

    let clicked = $state(false);
    let command = $state("");

    let call = $state({ initiated: false, sent: false, received: false, result: undefined as any });

    async function startCommand() {
        const response = await fetch('/' + data.instance.id + '/command', {
            method: "POST",
            body: JSON.stringify({
                command: command,
            })
        });
        
        if (!response.body) return;

        call = { initiated: true, sent: false, received: false, result: undefined };

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += value;

            if (buffer.startsWith('---1---')) {
                call.sent = true;
                buffer = buffer.substring(7);
            }
            
            if (buffer.startsWith('---2---')) {
                call.received = true;
                buffer = buffer.substring(7);
            }
            
            if (buffer.startsWith('---3---')) {
                try {
                    const result = JSON.parse(buffer.substring(7));
                    call.result = result;
                    clicked = false;
                    buffer = ''; // Assume this is the last message
                } catch (e) {
                    // JSON is not complete, wait for more chunks
                }
            }
        }
    }

    $inspect(call);
</script>

{#if client.user}
    <div class="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
        <div class="max-h-[calc(100dvh-10rem)] md:max-h-full max-w-[calc(100vw-2rem)] overflow-auto w-[30rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl relative">
            <h1 class="text-xl font-bold">{data.instance.id.toUpperCase()} Portal</h1>

            <Line class="mb-6 mt-2"></Line>

            <Input bind:value={command} light label=Command name=command />
    
            {#if call.result} 
                {@const result = call.result}

                {#if 'error' in result}
                    <div class="border-2 rounded-xl border-red-500 bg-red-500/20 p-4 flex items-center gap-4">
                        <Icon width=1.3rem icon=material-symbols:cancel></Icon>
                        <div>
                            <p class="font-light">Error Executing Command</p>
                            <p class="fontb-old">{result.error}</p>
                        </div>
                    </div>
                {/if}
                
                {#if ('content' in result && result.content != null) || 'reaction' in result}
                    <div class="bg-black/10 dark:bg-white/5 rounded-lg p-4 flex items-center gap-3">
                        <Icon width=24px icon=material-symbols:verified></Icon>
                        {#if 'reaction' in result && result.reaction == '✅'}
                            Command executed.
                        {:else if 'content' in result && result.content != null}
                            {result.content}
                        {/if}
                    </div>
                {/if}

                {#if result.embeds}
                    {#each result.embeds as embed}
                        <div class="mt-4 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900" style:border-left="4px solid {embed.color ?? '#202225'}">
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
                                    <a href={embed.url} target="_blank" rel="noopener noreferrer" class="text-lg font-bold hover:underline">{embed.title}</a>
                                {:else}
                                    <h2 class="text-lg font-bold">{embed.title}</h2>
                                {/if}
                            {/if}

                            {#if embed.description}
                                <p class="text-sm mt-1 whitespace-pre-wrap">{embed.description}</p>
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
                                <img src={embed.image} alt="embed" class="max-w-full rounded-lg mt-4">
                            {/if}

                            {#if embed.footer}
                                <div class="flex items-center text-xs mt-4 text-gray-500 dark:text-gray-400">
                                    {#if embed.footer.url}
                                        <img src={embed.footer.url} alt="footer icon" class="w-4 h-4 rounded-full mr-2">
                                    {/if}
                                    <span>{embed.footer.text}</span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/if}
            {:else if call.received} 
                <div class="bg-black/10 dark:bg-white/5 rounded-lg p-4 flex items-center gap-3">
                    <img alt="loading" width="24rem" src="/loading.gif">
                    <p class="font-bold">Executing command...</p>
                </div>
            {:else if call.sent}
                <div class="bg-black/10 dark:bg-white/5 rounded-lg p-4 flex items-center gap-3">
                    <Icon width=1.3rem icon=material-symbols:satellite-alt></Icon>
                    <p class="font-bold">Sending command...</p>
                </div>
            {/if}

            <button disabled={clicked} onclick={() => { clicked = true; startCommand(); }} class="w-full disabled:opacity-25 h-12 mt-8 flex items-center justify-around font-bold rounded-xl border-2 disabled:cursor-not-allowed bg-orange-200 dark:bg-orange-800 border-orange-400 transition-all">
                {#if clicked == false}
                    Run
                {:else}
                    <div class="w-[18.5px] h-[18.5px] rounded-full border-2 bg-none animate-spin border-t-black border-l-black dark:border-t-white dark:border-l-white border-r-transparent border-b-transparent"></div>
                {/if}
            </button>
        </div>
    </div>

    <div class="fixed bottom-4 left-4">
        <User {client} user={client.user} size=large></User>
    </div>
{/if}