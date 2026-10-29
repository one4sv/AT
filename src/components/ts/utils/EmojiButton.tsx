import type { Dispatch, RefObject, SetStateAction } from "react";
import { KeyboardIcon, SmileySticker } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";

export default function EmojiButton({ taRef, open, setOpen, disabled }: {
    taRef: RefObject<HTMLTextAreaElement | null>;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    disabled?: boolean;
}) {
    const { t } = useTranslation("acc");
    return <button
        type="button"
        className="inputEmojiButton"
        disabled={disabled}
        aria-label={t(open && isMobile ? "post.keyboard" : "post.emoji")}
        aria-expanded={open}
        onPointerDown={event => event.preventDefault()}
        onClick={() => {
            if (open) {
                setOpen(false);
                taRef.current?.focus({ preventScroll: true });
            } else {
                if (isMobile) taRef.current?.blur();
                setOpen(true);
            }
        }}
    >
        {open && isMobile ? <KeyboardIcon /> : <SmileySticker />}
    </button>;
}
