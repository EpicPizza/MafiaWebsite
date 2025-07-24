import { firebaseAdmin } from "$lib/Firebase/firebase.server";

export interface Page {
    content: string;
    description: string;
    icon: string;
    title: string;
    route: string;
    subpages: string[];
    id: string;
    hide: boolean;
    integration?: string;
    order: number;
}

export async function getOrder() {
    const db = firebaseAdmin.getFirestore();

    const pages = (await db.collection('documents').get()).docs.map(doc => doc.data() as Page);

    const subRanges = [] as { id: string, top: number, bottom: number}[];

    let bottom = 0;

    pages.forEach(page => {
        if(page.order > bottom) {
            bottom = page.order;
        }

        if(page.subpages.length > 0) {
            subRanges.push({
                id: page.id,
                top: page.subpages.length - 1,
                bottom: 0,
            });
        }
    });

    return {
        top: 0,
        bottom: bottom,
        subRanges,
    }
}