
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import EmojiNet from "../../../../components/ts/EmojiNet"
import RadioGroup from "../../../../components/ts/RadioGroup"
import { reactionsArr } from "../../../../components/ts/utils/emojies";

export default function ChatsTab() {
    const { setNewEmote, setNewMessdb } = useUpSettings()
    const { emote, messdb } = useSettings()

    const doubleClickArr = [
        {label:"Поставить реакцию по умолчанию", value:"reaction"},
        {label:"Ответить на сообщение", value:"answer"},
        {label:"Выбрать сообщение", value:"select"},
    ]
    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Поведение по умолчанию
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Реакция по умолчанию</div>
                    <div className="chatTabSLDiv">
                        <EmojiNet list={reactionsArr} val={emote} newVal={(val)=>setNewEmote(val)}/>
                    </div>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">Двойное нажатие на сообщене</div>
                    <div className="chatTabSLDiv"><RadioGroup list={doubleClickArr} val={messdb} newVal={(val)=>setNewMessdb(val)}/></div>
                </div>
            </div>
        </div>
    )
}