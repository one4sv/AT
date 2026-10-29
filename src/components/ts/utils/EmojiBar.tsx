import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { Emojies, EmojiesGroups } from "./emojies";
import { isMobile } from "react-device-detect";
import { createPortal } from "react-dom";
import "../../../scss/emojiBar.scss";

interface emojiBarProps {
    taRef: RefObject<HTMLTextAreaElement | null>;
    setText: Dispatch<SetStateAction<string>>;
    setShowEmojiBar: Dispatch<SetStateAction<boolean>>;
    showEmojiBar: boolean;
    cn?: string;
    emojiPos?: { top: number; left: number };
    emojiRef?: RefObject<HTMLDivElement | null>;
}
export default function EmojiBar({ taRef, setText, showEmojiBar, setShowEmojiBar, cn, emojiPos, emojiRef }: emojiBarProps) {
    const emojiBarRef = useRef<HTMLDivElement>(null);
    const [ position, setPosition ] = useState({ top: 0, left: 0 });
    const [ keyboardHeight, setKeyboardHeight ] = useState(0);

    useEffect(() => {
        if (!isMobile) return;
        const viewport = window.visualViewport;
        const measure = () => {
            if (document.activeElement !== taRef.current) return;
            const height = window.innerHeight - (viewport?.height || window.innerHeight) - (viewport?.offsetTop || 0);
            if (height > 120) setKeyboardHeight(height);
        };
        viewport?.addEventListener("resize", measure);
        return () => viewport?.removeEventListener("resize", measure);
    }, [taRef]);

    useEffect(() => {
        if (!showEmojiBar) return;
        const ta = taRef.current;
        const close = () => setShowEmojiBar(false);
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close();
            }
        };
        const outside = (event: PointerEvent) => {
            const target = event.target as Element;
            if (!emojiBarRef.current?.contains(target) && !emojiRef?.current?.contains(target) && !target.closest(".inputEmojiButton")) close();
        };
        const place = () => {
            if (!ta || isMobile) return;
            const rect = ta.getBoundingClientRect();
            setPosition({ top: Math.max(8, rect.top - window.innerHeight * .3 - 12), left: Math.max(8, Math.min(rect.left, window.innerWidth - 368)) });
        };
        place();
        if (isMobile) {
            ta?.blur();
            ta?.addEventListener("focus", close);
        }
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        document.addEventListener("keydown", escape, true);
        document.addEventListener("pointerdown", outside);

        const host = isMobile ? ta?.closest<HTMLElement>(".postCommentBottom, .chatTAWrapper, .habitMobileDone") : null;
        const originalBottom = host?.style.bottom || "";
        const lift = () => {
            if (!host || !emojiBarRef.current) return;
            const panelTop = emojiBarRef.current.getBoundingClientRect().top;
            const currentBottom = parseFloat(host.style.bottom) || 0;
            const baseBottom = host.getBoundingClientRect().bottom + currentBottom;
            host.style.bottom = `${Math.max(0, baseBottom - panelTop)}px`;
            window.dispatchEvent(new Event("composerresize"));
        };
        const observer = new ResizeObserver(lift);
        if (host && emojiBarRef.current) observer.observe(emojiBarRef.current);
        window.visualViewport?.addEventListener("resize", lift);
        window.visualViewport?.addEventListener("scroll", lift);
        return () => {
            ta?.removeEventListener("focus", close);
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
            document.removeEventListener("keydown", escape, true);
            document.removeEventListener("pointerdown", outside);
            window.visualViewport?.removeEventListener("resize", lift);
            window.visualViewport?.removeEventListener("scroll", lift);
            observer.disconnect();
            if (host) {
                host.style.bottom = originalBottom;
                window.dispatchEvent(new Event("composerresize"));
            }
        };
    }, [showEmojiBar, setShowEmojiBar, taRef, emojiRef]);

    const handleAddEmoji = (emoji: string) => {
        const ta = taRef.current;
        if (!ta || ta.disabled || ta.readOnly) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (ta.maxLength >= 0 && ta.value.length - (end - start) + emoji.length > ta.maxLength) return;
        setText(previous => previous.slice(0, start) + emoji + previous.slice(end));
        requestAnimationFrame(() => {
            if (!ta.isConnected) return;
            if (!isMobile) ta.focus({ preventScroll: true });
            ta.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    if (!showEmojiBar) return null;
    return createPortal(
        <div
            className={`emojiBar ${cn || ""} ${isMobile ? "emojiKeyboard" : ""}`}
            ref={emojiBarRef}
            onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }}
            style={isMobile
                ? { height: keyboardHeight ? `min(${keyboardHeight}px, 50dvh)` : "38dvh" }
                : { position: "fixed", bottom: "auto", width: "min(360px, 90vw)", maxHeight: "30dvh", top: emojiPos?.top ?? position.top, left: emojiPos?.left ?? position.left }}
        >
            {EmojiesGroups.map(group => <div className="emojiGroup" key={group.group}>
                <div className="emojiGroupName">{group.value}</div>
                <div className="emojiList">
                    {Emojies.filter(emoji => emoji.group === group.group).map((emoji, index) => (
                        <button type="button" className="emoji" key={index} onClick={() => handleAddEmoji(emoji.pic)}>
                            {emoji.pic}
                        </button>
                    ))}
                </div>
            </div>)}
        </div>, document.body
    );
}
