<script lang="ts">
  export let raw: string;
</script>

<div
  class="bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 p-4 rounded-lg my-4 whitespace-pre break-all"
>
  <code>{raw.replace(/`/g, "").replace(/   /g, "\t").trim()}</code>
</div>
