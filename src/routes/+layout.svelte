<script>
    import Background from "$lib/Builders/Background.svelte";
  import "../app.css";
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
  />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@40,700,0,0"
  />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link
    href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;0,1000;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
    rel="stylesheet"
  />
  <title>Mafia Bot</title>
  <meta name="description" content="Step by step guide with pictures on how to use the mafia bot.">
</svelte:head>

<style>
  :global(.dark-pattern) {
    background-image: linear-gradient(
        30deg,
        #18181b 12%,
        transparent 12.5%,
        transparent 87%,
        #18181b 87.5%,
        #18181b
      ),
      linear-gradient(
        150deg,
        #18181b 12%,
        transparent 12.5%,
        transparent 87%,
        #18181b 87.5%,
        #18181b
      ),
      linear-gradient(
        30deg,
        #18181b 12%,
        transparent 12.5%,
        transparent 87%,
        #18181b 87.5%,
        #18181b
      ),
      linear-gradient(
        150deg,
        #18181b 12%,
        transparent 12.5%,
        transparent 87%,
        #18181b 87.5%,
        #18181b
      ),
      linear-gradient(
        60deg,
        #18181b77 25%,
        transparent 25.5%,
        transparent 75%,
        #18181b77 75%,
        #18181b77
      ),
      linear-gradient(
        60deg,
        #18181b77 25%,
        transparent 25.5%,
        transparent 75%,
        #18181b77 75%,
        #18181b77
      );
    background-size: 20px 35px;
    background-position:
      0 0,
      0 0,
      10px 18px,
      10px 18px,
      0 0,
      10px 18px;
  }

  :global(.light-pattern) {
    background-image: linear-gradient(
        30deg,
        #f1f5f9 12%,
        transparent 12.5%,
        transparent 87%,
        #f1f5f9 87.5%,
        #f1f5f9
      ),
      linear-gradient(
        150deg,
        #f1f5f9 12%,
        transparent 12.5%,
        transparent 87%,
        #f1f5f9 87.5%,
        #f1f5f9
      ),
      linear-gradient(
        30deg,
        #f1f5f9 12%,
        transparent 12.5%,
        transparent 87%,
        #f1f5f9 87.5%,
        #f1f5f9
      ),
      linear-gradient(
        150deg,
        #f1f5f9 12%,
        transparent 12.5%,
        transparent 87%,
        #f1f5f9 87.5%,
        #f1f5f9
      ),
      linear-gradient(
        60deg,
        #f1f5f977 25%,
        transparent 25.5%,
        transparent 75%,
        #f1f5f977 75%,
        #f1f5f977
      ),
      linear-gradient(
        60deg,
        #f1f5f977 25%,
        transparent 25.5%,
        transparent 75%,
        #f1f5f977 75%,
        #f1f5f977
      );
    background-size: 20px 35px;
    background-position:
      0 0,
      0 0,
      10px 18px,
      10px 18px,
      0 0,
      10px 18px;
  }
</style>

<slot></slot>