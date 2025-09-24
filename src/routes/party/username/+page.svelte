<script lang=ts>
    import { goto } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "@iconify/svelte";

    let nickname = "";
    let code = "";

    async function signin() {
        const parsed = parseInt(code);

        if(code.length != 4 || isNaN(parsed)) {
            alert("Invalid code format.");
            return;
        }

        const result = await fetch("/party/username", {
            method: "POST",
            body: JSON.stringify({
                nickname: nickname,
                code: parsed,
            })
        });

        if(result.status == 401) {
            alert("Account found. Code invalid.");
            return;
        } else if(result.status != 200) {
            alert("Server Error");
            return;
        }

        goto("/party");
    }
</script>

<Background>
    <div class="p-8 bg-white dark:bg-zinc-800 h-full border-border-light dark:border-border-dark max-w-[30rem] w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] overflow-auto border rounded-2xl">
        <div class="flex flex-col gap-3">
            <p class="font-bold text-3xl mb-4">Sign In</p>
            <p class="text-lg mb-6">If the nickname does not exist, an account with the code will be made.</p>
            <p>Nickname</p>
            <input bind:value={nickname} placeholder=nickname class="bg-zinc-100 dark:bg-zinc-900  rounded-lg px-5 py-3">
            <p>Code (4 Letter Number)</p>
            <input bind:value={code} placeholder=code class="bg-zinc-100 dark:bg-zinc-900  rounded-lg px-5 py-3 mb-8">
            <button on:click={() => { signin();  }} class="bg-orange-400 text-black px-5 py-3 rounded-lg">Sign In</button>
        </div>
    </div>
</Background>