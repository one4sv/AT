import { useState } from "react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import "../../../../scss/habitsNoteTable.scss"
import { TagIcon } from "../../../HabitPage/utils/TagIcon";
import { CaretDownIcon } from "@phosphor-icons/react";

export default function NotificationsTab() {
    const { note, messNote, habitsNote } = useSettings()
    const { setNewNote, setNewMessNote, setNewHabitsNote } = useUpSettings()
    const { habits } = useHabits()
    const [ showNoteList, setShowNoteList ] = useState<number>(0)

    const habitNoteArray = [
        {
            title: "До начала",
            options:[
                {label:"К началу", value:"start"},
                {label:"За ... минут", value:"inpstart", input:true},
                {label:"За 10 минут", value:"10start"},
                {label:"За 1 час", value:"60start"},
            ],  
        },
        {
            title: "Ко времени",
            options: [
                {label:"Ко времени", value:"inp", input:true},
            ],
        },
        {
            title: "До конца",
            options: [
                {label:"К концу", value:"end"},
                {label:"За ... минут", value:"inpend", input:true},
                {label:"За 10 минут", value:"10end"},
                {label:"За 1 час", value:"60end"},
            ]
        }
    ]

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Общие
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewNote(!note)}>
                        <span title="Не кликабельно">Общие уведомления</span>
                        <Toggler state={note} setState={setNewNote}/>
                    </div>
                    <div className={`settingTogglerDiv ${!note && "settingInactive"}`} onClick={() => setNewMessNote(!messNote)}>
                        <span title="Не кликабельно">Новые сообщения</span>
                        <Toggler state={messNote} setState={setNewMessNote} disable={!note}/>
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Напомниания
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewHabitsNote(!habitsNote)}>
                        <span>Напоминать об активностях</span>
                        <Toggler state={habitsNote} setState={setNewHabitsNote}/>
                    </div>
                    <div className={`settingTogglerDiv ${!habitsNote && "settingInactive"}`}>
                        <span>Общее время для напоминания</span>
                    </div>
                </div>
                <div className={`settingsInnerDiv ${!habitsNote && "settingInactive"}`}>
                    <div className="settingInnerList">
                        <div className="habitsNoteTable">
                            {habits?.filter(h => h.ongoing).sort((a,b) => a.id - b.id).map((h) => {
                                let timePart = "";
                                if (h.start_time && h.end_time) {
                                    timePart = `с ${h.start_time} до ${h.end_time}`;
                                } else if (h.start_time) {
                                    timePart = `начало в ${h.start_time}`;
                                } else if (h.end_time) {
                                    timePart = `до ${h.end_time}`;
                                }
                                const opened = showNoteList === h.id
                                return (
                                    <div className="habitNoteWrapper">
                                        <div className="habitNoteRow" key={h.id} onClick={() => setShowNoteList(prev => (prev === h.id ? 0 : h.id))}>
                                            <div className="habitNoteMain">
                                                <div className="habitNoteMainIcon">
                                                    {TagIcon(h, h.tag)}
                                                </div>
                                                <div className="habitNoteName">
                                                    {h.name}
                                                </div>
                                                <div className={`habitNoteTime ${!habitsNote && "settingInactive"}`}>
                                                    {timePart}
                                                </div>
                                            </div>
                                            <div className="habitNoteCounter">
                                                0 уведомлений
                                            </div>
                                            <div className="habitNoteIsShown">
                                                <CaretDownIcon style={{transform: opened ? "rotate(180deg)" : ""}}/>
                                            </div>
                                        </div>
                                        <div className={`habitNoteArray ${opened ? "opened" : ""}`}>
                                            {habitNoteArray.map((a) => (
                                                <>
                                                    <div className="habitNoteTitle">{a.title}</div>
                                                    <div className="habitNoteArrayNote">
                                                        {a.options.map((n) => (
                                                                <div className="habitNoteArrayButton">
                                                                    {n.label}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}