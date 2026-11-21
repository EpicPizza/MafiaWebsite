<script lang=ts>
    interface Tag {
        color: string,
        gradient?: string | null,
        id: string,
        nickname: string,
        pfp: string,
        pronouns?: string | null,
    }

    interface Props {
        tag: Tag;
        pronouns?: boolean,
        compact?: boolean
    }

    let { tag, pronouns = false, compact = false }: Props = $props();
</script>

<div style="color: {tag.color};" class="group flex items-center gap-1.5">
    <img src="{tag.pfp}" alt="{tag.nickname}'s profile" class="w-5 h-5 rounded-full { compact ? "hidden sm:block" : ""}">

    <p class="text-black dark:text-inherit" class:role-gradient={tag.gradient} style:--role-gradient={tag.gradient}>{tag.nickname}{pronouns && tag.pronouns ? " (" + tag.pronouns + ")" : ""}</p>
</div>