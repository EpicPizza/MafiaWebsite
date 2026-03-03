<script lang="ts">
    import { firebaseClient } from "$lib/Firebase/firebase.svelte.js";
    import {
        collection,
        doc,
        onSnapshot,
        type Unsubscribe,
    } from "firebase/firestore";
    import { getContext, onMount, tick, untrack } from "svelte";
    import type { Encrypted, Party } from "../../helpers.server.js";
    import type { Request as ServerRequest } from "./+server";
    import Icon from "@iconify/svelte";
    import { page } from "$app/state";
    import { Tabs } from "melt/builders";
    import { pushState } from "$app/navigation";
    import User from "../../../[instance]/[game]/User.svelte";
    import Tag from "../../../[instance]/[game]/Tag.svelte";

    const { data } = $props();

    const tabs = new Tabs({ value: data.tab });
    const tabIds = ["Players", "Roles", "Messages", "Debug"];

    let group = $state(data.group);

    $effect(() => {
        if ("tab" in page.state) {
            tabs.value = page.state.tab as string;
        } else {
            pushTab(data.tab);
        }
    });

    async function pushTab(tab: string) {
        const url = untrack(() => new URL(page.url.toString()));

        url.searchParams.set("tab", tab);

        await tick();

        pushState(url.toString(), { tab: tab });
    }

    const client = getContext("client") as ReturnType<typeof firebaseClient>;

    let party: undefined | Party = $state(undefined);
    let unsubscribe: undefined | Unsubscribe = undefined;

    onMount(() => {
        if (unsubscribe) unsubscribe;

        const db = client.getFirestore();
        const ref = doc(db, "party", group.code);

        unsubscribe = onSnapshot(ref, (snapshot) => {
            party = snapshot.data() as Party;
        });
    });

    let creator: RoleInit[] = $state([]);
    let randomizing = $state(false);

    interface RoleInit {
        name: string;
        description: string;
        type: string;
        number: number;
    }

    function countRoles(roles: RoleInit[]) {
        let count = 0;

        roles.forEach((role) => {
            count += role.number;
        });

        return count;
    }

    function getRandom(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    let assigned = $state(false);

    $effect(() => {
        if (
            party &&
            "players" in party &&
            countRoles(creator) != party.players.length &&
            party.state == 312
        ) {
            assigned = false;
            group.encrypted.roles = [];
        }
    });

    function randomize() {
        if (!party) return;

        assigned = false;

        const roles = [] as Encrypted["roles"];
        const pool = [...party.players];

        creator.forEach((role) => {
            for (let i = 0; i < role.number; i++) {
                if (pool.length === 0) return;

                const index = getRandom(0, pool.length);
                const player = pool[index];

                roles.push({
                    name: role.name,
                    description: role.description,
                    type: role.type,
                    id: player.id,
                    message: "",
                    displayName: player.displayName,
                    photoURL: player.photoURL,
                });

                pool.splice(index, 1);
            }
        });

        group.encrypted.roles = roles;
        assigned = true;
    }

    function findRole(id: string) {
        const role = group.encrypted.roles.find((role) => role.id == id);

        return role;
    }

    let edited = $state(false);

    async function sendAction(request: ServerRequest) {
        const result = await fetch("/party/admin/" + group.code, {
            method: "POST",
            body: JSON.stringify(request),
        });

        if (result.status != 200) {
            alert("Server Error");
            console.log(result);
            return;
        }

        const newParty = (await result.json()) as Party;

        if (typeof newParty.encrypted == "string") return;

        group = {
            ...group,
            ...newParty,
        } as typeof group;
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
            roles: group.encrypted.roles,
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
            type: "roles",
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
            type: "messages",
        });
    }

    async function submitMessages() {
        const messages = [] as (typeof group)["encrypted"]["messages"];

        group.encrypted.roles.forEach((role) => {
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

    let userOpen = $state(false);
    let deadPlayers = $state<string[]>([]);

    function toggleDead(id: string) {
        if (deadPlayers.includes(id)) {
            deadPlayers = deadPlayers.filter((p) => p !== id);
        } else {
            deadPlayers.push(id);
        }
    }

    function getTag(player: Party["players"][0]) {
        return {
            id: player.id,
            nickname: player.displayName || player.id,
            pfp: player.photoURL || "/favicon.png",
            color: "#ffffff",
        };
    }
</script>

<div
    class="h-[calc(100dvh)] -m-4 sm:m-0 sm:h-[calc(100dvh-2rem)] flex flex-col items-center"
>
    <div
        class="max-h-full max-w-[calc(100vw)] sm:max-w-[calc(100vw-2rem)] overflow-auto w-[40rem] bg-white dark:bg-zinc-800 border-b sm:border border-border-light dark:border-border-dark p-6 sm:p-8 sm:rounded-2xl relative"
    >
        <div
            class="bg-white dark:bg-zinc-800 sticky -top-8 z-50 px-4 -mx-4 pt-8 pb-2 -mb-2 -mt-8"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    {#if group.state != 425}
                        <div
                            class="gap-2 text-yellow-800 bg-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/15 rounded-md w-8 h-8 flex justify-around items-center"
                        >
                            <Icon
                                width="1.2rem"
                                icon="material-symbols:flight-takeoff"
                            ></Icon>
                        </div>
                    {:else}
                        <div
                            class="gap-2 text-red-800 bg-red-200 dark:text-red-400 dark:bg-red-500/15 rounded-md w-8 h-8 flex justify-around items-center"
                        >
                            <Icon
                                width="1.2rem"
                                icon="material-symbols:flight-land"
                            ></Icon>
                        </div>
                    {/if}

                    <h1 class="text-xl font-bold mt-0.5 whitespace-nowrap">
                        Code: {group.code}
                    </h1>

                    <div class="flex items-center gap-1.5 ml-2">
                        {#if party}
                            {#if party.state != 425}
                                <button
                                    disabled={party.state == 312}
                                    onclick={() => {
                                        endGame();
                                    }}
                                    class="disabled:opacity-30 disabled:cursor-not-allowed bg-red-400/20 text-red-600 dark:text-red-400 enabled:hover:bg-red-400 enabled:hover:text-white px-3 py-1 rounded-md font-bold text-xs transition-all uppercase tracking-wider"
                                >
                                    End
                                </button>
                            {:else}
                                <button
                                    onclick={() => {
                                        startGame();
                                    }}
                                    class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-400/20 text-green-600 dark:text-green-400 enabled:hover:bg-green-400 enabled:hover:text-white px-3 py-1 rounded-md font-bold text-xs transition-all uppercase tracking-wider"
                                >
                                    Start
                                </button>
                            {/if}
                        {/if}
                    </div>
                </div>

                <div class="hidden sm:block">
                    <User
                        {client}
                        currentURL={page.url.pathname + page.url.search}
                    ></User>
                </div>

                <div class="block sm:hidden h-9 pt-0.5">
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            userOpen = !userOpen;
                        }}
                        class="h-8 w-8 flex items-center justify-around bg-zinc-200 dark:bg-zinc-900 rounded-full"
                    >
                        <Icon width="1.1rem" icon="material-symbols:more-vert"
                        ></Icon>
                    </button>

                    {#if userOpen}
                        <div
                            class="p-4 px-1 rounded-lg bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark right-0 top-[4.5rem] absolute z-50"
                        >
                            <User
                                {client}
                                currentURL={page.url.pathname + page.url.search}
                            ></User>
                        </div>
                    {/if}
                </div>
            </div>

            <div
                class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-3"
            >
                <div
                    {...tabs.triggerList}
                    class="bg-zinc-200 dark:bg-zinc-900 px-3 py-2 relative rounded-lg border-border-light dark:border-border-dark flex gap-2 overflow-x-auto flex-1"
                >
                    {#each tabIds as id}
                        <button
                            {...{
                                ...tabs.getTrigger(id),
                                onclick: () => {
                                    pushTab(tabs.getTrigger(id).onclick());
                                },
                            }}
                            class="font-bold {id == tabs.value
                                ? ''
                                : 'opacity-50'} min-w-20 relative text-base"
                        >
                            {id}
                        </button>
                    {/each}

                    <div
                        style="left: {tabIds.indexOf(tabs.value) * 5.5 +
                            2.75}rem"
                        class="bg-black dark:bg-white w-4 h-[3px] bottom-0 absolute rounded-t-full transition-all"
                    ></div>
                </div>

                {#if party && (party.state == 345 || party.state == 384 || party.state == 385 || party.state == 390)}
                    <div class="flex gap-0.5 items-center">
                        <button
                            onclick={() => {
                                submitHide();
                            }}
                            disabled={party.state == 345 || party.state == 390}
                            class="px-3 h-full rounded-l-lg rounded-r-sm {party.state ==
                                345 || party.state == 390
                                ? 'bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black font-bold'
                                : 'bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white'} py-2 font-bold text-base transition-all w-full sm:w-20"
                        >
                            Locked
                        </button>
                        <button
                            onclick={() => {
                                submitShowRoles();
                            }}
                            disabled={party.state == 384}
                            class="px-3 h-full rounded-sm {party.state == 384
                                ? 'bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black font-bold'
                                : ' bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white'} py-2 font-bold text-base transition-all w-full sm:w-20"
                        >
                            Roles
                        </button>
                        <button
                            onclick={() => {
                                submitShowMessages();
                            }}
                            disabled={party.state == 385}
                            class="px-3 h-full rounded-r-lg rounded-l-sm {party.state ==
                            385
                                ? 'bg-zinc-700 dark:bg-zinc-400 text-white dark:text-black font-bold'
                                : ' bg-zinc-200 dark:bg-zinc-900 text-black dark:text-white'} py-2 font-bold text-base transition-all w-full sm:w-20"
                        >
                            Msgs
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        {#each tabIds as id}
            <div {...tabs.getContent(id)}>
                {#if id == "Players"}
                    <p class="opacity-75 my-5 mb-2">
                        Players - {party?.players.length}
                    </p>
                    {#if party}
                        {#each party.players as player, i}
                            <div
                                class="flex justify-between bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 mb-0.5 {i ==
                                0
                                    ? 'rounded-t-lg'
                                    : 'rounded-t-sm'} {i ==
                                party.players.length - 1
                                    ? 'rounded-b-lg'
                                    : 'rounded-b-sm'} font-bold"
                            >
                                <Tag tag={getTag(player)}></Tag>
                                <button
                                    onclick={() => {
                                        removePlayer(player.id);
                                    }}
                                    class="text-red-500 hover:text-red-400 transition-colors"
                                >
                                    <Icon width="1.2rem" icon="mdi:close"
                                    ></Icon>
                                </button>
                            </div>
                        {:else}
                            <div
                                class="bg-zinc-200 dark:bg-zinc-900 px-3 py-2.5 rounded-lg opacity-50 italic"
                            >
                                No players in the party yet...
                            </div>
                        {/each}
                    {/if}
                {:else if id == "Roles"}
                    <div class="mt-5">
                        {#if party && party.state == 312 && !randomizing}
                            <p class="text-2xl font-bold mb-4">Create Roles</p>
                            <div class="flex flex-col gap-3">
                                {#each creator as role, i}
                                    <div
                                        class="px-4 py-3 rounded-lg bg-zinc-200 dark:bg-zinc-900 w-full"
                                    >
                                        <div
                                            class="flex items-center justify-between gap-2"
                                        >
                                            <input
                                                placeholder="Name"
                                                bind:value={role.name}
                                                class="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 flex-1"
                                            />
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <p class="text-sm opacity-60">
                                                    Type
                                                </p>
                                                <input
                                                    placeholder="Type"
                                                    bind:value={role.type}
                                                    class="px-1.5 py-0.5 w-16 text-sm rounded-md bg-white dark:bg-zinc-800"
                                                />
                                            </div>
                                        </div>
                                        <textarea
                                            bind:value={role.description}
                                            placeholder="Description"
                                            class="w-full mt-3 px-3 py-2 rounded-md bg-white dark:bg-zinc-800 min-h-20"
                                        ></textarea>
                                        <div
                                            class="flex items-center justify-between mt-2"
                                        >
                                            <button
                                                onclick={() => {
                                                    creator.splice(i, 1);
                                                    creator = creator;
                                                }}
                                                class="text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-1"
                                            >
                                                <Icon icon="mdi:delete"></Icon> Remove
                                            </button>

                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <p class="text-sm opacity-60">
                                                    Count
                                                </p>
                                                <input
                                                    placeholder="#"
                                                    bind:value={role.number}
                                                    type="number"
                                                    class="px-1.5 py-0.5 w-14 text-sm rounded-md bg-white dark:bg-zinc-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/each}

                                <button
                                    onclick={() => {
                                        creator.push({
                                            name: "",
                                            description: "",
                                            type: "",
                                            number: 1,
                                        });
                                        creator = creator;
                                    }}
                                    class="bg-zinc-200 dark:bg-zinc-900 w-full text-black dark:text-white px-3 py-2 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
                                >
                                    <Icon icon="mdi:plus"></Icon> Add Role
                                </button>

                                <button
                                    onclick={() => {
                                        randomizing = true;
                                    }}
                                    class="bg-red-500 hover:bg-red-400 text-white w-full px-3 py-2 rounded-lg font-bold text-lg mt-4 h-12"
                                >
                                    Next: Randomize
                                </button>
                            </div>
                        {:else if party && party.state == 312 && randomizing}
                            <!-- Randomization Preview -->
                            <div class="grid-cols-1 sm:grid-cols-2 gap-3 grid">
                                {#key group.encrypted.roles}
                                    {#each party.players as player}
                                        {@const role = findRole(player.id)}
                                        <div
                                            class="px-4 py-3 rounded-lg bg-zinc-200 dark:bg-zinc-900 flex items-center gap-3"
                                        >
                                            <Tag tag={getTag(player)}></Tag>
                                            <div class="flex-1 text-right">
                                                <p
                                                    class="font-bold text-lg {role
                                                        ? 'text-zinc-900 dark:text-zinc-100'
                                                        : 'text-zinc-400 italic'}"
                                                >
                                                    {role ? role.name : "?"}
                                                </p>
                                            </div>
                                        </div>
                                    {/each}
                                {/key}
                            </div>

                            <div class="flex flex-col gap-3 mt-6">
                                <button
                                    disabled={countRoles(creator) !=
                                        party.players.length}
                                    onclick={() => {
                                        randomize();
                                    }}
                                    class="disabled:opacity-30 disabled:cursor-not-allowed bg-yellow-400 text-black px-3 py-3 rounded-lg font-bold text-lg"
                                >
                                    Randomize
                                </button>
                                {#if countRoles(creator) != party.players.length}
                                    <p
                                        class="text-xs text-red-500 italic text-center"
                                    >
                                        Roles do not match players. ({countRoles(
                                            creator,
                                        )} Roles, {party.players.length} Players)
                                    </p>
                                {/if}
                                <div class="flex gap-2">
                                    <button
                                        onclick={() => {
                                            randomizing = false;
                                        }}
                                        class="bg-zinc-400 text-black px-3 py-2 rounded-lg font-bold text-lg flex-1"
                                    >
                                        Back
                                    </button>
                                    <button
                                        disabled={assigned == false}
                                        onclick={() => {
                                            submitRoles();
                                        }}
                                        class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-500 text-white px-3 py-2 rounded-lg font-bold text-lg flex-1"
                                    >
                                        Finish
                                    </button>
                                </div>
                            </div>
                        {:else if group.encrypted.roles.length > 0}
                            <p class="opacity-75 my-5 mb-2">Assigned Roles</p>
                            <div class="gap-0.5 flex flex-col">
                                {#each group.encrypted.roles as role, i}
                                    <div
                                        class="px-4 py-3 {i == 0
                                            ? 'rounded-t-lg'
                                            : 'rounded-t-sm'} {i ==
                                        group.encrypted.roles.length - 1
                                            ? 'rounded-b-lg'
                                            : 'rounded-b-sm'} bg-zinc-200 dark:bg-zinc-900 transition-opacity {deadPlayers.includes(
                                            role.id,
                                        )
                                            ? 'opacity-30'
                                            : ''}"
                                    >
                                        <div
                                            class="flex justify-between items-center mb-1"
                                        >
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <button
                                                    onclick={() =>
                                                        toggleDead(role.id)}
                                                    class="text-zinc-500 hover:text-red-500 transition-colors"
                                                >
                                                    <Icon
                                                        icon={deadPlayers.includes(
                                                            role.id,
                                                        )
                                                            ? "mdi:skull"
                                                            : "mdi:skull-outline"}
                                                    ></Icon>
                                                </button>
                                                <p class="font-bold">
                                                    {role.displayName ||
                                                        role.id}
                                                </p>
                                            </div>
                                            <p
                                                class="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded"
                                            >
                                                {role.type}
                                            </p>
                                        </div>
                                        <p
                                            class="text-lg font-bold text-yellow-500"
                                        >
                                            {role.name}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                            <p class="opacity-75 my-5 mb-2">Role Reference</p>
                            <div class="flex flex-col gap-0.5">
                                {#each creator as role, i}
                                    <div
                                        class="px-4 py-3 {i == 0
                                            ? 'rounded-t-lg'
                                            : 'rounded-t-sm'} {i ==
                                        creator.length - 1
                                            ? 'rounded-b-lg'
                                            : 'rounded-b-sm'} bg-zinc-200 dark:bg-zinc-900"
                                    >
                                        <div
                                            class="flex justify-between items-center mb-1"
                                        >
                                            <p class="font-bold">
                                                {role.name}
                                            </p>
                                            <p
                                                class="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded"
                                            >
                                                {role.type}
                                            </p>
                                        </div>
                                        <p class="text-sm">
                                            {role.description}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if id == "Messages"}
                    <div class="mt-5">
                        {#if group.encrypted.roles.length > 0}
                            <p class="opacity-75 my-5 mb-2">Player Messages</p>
                            <div class="flex flex-col gap-0.5">
                                {#each group.encrypted.roles as player, i}
                                    <div
                                        class="flex flex-col bg-zinc-200 dark:bg-zinc-900 px-4 py-3 {i ==
                                        0
                                            ? 'rounded-t-lg'
                                            : 'rounded-t-sm'} {i ==
                                        group.encrypted.roles.length - 1
                                            ? 'rounded-b-lg'
                                            : 'rounded-b-sm'} font-bold transition-opacity {deadPlayers.includes(
                                            player.id,
                                        )
                                            ? 'opacity-30'
                                            : ''}"
                                    >
                                        <div
                                            class="flex items-center gap-3 mb-2"
                                        >
                                            <button
                                                onclick={() =>
                                                    toggleDead(player.id)}
                                                class="text-zinc-500 hover:text-red-500 transition-colors"
                                            >
                                                <Icon
                                                    icon={deadPlayers.includes(
                                                        player.id,
                                                    )
                                                        ? "mdi:skull"
                                                        : "mdi:skull-outline"}
                                                ></Icon>
                                            </button>
                                            <p class="font-bold flex-1">
                                                {player.displayName ||
                                                    player.id}
                                            </p>
                                            <p class="text-xs opacity-60">
                                                Role: {player.name} ({player.type})
                                            </p>
                                        </div>
                                        <textarea
                                            onchange={() => {
                                                edited = true;
                                            }}
                                            placeholder="Write a private message for this player..."
                                            bind:value={player.message}
                                            class="px-3 py-2 bg-white dark:bg-zinc-800 rounded-md w-full min-h-16"
                                        />
                                    </div>
                                {/each}

                                <div class="flex items-center gap-3 mt-4">
                                    <button
                                        onclick={() => {
                                            group.encrypted.roles.forEach(
                                                (role) => {
                                                    role.message = "";
                                                    edited = true;
                                                },
                                            );
                                            group.encrypted.roles =
                                                group.encrypted.roles;
                                        }}
                                        class="bg-zinc-400 w-24 text-black px-3 py-2 rounded-lg font-bold"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        disabled={edited == false}
                                        onclick={() => {
                                            submitMessages();
                                        }}
                                        class="disabled:opacity-30 disabled:cursor-not-allowed bg-green-500 text-white px-3 py-2 rounded-lg font-bold flex-1"
                                    >
                                        Save & Send All
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div
                                class="bg-zinc-200 dark:bg-zinc-900 px-4 py-8 rounded-lg text-center opacity-60 italic"
                            >
                                Assign roles first before writing messages.
                            </div>
                        {/if}
                    </div>
                {:else if id == "Debug"}
                    <div class="mt-8 max-w-full overflow-x-auto">
                        <pre
                            class="bg-zinc-900 text-zinc-400 p-4 rounded-lg text-xs overflow-scroll max-w-full overflow-x-auto">{JSON.stringify(
                                data,
                                null,
                                2,
                            )}</pre>
                        <div class="my-4 border-t border-zinc-700"></div>
                        <pre
                            class="bg-zinc-900 text-zinc-400 p-4 rounded-lg text-xs overflow-x-auto max-w-full overflow-x-auto">{JSON.stringify(
                                party,
                                null,
                                2,
                            )}</pre>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>
