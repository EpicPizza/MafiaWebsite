export interface Party {
    players: {
        message: string | null,
        role: boolean,
        id: string,
        displayName?: string,
    }[],
    encrypted: Encrypted | string,
    iv: string,
    mod: string[],
    state: number,
}

export interface Encrypted {
    roles: {
        name: string,
        description: string,
        type: string,
        message: string,
        id: string,
        displayName?: string,
    }[],
    messages: {
        id: string,
        for: string,
        message: string,
    }[],
}
