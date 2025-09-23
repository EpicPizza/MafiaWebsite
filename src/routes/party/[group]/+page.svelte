<script lang=ts>
    import { firebaseClient } from "$lib/Firebase/firebase";
    import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
    import { getContext, onMount } from "svelte";
    import type { Party } from "../helpers.server";
    import Icon from "@iconify/svelte";
    import { browser } from "$app/environment";

    export let data;

    const client = getContext('client') as ReturnType<typeof firebaseClient>;

    let party: undefined | Party;
    let unsubscribe: undefined | Unsubscribe;

    onMount(() => {
        if(unsubscribe) unsubscribe;

        const db = client.getFirestore();
        const ref = doc(db, "party", data.code);

        unsubscribe = onSnapshot(ref, snapshot => {
            party = snapshot.data() as Party;

        })
    });

    let me: undefined | Party["players"][0] = undefined;

    $: {
        me = party?.players.find(player => player.id == data.id );
    }

    let message = {
        text: "",
    }

    let messageId: string | null = null;
    let showMessage = false;

    let role = {
        name: "",
        description: "",
        type: "",
        show: false,
        received: false,
    }

    $: {
        if(party && role.received == false && (party?.state == 345 || (party?.state != 312 && party?.state != 425))) {
            getRole();
        }
    }

    $: {
        if(party && me?.message && messageId != me.message && party?.state != 345 && party?.state != 425) {
            getMessage();
        }
    }

    $: {
        if(party && party.state == 384) {
            role.show = false;
        }
    }

    $: {
        if(party && party.state == 385) {
            showMessage = false;
        }
    }

    $: {
        if(party && party.state == 425) {
            showMessage = false;
            messageId = null;
            message.text = "";

            role.name = "";
            role.description = "";
            role.type = "";
            role.show = false;
            role.received = false;
        }
    }


    async function getMessage() {
        if(!browser) return;

        const result = await fetch("/party/" + data.code, {
            method: "POST",
            body: JSON.stringify({
                action: "message",
                id: me?.id ?? "---",
            })
        });
        
        if(result.status != 200) {
            console.log(result);
            alert("Failed to get message.");
            return;
        }
 
        const json = await result.json();

        messageId = json.id;
        message.text = json.message;
    }

     async function getRole() {
        if(!browser) return;

        const result = await fetch("/party/" + data.code, {
            method: "POST",
            body: JSON.stringify({
                action: "role",
            })
        });
        
        if(result.status != 200) {
            console.log(result);
            alert("Failed to get message.");
            return;
        }

        const json = await result.json();

        role.name = json.name;
        role.description = json.description;
        role.type = json.type;
        role.show = false;
        role.received = true;
    }
</script>

<div class="bg-zinc-100 dark:bg-zinc-900 w-full h-[100dvh] p-4">
    {#if party == undefined}
        <div class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
            <div class="flex flex-col gap-5 items-center">
                <p class="text-4xl font-bold">Loading</p>
            </div>
        </div>
    {:else if party.state == 312}
        <div class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
            <div class="flex flex-col gap-5 items-center">
                <Icon class="text-8xl" icon=material-symbols:hourglass-outline></Icon>
                <p class="text-4xl font-bold">Starting...</p>
            </div>
        </div>
    {:else if party.state == 345}
        <div class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
            <div class="flex flex-col gap-5 items-center">
                <Icon class="text-8xl" icon=material-symbols:check-box-outline></Icon>
                <p class="text-4xl font-bold text-center">Game has started... <span class="italic">{role.received ? "(Role Recieved)" : "(Fetching Role)"}</span></p>
            </div>
        </div>
    {:else if party.state == 390}
        <div class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
            <div class="flex flex-col gap-5 items-center">
                <Icon class="text-8xl" icon=material-symbols:lock-outline></Icon>
                <p class="text-4xl font-bold text-center">Game is locked.</p>
            </div>
        </div>
    {:else if party.state == 384}
        {#if role.show}
            <button on:click={() => { role.show = false; }} class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
                <div class="flex flex-col gap-3 items-center">
                    <Icon class="text-8xl mb-2" icon=material-symbols:disabled-visible></Icon>
                    <p class="text-4xl font-bold text-center">{role.name}</p>
                    <p class="text-2xl font-bold text-center opacity-80">Type {role.type}</p>
                    <p class="text-3xl font-bold text-center">{role.description}</p>
                </div>
            </button>
        {:else}
            <button on:click={() => { role.show = true; }} class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
                <div class="flex flex-col gap-5 items-center">
                    <Icon class="text-8xl" icon=material-symbols:disabled-visible></Icon>
                    <p class="text-4xl font-bold text-center">Click to show role.</p>
                </div>
            </button>
        {/if}
    {:else if party.state == 385}
        {#if showMessage}
            <button on:click={() => { showMessage = false; }} class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
                <div class="flex flex-col gap-3 items-center">
                    <Icon class="text-8xl mb-2" icon=material-symbols:disabled-visible></Icon>
                    <p class="text-4xl font-bold text-center">{role.name}</p>
                    <p class="text-2xl font-bold text-center opacity-80">Type {role.type}</p>
                    <p class="text-2xl font-bold text-center">{role.description}</p>

                    <p class="text-4xl mt-8 font-bold text-center">Message</p>
                    <p class="text-2xl font-bold text-center">{message.text}</p>
                </div>
            </button>
        {:else}
            <button on:click={() => { showMessage = true; }} class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
                <div class="flex flex-col gap-5 items-center">
                    <Icon class="text-8xl" icon=material-symbols:disabled-visible></Icon>
                    <p class="text-4xl font-bold text-center">Click to show message.</p>
                </div>
            </button>
        {/if}
    {:else if party.state == 425}
        <div class="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-md w-full h-full flex items-center justify-around">
            <div class="flex flex-col gap-5 items-center">
                <Icon class="text-8xl" icon=material-symbols:celebration></Icon>
                <p class="text-4xl font-bold text-center">Game has ended.</p>
            </div>
        </div>
    {/if}
</div>

<pre>{JSON.stringify(me, null, 2)}</pre>

<pre>{JSON.stringify(role, null, 2)}</pre>

<pre>{JSON.stringify(message, null, 2)}</pre>