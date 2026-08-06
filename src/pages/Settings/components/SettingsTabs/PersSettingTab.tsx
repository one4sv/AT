import { useRef } from "react";
import { MoonStarsIcon, PlusCircle, RadioButtonIcon, SunIcon } from "@phosphor-icons/react";
import defaultBg from "../../../../assets/pics/defaultBg.png";
import monoBg from "../../../../assets/pics/monoBg.png";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import RadioGroup from "../../../../components/ts/RadioGroup";
import PreviewAccent from "../PreviewAccent.tsx";

export default function PersSettingTab() {
    const { setBlackout } = useBlackout()
    const { isDark, accent, bg, bgUrl, decor, grad } = useSettings();
    const { setNewTheme, setNewAccent, setNewBg, setNewDecor, setNewGrad } = useUpSettings();

    const fileInputRef = useRef<HTMLInputElement>(null)

    const themeArr = [
        { label: "тёмная", value: "dark", icon:MoonStarsIcon },
        { label: "светлая", value: "light", icon:SunIcon },
    ];

    const decorArr = [
        { label: "по умолчанию", value: "default" },
        { label: "стекло", value: "glass" },
    ];

    const accentArr = [
        { value: "poison", dark:"#14b314", light:"#00ad09" },
        { value: "space", dark:"#8b12ee" , light:"#a066ff" },
        { value: "apple", dark:"#ff3b3b" , light:"#ff3333" },
        { value: "sky", dark:"#007bff" , light:"#3399ff" },
        { value: "orange", dark:"#FF6B00" , light:"#FF6B00" },
        { value: "inversion", dark:"#fff" , light:"#fff" },
        { value: "abyss", dark:"#000" , light:"#000" },
    ]    
    const gradArr = [
        { value: "meadow", dark:"#14b314", light:"#00ad09" },
        { value: "violet", dark:"#8b12ee" , light:"#a066ff" },
        { value: "rubin", dark:"#ff3b3b" , light:"#ff3333" },
        { value: "ocean", dark:"#007bff" , light:"#3399ff" },
        { value: "ginger", dark:"#FF6B00" , light:"#FF6B00" },
        { value: "mono", dark:"#fff" , light:"#fff" },
        { value: "void", dark:"#000" , light:"#000" },
    ]

    const bgArr = [
        {label:"Контурные фигуры", value:"default", pick:defaultBg},
        {label:"Сплошной цвет", value:"color", pick:monoBg},
    ]

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Внешний вид
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Тема</div>
                    <RadioGroup list={themeArr} val={isDark ? "dark" : "light"} newVal={setNewTheme}/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Акцентные цвета</div>
                    <PreviewAccent/>
                    <div className="accentSelector">
                        <span className="colorTitle">Основной цвет</span>
                        <div className="accentSelectorWrapper">
                        {accentArr.map((a) => (
                            <div className="accentPicker" key={a.value} onClick={() => setNewAccent(a.value)}>
                                <RadioButtonIcon color={isDark ? a.dark : a.light} weight={accent === a.value ? "fill" : "regular"} />
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="accentSelector">
                        <span className="colorTitle">Градиент</span>
                        <div className="accentSelectorWrapper">
                        {gradArr.map((a) => (
                            <div className="accentPicker" key={a.value} onClick={() => setNewGrad(a.value)}>
                                <RadioButtonIcon color={isDark ? a.dark : a.light} weight={grad === a.value ? "fill" : "regular"}/>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Оформление</div>
                    <RadioGroup list={decorArr} val={decor} newVal={setNewDecor}/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Задний фон</div>
                    <div className="bgPicker">
                        <div className="bgPick">
                            <div className="bgCustom bgMini" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" className="accPicksfileInput" accept="image/*" ref={fileInputRef} onChange={(e) => {
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
