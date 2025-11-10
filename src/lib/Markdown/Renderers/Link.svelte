<script lang="ts">
  import { page } from "$app/stores";
  import Icon from "@iconify/svelte";
  import Page from "../../../routes/+page.svelte";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
    import { includes } from "zod";

  export let href: string = "";
  export let title: string | undefined = undefined;

  $: pages = $page.data.pages as Page[];
  $: commands = $page.data.commands as { [key: string]: { type: string, name: string, slash?: string, text?: string, arguments: { name: string, description: string, type: 'slash' | 'text' }[], description: string, shorthand: string } };

  const mode = getContext("mode") as Writable<boolean>;
</script>

{#if href.startsWith("/docs")}
  {@const page = pages.find(page => page.route == href.substring(href.lastIndexOf("/") + 1))}

  {#if page != undefined}
      <a href="/docs/{page.route}" class="p-4 bg-zinc-200 mt-2 -mb-2 w-full text-left inline-block dark:bg-zinc-900 border-2 border-border-light dark:border-border-dark rounded-md relative overflow-hidden">
          <div class="flex items-center gap-1.5 text-lg mb-2">
              <Icon width=1.25rem icon="material-symbols:{page.icon}"></Icon>
              <p class="font-bold">{page.title}</p>
          </div>
          <p class="text-sm opacity-80">{page.description}</p>
      </a>
  {/if}
{:else if href.startsWith(":") || href.startsWith("+")}
    {@const command = commands["help-" + href.substring(1)]}

    {#if command}
      <div class="rounded-lg dark:bg-zinc-900">
        <div class="{href?.includes("+") ? "" : "-mt-6"} text-sm px-3 py-3 font-bold bg-zinc-200 dark:bg-zinc-800 border-2 border-border-light dark:border-border-dark rounded-lg">{$mode ? ('slash' in command ? command.slash : "No slash command version.") : ('text' in command ? command.text : "No text command version.")}</div>

        <div class="text-sm px-3 py-3 rounded-b-lg border-2 border-t-0 border-border-light dark:border-border-dark -mt-2 pt-4">
          <p class="leading-normal">{command.description}</p>

          <div class="pl-2 mb-1 mt-1.5">
            {#each command.arguments.filter(p => $mode ? p.type == 'slash' : p.type == 'text') as argument}
              <p class="leading-normal"><span class="font-bold">{argument.name}</span> - {argument.description.replaceAll("*", "")}</p>
            {:else}
              <p class="leading-normal italic">No Arguments</p>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      Command not found.
    {/if}
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <a
    class="text-orange-600 leading-7 break-all dark:text-orange-500 hover:underline inline"
    target="{href.startsWith("/") ? "_self" : "_blank"}"
    {href}
    {title}><slot /></a
  >
{/if}