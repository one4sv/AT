import { TrashIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function AccSettingsTab() {
    const { t } = useTranslation("settings");
    const { user } = useUser();

    const [openPhone, setOpenPhone] = useState(false);
    const [openEmail, setOpenEmail] = useState(false);

    return (
        <div className="settingTab">
            <div className="settingInnerDiv settingInnerAccDiv">
                <AccInfo acc={user} canView={() => true} collapsed={0} />
            </div>

            {/* Телефон */}
            <div className="settingAccordion">
                <div
                    className="settingHeader settingHeaderCollapsible"
                    onClick={() => setOpenPhone(prev => !prev)}
                >
                    Изменить номер телефона
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
            <div className="settingAccordion">
                <div
                    className="settingHeader settingHeaderCollapsible"
                    onClick={() => setOpenEmail(prev => !prev)}
                >
                    Изменить email
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
                    <div className="settingInnerButt delete">
                        <TrashIcon size={20}/> {t("acc.deleteAccount")}
                    </div>
                </div>
            </div>
        </div>
    );
}