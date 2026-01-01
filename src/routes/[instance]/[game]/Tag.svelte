<script lang=ts>
    interface Tag {
        color: string,
        id: string,
        nickname: string,
        pfp: string,
        pronouns?: string | null,
    }

    interface Props {
        tag: Tag;
        pronouns?: boolean,
    }

    let { tag, pronouns = false }: Props = $props();
</script>

<div style="color: {tag.color};" class="flex items-center gap-1.5">
    <img src="{tag.pfp}" alt="{tag.nickname}'s profile" class="w-5 h-5 rounded-full">

    <p class="text-black dark:text-inherit">{tag.nickname}{pronouns && tag.pronouns ? " (" + tag.pronouns + ")" : ""}</p>
</div>