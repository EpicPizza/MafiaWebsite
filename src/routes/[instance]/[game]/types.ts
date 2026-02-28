export interface Attachment {
    id: string;
    url: string;
    proxy_url?: string;
    filename?: string;
    size?: number;
    width?: number;
    height?: number;
    content_type?: string;
}

export type MessageType = number;

export interface APIEmbed {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    author?: { name: string; url?: string; icon_url?: string };
    image?: { url: string; proxy_url?: string; width?: number; height?: number };
    thumbnail?: { url: string; proxy_url?: string; width?: number; height?: number };
    footer?: { text: string; icon_url?: string };
}

export interface StatsAction {
    type: 'add',
    id: string,
    day: number,
    instance: string,
    game: string,
    messages: number,
    images: number,
    words: number,
}

export type Log = (StandardLog & Search) | CustomLog | ResetLog;

interface Search {
    search: { //for vote history search, add nicknames
        for?: string,
        replace?: string,
        name: string,
    },
}

interface StandardLog {
    vote: Vote,
    board: string,
    messageId: string | null,
    type: 'standard',
    timestamp: number,
}

interface CustomLog {
    search: { //for vote history search, add nicknames
        for?: string,
        replace?: string,
        name: string,
    },
    message: string,
    prefix: boolean, //prefix nickname to the beginning of the name
    board: string,
    messageId: string | null,
    type: 'custom'
    timestamp: number,
}

interface ResetLog {
    message: string,
    board: string,
    messageId: string | null,
    type: 'reset',
    timestamp: number,
}

export interface Vote {
    id: string,
    for: string | 'unvote',
    replace?: string,
    timestamp: number,
}

export interface TrackedMessage {
    channelId: string,
    guildId: string,
    id: string,
    createdTimestamp: number,
    editedTimestamp: number | null,
    type: MessageType,
    content: string,
    cleanContent: string,
    authorId: string,
    pinned: boolean,
    pinning: string | null,
    embeds: APIEmbed[],
    attachments: Attachment[],
    mentions: string[],
    reference: string | null,
    poll: boolean,
    reactions: Reaction[],
    deleted?: boolean,
    logs?: Log[],
    sniped?: string,
    stars?: number,
}

export interface Reaction {
    id: string[];
    emoji: string | null;
}