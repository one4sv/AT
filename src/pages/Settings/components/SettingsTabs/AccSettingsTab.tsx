import { FloppyDiskBackIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import { useTranslation } from "react-i18next";

export default function AccSettingsTab() {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const { setRed, red } = useSideMenu();
    
    return (
        <div className="settingTab">
            <AccInfo acc={user} canView={() => true} collapsed={0} />
            <div className="settingInnerDiv settingInnerAccDiv">
                <div className="settingHeader">
                    {t("acc.header")}
                </div>
                <div className="settingInnerList">
                    <div className="settingInnerButt" onClick={() => {
                        if (red === true) setRed(false);
                        else setRed(true);
                    }}>
                        {red
                            ? (
                                <>
                                    <FloppyDiskBackIcon size={20}/>{t("acc.save")}
                                </>
                            )
                            : (
                                <>
                                    <PencilSimpleIcon size={20}/>{t("acc.edit")}
                                </>
                            )
                        }
                    </div>
                    <div className="settingInnerButt delete">
                        <TrashIcon size={20}/> {t("acc.deleteAccount")}
                    </div>
                </div>
            </div>
        </div>
    );
}