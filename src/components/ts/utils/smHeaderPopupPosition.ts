export function smHeaderPopupPosition(
    panelWidth: number,
    triggerLeft: number,
    triggerWidth: number,
    contentWidth: number,
    edge = 8
): { left: number; width: number } {
    const available = Math.max(0, panelWidth - edge * 2);
    const width = Math.min(available, Math.max(triggerWidth, contentWidth));
    const centered = triggerLeft + triggerWidth / 2 - width / 2;
    const left = Math.max(edge, Math.min(panelWidth - edge - width, centered));
    return { left: Math.round(left), width: Math.ceil(width) };
}
