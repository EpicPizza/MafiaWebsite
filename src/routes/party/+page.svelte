<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Icon from "@iconify/svelte";
</script>

<Background>
    <div class="h-[calc(100dvh-2rem)] flex flex-col justify-around items-center">
        <div class="max-w-[calc(100vw-2rem)] overflow-auto w-[30rem] bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark p-8 rounded-2xl">
            <div class="flex items-center justify-between">
                <h1 class="flex items-center gap-1.5 font-bold text-xl">
                    <Icon width=1.25rem icon="material-symbols:waving-hand"></Icon>
                    Party Mafia Has Been Discontinued
                </h1>
            </div>

            <Line class="mb-4 mt-2"></Line>

            <p>Thanks for playing! Alejandro realized this doesn't really fit alongside Mafia Bot and he's too lazy to update this along side the rest of Mafia Bot. Maybe one day this will come back...</p>
        </div> 
    </div>
</Background>
