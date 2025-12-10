<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: style = "" }: Props = $props();
  
    
  </script>
  
  <div
    class="border-border-light dark:border-border-dark border-t-[1px] w-full {style}"
></div>
  