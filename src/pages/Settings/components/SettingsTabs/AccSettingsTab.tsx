import { useUser } from "../../../../components/hooks/UserHook"
import AccInfo from "../../../Acc/components/AccInfo"

export default function AccSettingsTab () {
    const { user } = useUser()
    return (
        <div className="settingTab">
            {/* <div className="settingInnerDiv"> */}
                <AccInfo acc={user} canView={()=>true} collapsed={0}/>
            {/* </div> */}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Удалить аккаунт
                </div>
            </div>
        </div>
    )
}