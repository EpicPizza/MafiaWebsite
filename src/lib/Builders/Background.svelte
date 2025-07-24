<script lang="ts">
    import { page } from "$app/stores";
    import { getContext, onMount } from "svelte";
    import Icon from "./Icon.svelte";
    import ImageScatter from "./ImageScatter.svelte";

    // Props for customizing the background
    export let enableScatter: boolean = false;
    export let scatterImages: string[] = [];
    export let scatterMinImageSize: number = 60;
    export let scatterMaxImageSize: number = 120;
    export let scatterPadding: number = 30;

    let bottom = "1rem";
    let offset = 0;

    let dark = false;
    let windowWidth = -1;
    let windowHeight = -1;

    // Default background images (used if scatterImages is empty)
    const defaultBackgroundImages = [
        'https://picsum.photos/80/80?random=1',
        'https://picsum.photos/80/80?random=2',
        'https://picsum.photos/80/80?random=3',
        'https://picsum.photos/80/80?random=4',
        'https://picsum.photos/80/80?random=5',
        'https://picsum.photos/80/80?random=6',
        'https://picsum.photos/80/80?random=7',
        'https://picsum.photos/80/80?random=8',
        'https://picsum.photos/80/80?random=9',
        'https://picsum.photos/80/80?random=10'
    ];

    // Use provided images or fall back to defaults
    $: backgroundImages = scatterImages.length > 0 ? scatterImages : defaultBackgroundImages;

    onMount(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
           dark = true;
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            dark = event.matches;
        });
    });
  </script>
  
  <svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight}></svelte:window>
  
  <div
    style="padding-bottom: {bottom}; padding-top: {bottom};"
    class="px-4 h-[calc(100dvh)] border-border-light dark:border-border-dark w-full bg-white dark:bg-zinc-800 bg-opacity-70 {dark ? "dark-pattern" : "light-pattern"} relative"
  >
    <!-- Background scatter effect (optional) -->
    {#if enableScatter}
      <div class="absolute inset-0 pointer-events-none opacity-70">
        <ImageScatter 
          images={backgroundImages}
          width={windowWidth}
          height={windowHeight}
          minImageSize={scatterMinImageSize}
          maxImageSize={scatterMaxImageSize}
          padding={scatterPadding}
          cacheKey="background"
        />
      </div>
    {/if}
    
    <div
      style="min-height: calc(100svh - 2rem);"
      class="flex flex-col items-center w-full relative z-10"
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
  