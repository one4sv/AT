import { ArrowLeftIcon, XIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export default function HabitSave ({readOnly, setMenuTranslate}:{readOnly:boolean, setMenuTranslate:Dispatch<SetStateAction<number>>}) {
    const { t } = useTranslation("common")
    const { habit } = useTheHabit()
    const { saveHabit, localChanges, isUpdating } = useUpHabit()
    const { setShowSlide, showSlide, setShowHabitMenu } = useSideMenu()
    const hasUnsavedChanges = !!localChanges[habit!.id];
    const isThisUpdating = isUpdating.includes(`habit_${habit!.id}`);
    const [ chatDirty, setChatDirty ] = useState(false);
    useEffect(() => {
        const onDirty = (event: Event) => {
            const detail = (event as CustomEvent<{ habitId: number; dirty: boolean }>).detail;
            if (detail?.habitId === habit?.id) setChatDirty(detail.dirty);
        };
        window.addEventListener("habit-chat-dirty", onDirty);
        return () => window.removeEventListener("habit-chat-dirty", onDirty);
    }, [habit?.id]);
    const shouldShowSaveHint = hasUnsavedChanges || (showSlide === "chat" && chatDirty);

    const menuBack = () => {
        if (showSlide) setShowSlide(null)
        else {
            setShowHabitMenu(false)
            setMenuTranslate(100)
        }
    }
    return (
        <div className="habitSaveDiv">
            {shouldShowSaveHint && (
                <div className="habitSaveHint">
                    {t("habitPageUi.save.reminder")}
                </div>
            )}
            <button type="button" className="habitSlideBack" onClick={menuBack} aria-label={showSlide ? t("habitPageUi.save.back") : t("habitDialog.close")}>
                {showSlide ? <ArrowLeftIcon size={24}/> : <XIcon size={24}/>}
            </button>
            {!readOnly && habit?.ongoing && (
                <div
                    className={`habitSave ${isThisUpdating ? "saving" : ""}`}
                    onClick={async () => {
                        if (readOnly || !habit?.ongoing || isThisUpdating) return;
                        if (hasUnsavedChanges) await saveHabit(habit.id);
                        if (showSlide === "chat") window.dispatchEvent(new CustomEvent("habit-chat-save", { detail: { habitId: habit.id } }));
                    }}
                >
                    {isThisUpdating ? t("habitDialog.saving") : t("habitUi.save")}
                </div>
            )}
        </div>
    )
}