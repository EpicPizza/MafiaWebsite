<script lang="ts">
  interface Props {
    icon: string;
    scale?: string | 0;
    color?: string;
    style?: string;
    rounded?: boolean;
    filled?: boolean;
    class?: string;
  }

  let {
    icon,
    scale = "1.5rem",
    color = "inherit",
    style = "",
    rounded = false,
    filled = false,
    class: classStyle = ""
  }: Props = $props();
  
    
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
  