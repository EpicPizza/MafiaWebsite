<script lang="ts">
    import { goto } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "@iconify/svelte";

    export let data;

    let code = "";

    async function join() {
        if (!code.trim()) return;

        const result = await fetch("/party/" + code, {
            method: "PATCH",
        });

        if (result.status == 200) {
            goto("/party/" + code);
        } else {
            alert("Party not found.");
        }
    }
</script>

<Background>
    <div
        class="p-8 md:p-10 bg-white dark:bg-zinc-800 h-full border border-border-light dark:border-border-dark {data.username ==
        null
            ? 'max-w-[28rem]'
            : 'max-w-[30rem]'} w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] overflow-y-auto border shadow-2xl rounded-3xl flex flex-col items-center text-center m-auto"
    >
        {#if data.username == null}
            <h1
                class="text-3xl font-bold mb-3 text-zinc-900 dark:text-zinc-50 tracking-tight"
            >
                Party Mafia
            </h1>
            <p
                class="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed text-sm md:text-base mb-4"
            >
                Join a party and start playing! To get started, sign in with
                your Discord account or use the bot in your server.
            </p>

            <div class="flex flex-col w-full gap-6">
                <a
                    href="/session/register?redirect=/party"
                    class="w-full px-4 py-3 bg-[#5865F2] hover:bg-[#4752C4] border-2 border-[#273096] dark:border-[#273096] transition-all text-white font-semibold rounded-xl flex items-center justify-center gap-3 shadow-lg"
                >
                    <Icon class="text-3xl" icon="ic:baseline-discord" />
                    <span>Sign in with Discord</span>
                </a>

                <div class="flex items-center gap-4 text-zinc-400">
                    <div class="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                    <span
                        class="text-xs font-semibold uppercase tracking-widest text-zinc-400"
                        >Or use Mafia bot</span
                    >
                    <div class="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                </div>

                <div
                    class="bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-left relative overflow-hidden group"
                >
                    <div
                        class="absolute -right-4 -top-4 opacity-[0.05] transition-opacity"
                    >
                        <img
                            src="/ucsc-slug.png"
                            alt="UCSC '29"
                            class="w-32 h-32 rounded-3xl rotate-12"
                        />
                    </div>
                    <div
                        class="flex items-center gap-3 mb-3 text-zinc-800 dark:text-zinc-200 font-bold relative z-10"
                    >
                        <img
                            src="/ucsc-slug.png"
                            alt="UCSC '29"
                            class="w-6 h-6 rounded-md shadow-sm"
                        />
                        <h3>Sign in with Command</h3>
                    </div>
                    <p
                        class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-5 relative z-10"
                    >
                        Use Mafia Bot on <a
                            href="https://discord.gg/MTP5KqSzvv"
                            class="text-orange-500 hover:underline font-semibold"
                            >UCSC '29</a
                        > to get a sign in link!
                    </p>
                    <div
                        class="bg-white dark:bg-zinc-900 font-mono text-sm py-3 px-4 rounded-xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800 relative z-10 shadow-sm"
                    >
                        <div class="flex items-center gap-2">
                            <span class="text-zinc-400">/</span><span
                                class="text-black dark:text-white font-semibold"
                                >party</span
                            >
                        </div>
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md font-sans"
                            >Command</span
                        >
                    </div>
                </div>
            </div>
        {:else}
            <h1
                class="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-50 tracking-tight"
            >
                Enter Code
            </h1>

            <p
                class="text-zinc-500 dark:text-zinc-400 mb-10 text-center text-sm w-full max-w-sm"
            >
                Signed in as <span
                    class="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-md ml-1"
                    >{data.username}</span
                >.
            </p>

            <form class="w-full text-left" on:submit|preventDefault={join}>
                <div class="flex flex-col gap-4 w-full">
                    <div class="relative flex items-center">
                        <Icon
                            icon="ic:round-tag"
                            class="absolute left-4 text-zinc-400 text-xl"
                        />
                        <input
                            id="code"
                            bind:value={code}
                            placeholder="e.g. ABCDEF"
                            autocomplete="off"
                            class="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!code.trim()}
                        class="mt-4 w-full bg-orange-500 hover:bg-orange-600 border-2 border-orange-800 dark:border-orange-800 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-semibold text-lg py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>Join</span>
                    </button>
                </div>
            </form>
        {/if}
    </div>
</Background>
