<script lang="ts">
  import Code from "./Code.svelte";

  export let text: string;
</script>

<Code raw={text} />
