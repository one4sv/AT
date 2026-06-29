import { useUser } from "../../../../components/hooks/UserHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { api } from "../../../../components/ts/api";
import { useEffect, useState } from "react";

export default function SecurityTab() {
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
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader" title="Не кликабельно">
                        Двухфакторная аутентификация
                    <div className={`safetyButt ${pending && "inactive"}`} onClick={() => askAuth()}>
                        {pending ? "Отправленно" : twoAuth ? "Отключить" : "Включить" }
                    </div>
                </div>
                <span className="settingHint">{pending ? `Письмо отправленно на email: ${user.mail}. Ссылка действительна в течении 10 минут.`: `На закреплённый email: ${user.mail} будет выслано письмо подтверждение`}</span>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Сменить пароля
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Устройства
                </div>
                <div className="settingSpan">Активные сессии</div>
                <div className="settingSpan">Выход со всех устройств кроме этого</div>
            </div>
        </div>
    )
}