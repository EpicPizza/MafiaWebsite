<script lang="ts">
    export let clear = false;
  </script>
  
  <div
    class="border-[3px] {clear
      ? 'border-transparent dark:border-transparent outline-transparent dark:outline-transparent bg-transparent dark:bg-transparent'
      : 'border-border-light dark:border-border-dark'} bg-backgroud-light dark:bg-backgroud-dark outline-8 outline outline-backgroud-light dark:outline-backgroud-dark border-t-black rounded-full relative dark:border-t-white animate-spin w-7 h-7"
  ></div>
  