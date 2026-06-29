import { useRef } from "react";
import { PlusCircle } from "@phosphor-icons/react";
import defaultBg from "../../../../assets/pics/defaultBg.png";
import monoBg from "../../../../assets/pics/monoBg.png";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import RadioGroup from "../../../../components/ts/RadioGroup";

export default function PersSettingTab() {
    const { setBlackout } = useBlackout()
    const { theme, acsent, bg, bgUrl, decor } = useSettings();
    const { setNewTheme, setNewAcsent, setNewBg, setNewDecor } = useUpSettings();

    const fileInputRef = useRef<HTMLInputElement>(null)

    const themeArr = [
        { label: "системная", value: "system" },
        { label: "светлая", value: "light" },
        { label: "тёмная", value: "dark" },
    ];

    const decorArr = [
        { label: "по умолчанию", value: "default" },
        { label: "стекло", value: "glass" },
    ];

    const acsentArr = [
        { label: "свежевыжитый яд", value: "poison" },
        { label: "карамельное яблоко", value: "apple" },
        { label: "небесный глубокий", value: "sky" },
        { label: "космическая даль", value: "space" },
        { label: "своя", value: "custom" },
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
                    <RadioGroup list={themeArr} val={theme} newVal={setNewTheme}/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Акцентный цвет</div>
                    <RadioGroup list={acsentArr} val={acsent} newVal={setNewAcsent}/>
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
