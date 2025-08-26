import { useState, type Key, type RefObject } from "react";
import SelectList from "../SelectList";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import { ChevronRight } from "lucide-react";

interface TabProps {
    tabRef: RefObject<HTMLDivElement>;
    isUpdating: string[];
    fadingOutSections: string[];
    handleAnimationEnd: (section: string) => void;
}
export default function PersTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { persFeedHabits } = useSettings()
    const { setNewPersFeedHabits } = useUpSettings()
    const [ activePicker, setActivePicker ] = useState<string | null>()

    const themeArr=[
        { label: "по умолчанию", value: "default" },
        { label: "ядовитый", value: "poison" },
        { label: "карамельное яблоко", value: "apple" },
        { label: "небесный глубокий", value: "sky" },
        { label: "космическая даль", value: "space" },
        { label: "мягкая трава", value: "grass" },
        { label: "пустынный мираж", value: "desert" },
        { label: "морская синева", value: "sea" },
        { label: "ароматная сирень", value: "violet" },
        { label: "в негативе", value: "negative" },
        { label: "своя", value: "custom" },
    ]
    const pickNewTheme = (type:string) => {
        const pickedActive = persFeedHabits?.find(t => t.type === type)
        if (!pickedActive) return 0;
        return pickedActive.theme
    }

    const getNameType = (type:string) => {
        if (type === "everyday") return "Ежедневные"
        else if (type === "today") return "Сегодня"
        else if (type === "tomorrow") return "Завтра"
        else if (type === "sometimes") return "Иногда"
        else if (type === "pinned") return "Закреплённые"
        else return "Датированные"
    }

    const applyNewTheme = (theme:string) => {
        if (!activePicker) return;

        const updated = persFeedHabits?.map(p =>
            p.type === activePicker ? { ...p, theme } : p
        );

        if (updated) setNewPersFeedHabits(updated);
        console.log(`Изменяем ${activePicker} на тему ${theme}`);
    };

    const getNameTheme = (theme: string) => {
        const themeName = themeArr.find(t => t.value === theme) 
        return themeName?.label
    }

    const getThemeValue = (type:string) => {
        const selectedTheme = persFeedHabits?.find(t => t.type === type)
        return selectedTheme?.theme || "default"
    }

    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Персонализация</span>
            {fadingOutSections.includes("habits") && (
                <span
                    className={`spanSave ${!isUpdating.includes("pers") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("pers")}
                >
                    Сохранение...
                </span>
            )}
            <div className="settingsTab">
                <div className="settingSpan">
                    Привычки на главной странице:
                </div>
                <div className="persFeedHabitsDiv">
                    <div className="persFeedHabits">
                        {persFeedHabits?.map((item: { type: string; theme: string; }, idx: Key | null | undefined) => {
                            return(
                                <div className={`persHabitOrder ${activePicker === item.type ? "active" : ""}`} onClick={() =>setActivePicker(item.type)} key={idx}>
                                    <span>{getNameType(item.type)}</span>
                                    <span className="persSpan">тема: {getNameTheme(item.theme)}</span>
                                </div>
                            )
                        })}
                    </div>
                    {activePicker && (
                        <div className="persHabit">
                            <SelectList placeholder="Тема:" className="persSL" chevron={true} arr={themeArr} hide={true} readOnly={true} extraFunction={applyNewTheme} selected={pickNewTheme(activePicker)}/>
                            <div className={`habit themeHabit-${getThemeValue(activePicker)}`}>
                                <div className="habitInfo">
                                    <div className="habitName">Пример</div>
                                    <div className="habitPer">{getNameType(activePicker)}</div>
                                </div>
                                <ChevronRight />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}