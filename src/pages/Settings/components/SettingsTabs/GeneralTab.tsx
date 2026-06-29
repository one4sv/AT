import { useState } from "react"
import RadioGroup from "../../../../components/ts/RadioGroup"
import SeekBar from "../SeekBar"
import SelectList from "../../../../components/ts/SelectList"

export default function GeneralTab () {
    const [ fontSize, setFontSize ] = useState<number>(16)

    const timeChanger = [
        {label:"24 часовой", value:"twentyFour"},
        {label:"12 часовой", value:"twelve"}
    ]
    const dateChanger = [
        {label:"дд.мм.гггг", value:"standart"},
        {label:"мм.дд.гггг", value:"american"},
    ]
    const trafficEconomy = [
        {label:"Включить", value:"on"},
        {label:"Выключить", value:"off"}
    ]
    const langArr = [
        {label:"Русский", value:"rus"},
        {label:"Английский", value:"eng"},
    ]
    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Язык приложения
                </div>
                <SelectList arr={langArr} className="settingSL" selected={"rus"}/>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Экономия трафика
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        Автоматически загружать изображения
                    </div>
                    <RadioGroup list={trafficEconomy} val="on"/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        Автоматически воспроизводить GIF/видео
                    </div>   
                    <RadioGroup list={trafficEconomy} val="on"/>
                </div>   
                <div className="settingInnerWrapper"> 
                    <div className="settingSpan">
                        Использовать кэш изображений
                    </div>
                    <RadioGroup list={trafficEconomy} val="on"/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Текст
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        размер шрифта
                    </div>
                    <SeekBar min={12} max={22} value={fontSize} unit="px" step={1} onChange={setFontSize}/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        формат даты
                    </div>
                    <RadioGroup list={dateChanger} val={"standart"}/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        формат времени
                    </div>
                    <RadioGroup list={timeChanger} val={"twentyFour"}/>
                </div>
            </div>
        </div>
    )
}