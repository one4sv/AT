import { useState, type RefObject } from "react";
import SelectList from "../SelectList";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";

interface TabProps {
    tabRef: RefObject<HTMLDivElement>;
    isUpdating: string[];
    fadingOutSections: string[];
    handleAnimationEnd: (section: string) => void;
}

export default function PersTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { theme, acsent } = useSettings();
    const { setNewTheme, setNewAcsent } = useUpSettings();

    const themeArr = [
        { label: "Системная", value: "system" },
        { label: "Светлая", value: "light" },
        { label: "Тёмная", value: "dark" },
    ];

    const decorArr = [
        { label: "по умолчанию", value: "default" },
        { label: "стекло", value: "glass" },
    ];

    const acsentArr = [
        { label: "ядовитый", value: "poison" },
        { label: "кармаельное яблоко", value: "apple" },
        { label: "небесный глубокий", value: "sky" },
        { label: "космическая даль", value: "space" },
        { label: "своя", value: "custom" },
    ]

    const [ localAcsent, setLocalAcsent ] = useState<string | number | undefined>(acsent)
    const [localTheme, setLocalTheme] = useState<string>(theme);

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
                <div className="persTabDivDouble">
                    <div className="persDiv">
                        <div className="settingSpan">Тема</div>
                        <div className="themeChanger">
                            {themeArr.map((t, idx) => (
                                <button
                                    key={idx}
                                    className={`themeSelector ${localTheme === t.value ? "active" : ""}`}
                                    onClick={() => {
                                        if (t.value !== localTheme) {
                                            setNewTheme(t.value)
                                            setLocalTheme(t.value)
                                        }
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="persDiv">
                        <div className="settingSpan">Оформление</div>
                        <SelectList className="persSL" arr={decorArr} selected={"default"} />
                    </div>
                </div>
                <div className="persTabDivDouble">
                    <div className="persDiv">
                        <div className="settingSpan">Акцентный цвет</div>
                        <SelectList className="persSL" arr={acsentArr} selected={localAcsent} prop={setLocalAcsent} extraFunction={setNewAcsent}/>
                    </div>
                    <div className="persDiv">
                        <div className="settingSpan">Задний фон</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
