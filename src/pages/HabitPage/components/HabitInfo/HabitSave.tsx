import { CaretLeftIcon, XIcon } from "@phosphor-icons/react";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";

export default function HabitSave ({readOnly}:{readOnly:boolean}) {
    const { habit } = useTheHabit()
    const { saveHabit, localChanges, isUpdating } = useUpHabit()
    const { setShowSlide, showSlide } = useSideMenu()
    const hasUnsavedChanges = !!localChanges[habit!.id];
    const isThisUpdating = isUpdating.includes(`habit_${habit!.id}`);

    const renderBackText = () => {
        switch (showSlide) {
            case "settings":
                return "Настройки"     
            case "chat":
                return "Чат"            
            case "journal":
                return "Журнал"
        }
    }
    return (
        <div className="habitSaveDiv">
            {hasUnsavedChanges && (
                <div className="habitSaveHint">
                    Не забудьте сохранить!
                </div>
            )}
            <div className="habitSlideBack" onClick={() => setShowSlide(null)}>
                {showSlide ? <CaretLeftIcon size={24}/> : <XIcon size={24}/>} {showSlide ? renderBackText() : 'Закрыть'}
            </div>
            {!readOnly && habit?.ongoing && (
                <div
                    className={`habitSave ${isThisUpdating ? "saving" : ""}`}
                    onClick={async () => {
                        if (readOnly || habit?.ongoing || !hasUnsavedChanges || isThisUpdating) return;
                        await saveHabit(habit!.id);
                    }}
                >
                    {isThisUpdating ? "Сохраняется..." : "Сохранить"}
                </div>
            )}
        </div>
    )
}