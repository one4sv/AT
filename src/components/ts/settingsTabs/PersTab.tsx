import { useState, type RefObject, useRef } from "react";
import SelectList from "../SelectList";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import { PlusCircle } from "@phosphor-icons/react";
import defaultBg from "../../../assets/pics/defaultBg.png";
import monoBg from "../../../assets/pics/monoBg.png";
import { useBlackout } from "../../hooks/BlackoutHook";

interface TabProps {
    tabRef: RefObject<HTMLDivElement>;
    isUpdating: string[];
    fadingOutSections: string[];
    handleAnimationEnd: (section: string) => void;
}

export default function PersTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { setBlackout } = useBlackout()
    const { theme, acsent, bg, bgUrl, decor } = useSettings();
    const { setNewTheme, setNewAcsent, setNewBg, setNewDecor } = useUpSettings();

    const fileInputRef = useRef<HTMLInputElement>(null)

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
    const bgArr = [
        {label:"Контурные фигуры", value:"default", pick:defaultBg},
        {label:"Сплошной цвет", value:"color", pick:monoBg},
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
                        <div className="settingSpan">Акцентный цвет</div>
                        <SelectList className="persSL" arr={acsentArr} selected={localAcsent} prop={setLocalAcsent} extraFunction={setNewAcsent}/>
                    </div>
                </div>
                <div className="persTabDivDouble">
                    <div className="persDiv">
                        <div className="settingSpan">Оформление</div>
                        <SelectList className="persSL" arr={decorArr} selected={decor} extraFunction={setNewDecor}/>
                    </div>
                </div>
                <div className="persDiv">
                    <div className="settingSpan">Задний фон</div>
                    <div className="bgPicker">
                        <div className="bgPick">
                            <div className="bgCustom bgMini" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" className="accPicksfileInput" accept="image/*" maxLength={1} ref={fileInputRef} onChange={(e) => {
                                    if (!e.target.files) return
                                    setBlackout({seted:true, module:"BgHandler", bg:e.target.files[0]})
                                }}/>
                                <PlusCircle />
                            </div>
                            <span>Добавить свой</span>
                        </div>
                        {bgArr.map((b, i) => (
                            <div className="bgPick" key={i} onClick={() => setNewBg(b.value)}>
                                <img src={b.pick} className={`bgImg bgMini ${b.value === bg ? "choosen" : ""}`}/>
                                <span className={b.value === bg ? "bgSpanChoosen" : ""}>{b.label}</span>
                            </div>
                        ))}
                        {bgUrl ? (
                            <div className="bgPick" onClick={() => setNewBg("custom")}>
                                <img src={bgUrl} className={`bgImg bgMini ${bg === "custom" ? "choosen" : ""}`}/>
                                <span className={bg === "custom" ? "bgSpanChoosen" : ""}>Ваш фон</span>
                            </div>
                        ) : ("")}
                    </div>
                </div>
            </div>
        </div>
    );
}
