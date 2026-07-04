import { FloppyDiskBackIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";

export default function AccSettingsTab() {
    const { user } = useUser();
    const { setRed, red } = useSideMenu()
    
    return (
        <div className="settingTab">
            <AccInfo acc={user} canView={() => true} collapsed={0} />
            <div className="settingInnerDiv settingInnerAccDiv">
                <div className="settingHeader">
                    Аккаунт
                </div>
                <div className="settingInnerList">
                    <div className="settingInnerButt" onClick={() => {
                        if (red === true) setRed(false)
                        else setRed(true)
                    }}>
                        {red
                            ? (
                                <>
                                    <FloppyDiskBackIcon size={20}/>Сохранить

                                </>
                            )
                            : (
                                <>
                                    <PencilSimpleIcon size={20}/>Редактировать
                                </>
                            )
                        }
                        
                    </div>
                    <div className="settingInnerButt delete">
                        <TrashIcon size={20}/> Удалить аккаунт
                    </div>
                </div>
            </div>
        </div>
    );
}
