import { useUser } from "../../hooks/UserHook";
import type { TabProps } from "../../modules/Settings";
import { useSettings } from "../../hooks/SettingsHook";
import { api } from "../api";
import { useEffect, useState } from "react";

export default function SafetyTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { user } = useUser()
    const { twoAuth } = useSettings()
    const [ pending, setPending ] = useState<boolean>(false)
    const askAuth = async() => {
        if (twoAuth === null) return
        const res = await api.post("/askauth")
        if (res.data.success) setPending(true)
    }
    const isAsked = async() => {
        const res = await api.get(`/askauth`)
        if (res.data.isAsked) setPending(true)
    }
    useEffect(() => {
        isAsked()
    }, [])
    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Безопасность</span>
            {fadingOutSections.includes("safety") && (
                <span
                    className={`spanSave ${!isUpdating.includes("safety") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("safety")}
                >
                    Сохранение...
                </span>
            )}
            <div className="settingsTabDiv">
                <div className="tabDivStr">
                    <span className="tabDivSpan" title="Не кликабельно">Двухфакторная аунтифекация</span>
                    <div className="noteTabStr">
                        <span className="noticeTabStr">{pending ? `Письмо отправленно на email: ${user.mail}. Ссылка действительна в течении 10 минут.`: `На закреплённый email: ${user.mail} будет выслано письмо подтверждение`}</span>
                    </div>
                </div>
                <div className="safetyTogglerDiv">
                    <button 
                        className="safetyButt"
                        disabled={pending} 
                        onClick={() => askAuth()}
                    >
                        {pending ? "Отправленно" : twoAuth ? "Отключить" : "Включить" }
                    </button>
                </div>
            </div>
        </div>
    )
}