import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { Emojies, EmojiesGroups } from "./emojies";
import { isMobile } from "react-device-detect";
interface emojiBarProps {
    taRef:RefObject<HTMLTextAreaElement | null>
    setText: Dispatch<SetStateAction<string>>;
    setShowEmojiBar: Dispatch<SetStateAction<boolean>>;
    showEmojiBar: boolean,
    cn?:string,
    emojiPos?:{top: number, left: number}
}
export default function EmojiBar({taRef, setText, showEmojiBar, setShowEmojiBar, cn, emojiPos} : emojiBarProps) {
    const emojiBarRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                emojiBarRef.current &&
                !emojiBarRef.current.contains(e.target as Node) &&
                showEmojiBar
            ) {
                setShowEmojiBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiBar]);

    const handleAddEmoji = (emoji:string) => {
        const ta = taRef?.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        setText(prev => {
            const newValue = prev.slice(0, start) + emoji + prev.slice(end);
            requestAnimationFrame(() => {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
            return newValue;
        });
    }
    
    if (!showEmojiBar) return null

    return (
        <div className={`emojiBar ${cn} ${isMobile ? "mobile" : ""}`} ref={emojiBarRef} style={{ top: emojiPos?.top, left: emojiPos?.left }}>
            {EmojiesGroups.map((g, i) => (
                <div className="emojiGroup" key={i}>
                    <div className="emojiGroupName">{g.value}</div>
                    <div className="emojiList">
                        {Emojies.filter(e => e.group === g.group).map((e, j) => (
                            <div
                                className="emoji"
                                key={j}
                                onClick={() => handleAddEmoji(e.pic)}
                            >
                                {e.pic}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}