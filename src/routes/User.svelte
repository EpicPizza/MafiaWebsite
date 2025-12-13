<script lang=ts>
    import { page } from "$app/state";
    import type { Client, User } from "$lib/Firebase/firebase.svelte";
    import Icon from "@iconify/svelte";
    
    interface Props {
        client: Client,
        user: User,
        border?: boolean
        size?: 'small' | 'large',
        width?: 'fit' | 'full',
        redirect?: string,
    }

    const { client, user, border = true, size = 'large', width = 'fit', redirect = "/" }: Props = $props();
</script>

<div class="{border ? "bg-white dark:bg-zinc-800" : "bg-zinc-300 dark:bg-zinc-700"} { size == "small" ? "p-2 gap-1" : "p-3 gap-2.5"} border-border-light dark:border-border-dark border rounded-md flex items-center {width == 'fit' ? "w-fit" : "w-full"}">
    <img alt="{user.displayName}'s Profile" src="{user.photoURL}" class="rounded-full {size == "small" ? "hidden" : "w-8 h-8"}">
    <div class="max-w-[calc(100%-1rem)] overflow-hidden">
        {#if size == 'large'}
            <p class='text-xs opacity-75'>Logged in as</p>
        {/if}
        <p class="text-sm font-bold overflow-ellipsis overflow-hidden">{user.displayName}</p>
    </div>
    <button onclick={() => { client.signOut(redirect); }} class="{width == "full" ? "ml-auto" : "ml-1"}  {size == "small" ? "w-6 h-6 min-w-6" : "w-7 h-7 min-w-7"} rounded-full dark:bg-white/10 dark:hover:bg-white/20 bg-black/10 hover:bg-black/20 transition-all flex items-center justify-around" aria-label="Log Out">
        <Icon width=0.9rem icon=material-symbols:logout></Icon>
    </button>
</div>