<script lang=ts>
    let active = $state(false);
    let element: HTMLInputElement | undefined = $state(undefined);

    interface Props {
        value: string;
        label: string;
        name: string;
        light?: boolean
        disabled?: boolean;
    }

    let {
        value = $bindable(),
        label,
        name,
        light = false,
        disabled = false
    }: Props = $props();
</script>

<div class="relative mb-6 mt-2 {disabled ? "opacity-50" : ""}">
    <p class="absolute transition-all pointer-events-none { active || (value && value.length > 0) ? "text-base -top-3.5 py-[1px] px-1.5 rounded-sm left-3 font-bold " + (active ? "text-zinc-800 dark:text-zinc-200 " : "text-zinc-400 dark:text-zinc-500")  : "text-zinc-400 dark:text-zinc-500 font-bold text-lg top-1/2 -translate-y-1/2 left-4" } {light ? "dark:bg-zinc-800 bg-white" : "bg-zinc-200 dark:bg-zinc-900"}">{label}</p>
    <input disabled={disabled} type=text name={name} bind:value={value} bind:this={element} onfocusin={() => { active = true; }} onfocusout={() => { active = false; }} class="border-2 border-zinc-400 dark:border-zinc-500 dark:border-zinc rounded-lg px-4 py-2.5 w-full text-lg focus:outline-zinc-800 dark:focus:outline-zinc-200 focus:-outline-offset-0 transition-all focus:outline-[3px]  {light ? "dark:bg-zinc-800 bg-white" : "bg-zinc-200 dark:bg-zinc-900"}">
</div> 