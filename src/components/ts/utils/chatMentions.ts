export interface MentionToken {
    start: number;
    end: number;
    query: string;
}

/** Only the token next to the caret is edited; ordinary text is preserved. */
export function findMentionToken(text: string, caret: number): MentionToken | null {
    if (!Number.isInteger(caret) || caret < 0 || caret > text.length) return null;
    const before = text.slice(0, caret);
    const match = /(?:^|[\s([{])@([\p{L}\p{N}_.-]{0,40})$/u.exec(before);
    if (!match || /[\p{L}\p{N}_.-]/u.test(text[caret] || "")) return null;
    return { start: caret - match[1].length - 1, end: caret, query: match[1] };
}
