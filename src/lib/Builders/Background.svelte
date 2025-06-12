<script lang="ts">
    import { page } from "$app/stores";
    import { getContext, onMount } from "svelte";
    import Icon from "./Icon.svelte";

    let bottom = "1rem";
    let offset = 0;

    let dark = false;

    onMount(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
           dark = true;
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            dark = event.matches;
        });
    })
  </script>
  
  <div
    style="padding-bottom: {bottom}; padding-top: {bottom};"
    class="px-4 h-[calc(100dvh)] border-border-light dark:border-border-dark w-full bg-white dark:bg-zinc-800 bg-opacity-70 {dark ? "dark-pattern" : "light-pattern"}"
  >
    <div
      style="min-height: calc(100svh - 2rem);"
      class="flex flex-col items-center w-full"
    >
      <slot />
    </div>
    {#if ( $page.url.pathname.startsWith('/account') && !$page.url.pathname.includes("delete") )}
      <button
        on:click={() => {
          history.back();
        }}
        style="top: {88 + offset}px;"
        class="bg-backgroud-light dark:bg-backgroud-dark border border-border-light dark:border-border-dark px-4 absolute rounded-xl left-4 flex flex-col items-center shadow-sm dark:shadow-lg"
      >
        <p class="text-center my-3 flex items-center gap-1.5 text-lg">
          <Icon scale="1.5rem" icon="arrow_back"></Icon>
          Back
        </p>
      </button>
    {/if}
  </div>
  