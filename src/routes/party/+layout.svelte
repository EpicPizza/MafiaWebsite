<script lang=ts>
    import { firebaseClient } from "$lib/Firebase/firebase";
    import { setContext } from "svelte";

    const client = firebaseClient();

    setContext('client', client);
</script>

<slot/>

