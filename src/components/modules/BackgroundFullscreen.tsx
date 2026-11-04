import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowsInIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { Background } from "../ts/utils/background";
import PageBottom from "../ts/PageBottom";
import "./BackgroundFullscreen.scss";

export default function BackgroundFullscreen() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const [ closing, setClosing ] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const close = useCallback(() => {
        if (timer.current) return;
        setClosing(true);
        timer.current = setTimeout(() => setBlackout({ seted: false }), 280);
    }, [setBlackout]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                close();
            }
        };
        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [close]);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    return <div className={`backgroundFullscreenView ${closing ? "closing" : ""}`}
        role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.preview")}>
        <Background previewBg={blackout.options?.id} previewUrl={blackout.options?.url}/>
        <PageBottom className="backgroundFullscreenBottom">
            <button type="button" className="pageBottomBack backgroundFullscreenExit"
                aria-label={t("backgroundLibrary.exitPreview")}
                title={t("backgroundLibrary.exitPreview")}
                onClick={close}>
                <ArrowsInIcon/>
            </button>
        </PageBottom>
    </div>;
}
