<script lang=ts>
    import { goto } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "@iconify/svelte";

    export let data;

    let code = "";

    async function join() {
        const result = await fetch("/party/" + code, {
            method: "PATCH",
        });

        if(result.status == 200) {
            goto("/party/" + code);
        } else {
            alert("Party not found.");
        }
    }
</script>

<Background>
    <div class="p-8 bg-white dark:bg-zinc-800 h-full border-border-light dark:border-border-dark max-w-[40rem] w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] overflow-auto border rounded-2xl">
        {#if data.username == null}
            <div class="flex justify-around">
                <a href="/party/signin" class="px-4 py-3 bg-black rounded-md">
                    <div class="flex items-center gap-3">
                        <Icon class="text-2xl" icon=ic:baseline-discord></Icon>
                        <p>Sign in with Discord</p>
                    </div>
                </a>
            </div>
        {:else}
            <p class="text-center font-bold text-lg mb-10">You are signed in as <span class="text-orange-500">{data.username}</span>.</p>

            <p class="text-center font-bold text-3xl mb-8">Enter Code</p>
            <div class="flex justify-around w-full">
                <div class="flex gap-3 items-center">
                    <input bind:value={code} placeholder=Code class="bg-zinc-100 dark:bg-zinc-900  rounded-lg px-5 py-3">
                    <button on:click={() => { join(); }} class="bg-orange-400 text-black px-5 py-3 rounded-lg">Join</button>
                </div>
            </div>
        {/if}
    </div>
</Background>
