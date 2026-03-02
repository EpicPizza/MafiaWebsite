<script lang="ts">
    import { firebaseClient } from "$lib/Firebase/firebase.svelte";
    import { setContext } from "svelte";

    const client = firebaseClient();

    setContext("client", client);
</script>

<slot />
