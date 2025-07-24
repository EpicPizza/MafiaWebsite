<script lang="ts">
  import { page } from "$app/stores";
    import Icon from "@iconify/svelte";
    import Page from "../../../routes/+page.svelte";

  export let href: string = "";
  export let title: string | undefined = undefined;

  $: pages = $page.data.pages as Page[];
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
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <a
    class="text-teal-600 leading-7 break-all dark:text-teal-500 hover:underline inline"
    target="{href.startsWith("/") ? "_self" : "_blank"}"
    {href}
    {title}><slot /></a
  >
{/if}