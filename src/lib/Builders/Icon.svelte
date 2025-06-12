<script lang="ts">
    export let icon: string;
    export let scale: string | 0 = "1.5rem";
    export let color: string = "inherit";
    export let style: string = "";
    export let rounded: boolean = false;
    export let filled: boolean = false;
    export let classStyle: string = "";
  
    export { classStyle as class };
  </script>
  
  <div
    style={scale != 0 ? "width:" + scale + "; height:" + scale + ";" : ""}
    class="flex justify-around items-center {classStyle}"
  >
    <span
      style="{scale != 0
        ? 'font-size: ' + scale + ';'
        : 'font-size: inherit;'} color: {color}; {style} "
      class="material-symbols-{rounded ? 'rounded' : 'outlined'} {filled ? 'filled' : ''}">{icon}</span
    >
  </div>
  