import type { TabProps } from "../../modules/Settings";
import SelectList from "../SelectList";

export default function ChatTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const reactionsArr = [
        {label:"❤️", value:"Heart"}
    ]
    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Чаты</span>
            {fadingOutSections.includes("chat") && (
                <span
                    className={`spanSave ${!isUpdating.includes("chat") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("chat")}
                >
                    Сохранение...
                </span>
            )}
            <div className="chatTabDiv">
                    <span className="tabDivSpan" title="Не кликабельно">Реакция по умолчанию</span>
                <div className="chatTabSLDiv"><SelectList arr={reactionsArr} className={"chatTabSL"} selected={"Heart"}/></div>
            </div>
        </div>
    )
}