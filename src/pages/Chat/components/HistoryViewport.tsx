import { Component, type ReactNode, type RefObject } from "react";

export type HistoryAnchor = { id: string; offset: number; scrollTop: number };

export function captureHistoryAnchor(el: HTMLDivElement): HistoryAnchor | null {
    const top = el.getBoundingClientRect().top;
    const visibleTop = top + (parseFloat(getComputedStyle(el).scrollPaddingTop) || 0);
    const nodes = el.querySelectorAll<HTMLElement>("[data-history-message-id]");
    let low = 0, high = nodes.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (nodes[middle].getBoundingClientRect().bottom <= visibleTop) low = middle + 1;
        else high = middle;
    }
    const node = nodes[low];
    if (!node?.dataset.historyMessageId) return null;
    return { id: node.dataset.historyMessageId, offset: node.getBoundingClientRect().top - top, scrollTop: el.scrollTop };
}

export function historyAnchorDelta(el: HTMLDivElement, anchor: HistoryAnchor | null, accountForScroll = false): number {
    if (!anchor) return 0;
    const node = el.querySelector<HTMLElement>(`[data-history-message-id="${anchor.id}"]`);
    if (!node) return 0;
    const offset = anchor.offset - (accountForScroll ? el.scrollTop - anchor.scrollTop : 0);
    return node.getBoundingClientRect().top - el.getBoundingClientRect().top - offset;
}

export function restoreHistoryAnchor(el: HTMLDivElement, anchor: HistoryAnchor | null, accountForScroll = false) {
    const delta = historyAnchorDelta(el, anchor, accountForScroll);
    if (Math.abs(delta) > 1) el.scrollTop += delta;
}

type Props = {
    className: string;
    viewportRef: RefObject<HTMLDivElement | null>;
    firstId?: number;
    loadingMore: boolean;
    chatKey?: string;
    messageIds: number[];
    preserve: boolean;
    onRestored: (el: HTMLDivElement) => void;
    children: ReactNode;
};

// Capture after the last user scroll, immediately before the DOM mutation.
export default class HistoryViewport extends Component<Props, Record<string, never>, HistoryAnchor | null> {
    getSnapshotBeforeUpdate(previous: Props): HistoryAnchor | null {
        const el = this.props.viewportRef.current;
        if (!el || !this.props.preserve || previous.chatKey !== this.props.chatKey ||
            previous.firstId === undefined || !this.props.messageIds.includes(previous.firstId)) return null;
        if (previous.firstId === this.props.firstId) return null;
        return captureHistoryAnchor(el);
    }

    componentDidUpdate(_previous: Props, _state: Record<string, never>, snapshot: HistoryAnchor | null) {
        const el = this.props.viewportRef.current;
        if (!el || !snapshot) return;
        restoreHistoryAnchor(el, snapshot);
        this.props.onRestored(el);
    }

    render() {
        return <div className={this.props.className} ref={this.props.viewportRef}>{this.props.children}</div>;
    }
}
