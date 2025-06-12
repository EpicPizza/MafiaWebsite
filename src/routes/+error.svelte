<script lang=ts>
    import { page } from "$app/stores";
    import Icon from "$lib/Builders/Icon.svelte";

</script>

<div class="p-8 bg-white text-red-500 flex flex-col items-center font-bold dark:bg-zinc-800 h-full border-border-light dark:border-border-dark overflow-auto border rounded-2xl">
    <Icon class="mb-4" scale=3rem icon=error></Icon>
    <p class="text-2xl">{$page.status}</p>
    <p class="text-lg">{$page.error?.message}</p>
</div>