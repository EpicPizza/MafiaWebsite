import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { env } from "$env/dynamic/private";
import type { Attachment } from "../../routes/[instance]/[game]/types";

export async function getCachedAttachments(channelId: string, messageId: string, attachmentIds: string[]): Promise<Attachment[]> {
    if (attachmentIds.length === 0) return [];

    const db = firebaseAdmin.getFirestore();
    const cacheRef = db.collection('attachment-cache').doc(`${channelId}-${messageId}`);
    
    const cached = (await cacheRef.get()).data();
    const now = Date.now();

    // Cache for 24 hours
    if (cached && (now - cached.timestamp < 1000 * 60 * 60 * 24)) {
        return cached.attachments;
    }

    // Fetch from Discord
    try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
            headers: { Authorization: `Bot ${env.TOKEN}` }
        });

        if (!res.ok) return [];

        const discordMessage = await res.json();
        const refreshedAttachments = attachmentIds.map(id => {
            const a = discordMessage.attachments.find((a: any) => a.id === id);
            if (!a) return undefined;
            return {
                ...a,
                name: a.filename,
                contentType: a.content_type
            };
        }).filter(a => a !== undefined) as Attachment[];

        if (refreshedAttachments.length > 0) {
            await cacheRef.set({
                attachments: refreshedAttachments,
                timestamp: now
            });
        }

        return refreshedAttachments;
    } catch (e) {
        console.error("Error fetching attachments from Discord:", e);
        return [];
    }
}
