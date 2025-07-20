<script lang=ts>
    interface Tag {
        color: string,
        id: string,
        nickname: string,
        pfp: string,
    }

    export let tag: Tag;
</script>

<div class="flex items-center gap-1.5">
    <img src="{tag.pfp}" alt="{tag.nickname}'s profile" class="w-5 h-5 rounded-full">

    <p style="color: {tag.color};">{tag.nickname}</p>
</div>