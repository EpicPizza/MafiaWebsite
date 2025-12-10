<script lang="ts">
  interface Props {
    text: string;
  }

  let { text }: Props = $props();
</script>

<code
  class="bg-black inline dark:bg-white bg-opacity-10 dark:bg-opacity-10 px-2 py-1 text-sm rounded-md items-center"
  >{text.replace(/`/g, "").trim()}</code
>
