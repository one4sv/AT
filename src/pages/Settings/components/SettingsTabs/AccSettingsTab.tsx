import { TrashIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";
import SectionArt from "../../../../components/ts/SectionArt";

export default function AccSettingsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const { setBlackout } = useBlackout();

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="account"/>}
            <div className="settingInnerDiv settingInnerAccDiv" data-setting-id="editAcc">
                <AccInfo acc={user} canView={() => true} collapsed={0}/>
            </div>
            <div className="settingAccordion" data-setting-id="email">
                <button type="button" className="settingHeader settingHeaderCollapsible accountSettingAction"
                    onClick={() => setBlackout({ seted: true, module: "AccountSecurityAction", point: "email" })}>
                    <HighlightText text={t("acc.changeEmail")} search={search}/>
                    <CaretRightIcon size={20} aria-hidden="true"/>
                </button>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("acc.header")}</div>
                <div className="settingInnerList">
                    <button type="button" className="settingInnerButt delete" data-setting-id="deleteAccount"
                        onClick={() => setBlackout({ seted: true, module: "AccountSecurityAction", point: "delete" })}>
                        <TrashIcon size={20}/> <HighlightText text={t("acc.deleteAccount")} search={search}/>
                    </button>
                </div>
            </div>
        </div>
    );
}
