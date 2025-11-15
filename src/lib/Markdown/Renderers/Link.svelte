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
      {@const shorthand = $mode ? ('slash' in command ? command.slash : "No slash command version.") : ('text' in command ? command.text : "No text command version.")}

      <p class="leading-6"><span class="text-orange-800 inline-block dark:text-orange-300 font-bold ">{shorthand}</span> - {command.description}</p>

      <div class="pl-4 mt-2 dark:opacity-50 opacity-45 -mb-2 italic">
        {#each command.arguments.filter(p => $mode ? p.type == 'slash' : p.type == 'text') as argument}
          <p class="leading-normal"><span class="font-bold">{argument.name}</span> - {argument.description.replaceAll("*", "")}</p>
        {:else}
          <div class="h-0 w-full -mb-4"></div>
        {/each}
      </div>
    {:else}
      Command not found.
    {/if}
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <a
    class="text-teal-600 leading-7 break-all dark:text-teal-500 hover:underline inline"
    target="{href.startsWith("/") ? "_self" : "_blank"}"
    {href}
    {title}><slot /></a
  >
{/if}