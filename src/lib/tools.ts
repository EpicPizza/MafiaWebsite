export function safeParse(input: string) {
    try {
        const output = JSON.parse(input);

        return output;
    } catch(e) {
        return undefined;
    }
}