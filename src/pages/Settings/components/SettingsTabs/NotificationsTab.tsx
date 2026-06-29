import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";

export default function NotificationsTab() {
    const { note, messNote } = useSettings()
    const { setNewNote, setNewMessNote } = useUpSettings()
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
                    <div className="settingTogglerDiv" onClick={() => setNewMessNote(!messNote)}>
                        <span title="Не кликабельно">Новые сообщения</span>
                        <Toggler state={messNote} setState={setNewMessNote}/>
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Напомниания
                </div>
            </div>
        </div>
    )
}