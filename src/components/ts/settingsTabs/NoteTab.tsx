import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import type { TabProps } from "../../modules/Settings";
import Toggler from "../toggler";

export default function NoteTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { note, messNote } = useSettings()
    const { setNewNote, setNewMessNote } = useUpSettings()
    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Чаты</span>
            {fadingOutSections.includes("note") && (
                <span
                    className={`spanSave ${!isUpdating.includes("note") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("note")}
                >
                    Сохранение...
                </span>
            )}
            <div className="noteTabDiv">
                <span className="tabDivSpan" title="Не кликабельно">Общие уведомления</span>
                <Toggler state={note} setState={setNewNote}/>
            </div>            
            <div className="noteTabDiv">
                <span className="tabDivSpan" title="Не кликабельно">Новые сообщения</span>
                <Toggler state={messNote} setState={setNewMessNote}/>
            </div>
        </div>
    )
}