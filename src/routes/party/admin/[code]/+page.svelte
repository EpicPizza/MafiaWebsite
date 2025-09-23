<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import { firebaseClient } from "$lib/Firebase/firebase.js";
    import { collection, doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
    import { getContext, onMount } from "svelte";
    import type { Encrypted, Party } from "../../helpers.server.js";
    import type { Request as ServerRequest } from "./+server";
    import Icon from "@iconify/svelte";

    const client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let data;

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

    let creator: RoleInit[] = [];
    let randomizing = false;

    interface RoleInit {
        name: string,
        description: string,
        type: string,
        number: number,
    }

    function countRoles(roles: RoleInit[]) {
        let count = 0;

        roles.forEach(role => {
            count += role.number;
        });

        return count;
    }

    let showPlayers = false;

    function getRandom(min: number, max: number) {
        return Math.floor((Math.random() * (max - min) + min));
    }

    let assigned = false;

    $: {
        if(party && 'players' in party && countRoles(creator) != party.players.length && party.state == 312) {
            assigned = false;
            data.encrypted.roles = [];
        }
    }

    function randomize() {
        if(party == undefined) return;

        const roles = [] as Encrypted["roles"];

        const players = structuredClone(party.players);

        creator.forEach(role => {
            for(let i = 0; i < role.number; i++) {
                const index = getRandom(0, players.length);

                roles.push({
                    name: role.name,
                    description: role.description,
                    type: role.type,
                    id: players[index].id,
                    message: "",
                });

                players.splice(index, 1);
            }
        });

        data.encrypted.roles = roles;
        assigned = true;
    }

    function findRole(id: string) {
        const role = data.encrypted.roles.find(role => role.id == id);

        return role;
    }

    let edited = false;

    async function sendAction(request: ServerRequest) {
        const result = await fetch("/party/admin/" + data.code, {
            method: "POST",
            body: JSON.stringify(request)
        });

        if(result.status != 200) {
            alert("Server Error");
            console.log(result);
            return;
        }

        const newParty = await result.json() as Party;

        if(typeof newParty.encrypted == 'string') return;

        data = {
            ...data,
            ...newParty,
        } as typeof data;
    }

    async function endGame() {
        await sendAction({
            action: "end",
        });
    }

    async function startGame() {
        await sendAction({
            action: "start",
        });

        randomizing = false;
        assigned = false;
    }

    async function show() {
        await sendAction({
            action: "start",
        });

        randomizing = false;
        assigned = false;
    }

    async function submitRoles() {
        await sendAction({
            action: "roles",
            roles: data.encrypted.roles,
        });
    }

    async function submitHide() {
        await sendAction({
            action: "hide",
        });
    }

    async function submitShowRoles() {
        await sendAction({
            action: "show",
            type: "roles"
        });
    }

    async function removePlayer(id: string) {
        await sendAction({
            action: "remove",
            id: id,
        });
    }

    async function submitShowMessages() {
        await sendAction({
            action: "show",
            type: "messages"
        });
    }

    async function submitMessages() {
        const messages = [] as (typeof data)["encrypted"]["messages"];

        data.encrypted.roles.forEach(role => {
            messages.push({
                id: "",
                for: role.id,
                message: role.message,
            });
        });

        await sendAction({
            action: "messages",
            messages: messages,
        });

        edited = false;
    }
</script>

<div class="bg-zinc-900 px-6 py-4 w-full flex items-center justify-between">
    <div class="flex gap-3 items-center">
        <p class="font-bold text-3xl mr-8">{data.code}</p>
        {#if party && party.state != 425}
            <button disabled={data.state == 312} on:click={() => { endGame(); }} class="disabled:opacity-30 disabled:cursor-not-allowed bg-red-400 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg">
                End
            </button>
        {:else}
            <button on:click={() => { startGame(); }} class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-400 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg">
                Start
            </button>
        {/if}
        <p class="ml-4 opacity-30 font-light">State {data.state}</p>
    </div>

    {#if party && (party.state == 345 || party.state == 384 || party.state == 385 || party.state == 390)}
        <div class="flex gap-3 items-center">
            <button on:click={() => { submitHide(); }} disabled={party.state == 345 || party.state == 390} class="bg-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed text-black px-3 py-2 rounded-lg font-bold text-lg">
                Locked
            </button>
            <button on:click={() => { submitShowRoles(); }} disabled={party.state == 384} class="bg-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed text-black px-3 py-2 rounded-lg font-bold text-lg">
                Roles
            </button>
            <button on:click={() => { submitShowMessages(); }} disabled={party.state == 385} class="bg-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed text-black px-3 py-2 rounded-lg font-bold text-lg">
                Messages
            </button>
        </div>
    {/if}

    <div class="flex gap-3 items-center">
        <button on:click={() => { showPlayers = !showPlayers }} class="bg-zinc-400 text-black px-3 py-2 rounded-lg font-bold text-lg">
            {showPlayers ? "Hide" : "Show"} Players
        </button>
    </div>
</div>

{#if showPlayers && party}
    <div class="bg-zinc-700 px-7 py-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 grid gap-2">
        {#each party.players as player}
            <div class="flex items-center gap-2">
                <p>{player.id}</p>
                <button on:click={() => { removePlayer(player.id); }}>
                    <Icon icon=mdi:close></Icon>
                </button>
            </div>
        {/each}
    </div>
{/if}

<div class="px-6 py-4 mb-20">
    {#if data.state == 312 && randomizing == false && party}
        <p class="text-3xl font-bold mb-8 mt-4">Create Roles</p>

        <div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid gap-3">
            {#each creator as role, i}
                <div class="px-4 py-3 rounded-lg bg-zinc-900 w-full">
                    <div class="flex items-center justify-between">
                        <input placeholder="Name" bind:value={role.name} class="px-2 py-1 rounded-md bg-zinc-800">
                        <div class="flex items-center flex-col gap-1">
                            <p class="text-sm">Type</p>
                            <input placeholder="Type" bind:value={role.type} class="px-1.5 py-0.5 w-14 text-sm rounded-md bg-zinc-800">
                        </div>
                    </div>
                    <textarea bind:value={role.description} class="w-full mt-3 px-3 py-2 rounded-md bg-zinc-800"></textarea>
                    <div class="flex items-center justify-between">
                        <button on:click={() => { creator.splice(i, 1); creator = creator; }} class="bg-red-600 mt-3 w-20 text-white px-3 py-2 rounded-lg font-bold text-lg block">
                            Delete
                        </button>

                        <div class="flex gap-1">
                            <p>#: </p>
                            <input placeholder="#" bind:value={role.number} type="number" class="px-1.5 py-0.5 w-14 text-sm rounded-md bg-zinc-800">
                        </div>
                    </div>
                </div>
            {:else}
                no roles?
            {/each}
        </div>

        <button on:click={() => { creator.push({ name: "", description: "", type: "", number: 1 }); creator = creator; }} class="bg-yellow-400 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg mt-4 block">
            Create
        </button>

        <button on:click={() => { randomizing = true; }} class="bg-red-600 mt-20 w-20 text-white px-3 py-2 rounded-lg font-bold text-lg block">
            Next
        </button>
    {:else if data.state == 312 && randomizing && party}
        <div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid gap-3">
            {#key data.encrypted.roles}
                {#each party.players as player}
                    {@const role = findRole(player.id)}
                    <div class="px-4 py-3 rounded-lg h-44 bg-zinc-900 w-full flex items-center justify-around">
                        <div class="text-center">
                            <p class="text-3xl font-bold mb-3">{player.id}</p>
                            <p class="text-2xl font-bold">{role ? role.name : "?"}</p>
                        </div>
                    </div>    
                {/each}
            {/key}
        </div>

        <button disabled={countRoles(creator) != party.players.length} on:click={() => { randomize(); }} class="disabled:opacity-30 disabled:cursor-not-allowed bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold text-lg mt-4 block">
            Randomize
        </button>
        {#if countRoles(creator) != party.players.length}
            <p class="opacity-80 italic mt-4">Roles cannot be randomized since the number of roles do not match the number of players. ({countRoles(creator)} Roles, {party.players.length} Players)</p>
        {/if}

        <div class="flex items-center gap-3">
            <button on:click={() => { randomizing = false; }} class="bg-zinc-400 mt-20 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg block">
                Back
            </button>
            <button disabled={assigned == false} on:click={() => { submitRoles(); }} class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-400 mt-20 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg block">
                Next
            </button>
        </div>
    {:else if party && (party.state == 345 || party.state == 384 || party.state == 385 || party.state == 390)}
        <div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid gap-3">
            {#each data.encrypted.roles as player}
                <div class="px-4 py-3 rounded-lg h-44 bg-zinc-900 w-full flex items-center justify-around">
                    <div class="text-center w-full">
                        <p class="text-3xl font-bold mb-3">{player.id} - {player ? player.name : "?"}</p>
                        <textarea on:change={() => { edited = true; }} placeholder="Message" bind:value={player.message} class="px-3 py-2 mt-4 bg-zinc-800 rounded-md w-full min-h-12" />
                    </div>
                </div>    
            {/each}
        </div>

        <div class="flex items-center gap-3 mt-8">
            <button on:click={() => { data.encrypted.roles.forEach(role => { role.message = ""; edited = true; }); data.encrypted.roles = data.encrypted.roles; }} class="bg-zinc-400 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg block">
                Reset
            </button>
            <button disabled={edited == false} on:click={() => { submitMessages(); }} class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-400 w-20 text-black px-3 py-2 rounded-lg font-bold text-lg block">
                Send
            </button>
        </div>
    {/if}
</div>

<pre>{JSON.stringify(data, null, 2)}</pre>

-

<pre>{JSON.stringify(party, null, 2)}</pre>