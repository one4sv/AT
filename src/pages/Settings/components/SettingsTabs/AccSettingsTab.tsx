import { TrashIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";

export default function AccSettingsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const [openPhone, setOpenPhone] = useState(false);
    const [openEmail, setOpenEmail] = useState(false);
    
    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="account"/>}
            <div className="settingInnerDiv settingInnerAccDiv" data-setting-id="editAcc">
                <AccInfo acc={user} canView={() => true} collapsed={0}/>
            </div>
            {/* Телефон */}
            <div className="settingAccordion" data-setting-id="phone">
                <div
                    className="settingHeader settingHeaderCollapsible"
                    onClick={() => setOpenPhone(prev => !prev)}
                >
                    <HighlightText text="Изменить номер телефона" search={search} />
                    <CaretDownIcon
                        size={20}
                        className={`settingCaret ${openPhone ? "open" : ""}`}
                    />
                </div>

                <div className={`settingCollapsible ${openPhone ? "open" : ""}`}>
                    <div className="settingCollapsibleInner">
                        <div className="settingsInputDiv">
                            <label htmlFor="settingInfoInputPhone" className="settingsLabel">Новый номер телефона:</label>
                            <div className="settingInputInnerList">
                                <input
                                    id="settingInfoInputPhone"
                                    className="extraInfoInput"
                                />
                            </div>
                        </div>
                        <div className="settingsInputDiv">
                            <label htmlFor="settingInfoInputPassPhone" className="settingsLabel">Пароль:</label>
                            <div className="settingInputInnerList">
                                <input
                                    id="settingInfoInputPassPhone"
                                    className="extraInfoInput"
                                    type="password"
                                />
                            </div>
                        </div>
                        <div className="safetyButt">
                            Подтвердить
                        </div>
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className="settingAccordion" data-setting-id="email">
                <div
                    className="settingHeader settingHeaderCollapsible"
                    onClick={() => setOpenEmail(prev => !prev)}
                >
                    <HighlightText text="Изменить email:" search={search} />
                    <CaretDownIcon
                        size={20}
                        className={`settingCaret ${openEmail ? "open" : ""}`}
                    />
                </div>
                <div className={`settingCollapsible ${openEmail ? "open" : ""}`}>
                    <div className="settingCollapsibleInner">
                        <div className="settingsInputDiv">
                            <label htmlFor="settingInfoInputEmail" className="settingsLabel">Новый email:</label>
                            <div className="settingInputInnerList">
                                <input
                                    id="settingInfoInputEmail"
                                    className="extraInfoInput"
                                />
                            </div>
                        </div>
                        <div className="settingsInputDiv">
                            <label htmlFor="settingInfoInputPassEmail" className="settingsLabel">Пароль:</label>
                            <div className="settingInputInnerList">
                                <input
                                    id="settingInfoInputPassEmail"
                                    className="extraInfoInput"
                                    type="password"
                                />
                            </div>
                        </div>
                        <div className="safetyButt">
                            Подтвердить
                        </div>
                    </div>
                </div>
            </div>

            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("acc.header")}
                </div>
                <div className="settingInnerList">
                    <div className="settingInnerButt delete" data-setting-id="deleteAccount">
                        <TrashIcon size={20}/> <HighlightText text={t("acc.deleteAccount")} search={search} />
                    </div>
                </div>
            </div>
        </div>
    );
}