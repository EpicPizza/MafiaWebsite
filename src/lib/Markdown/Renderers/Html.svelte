<script lang="ts">
  import Code from "./Code.svelte";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
</script>

<Code raw={text} />
