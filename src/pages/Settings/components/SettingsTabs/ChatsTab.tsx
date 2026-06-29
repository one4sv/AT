import RadioGroup from "../../../../components/ts/RadioGroup"

export default function ChatsTab() {
    const reactionsArr = [
        {label:"❤️", value:"Heart"}
    ]
    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Лабубу
                </div>
                <div className="settingInnerWrapper" title="Не кликабельно">
                    <div className="settingSpan">Реакция по умолчанию</div>
                    <div className="chatTabSLDiv"><RadioGroup list={reactionsArr} val={"Heart"} newVal={()=>console.log()}/></div>
                </div>
            </div>
        </div>
    )
}