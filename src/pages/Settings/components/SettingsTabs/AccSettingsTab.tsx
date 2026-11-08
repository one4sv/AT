import { TrashIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import AccInfo from "../../../Acc/components/AccInfo";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import HighlightText from "../../../../components/ts/HighlightText";
import { api } from "../../../../components/ts/api";
import axios from "axios";

import SectionArt from "../../../../components/ts/SectionArt";

export default function AccSettingsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const [openEmail, setOpenEmail] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [emailPending, setEmailPending] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteCode, setDeleteCode] = useState("");
    const [deletePending, setDeletePending] = useState(false);
    const [deleteMessages, setDeleteMessages] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const message = (reason: unknown) => axios.isAxiosError(reason) ?
        (reason.response?.data?.error || t("acc.requestError")) : t("acc.requestError");

    const requestEmail = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/email/request", { email: newEmail.trim(), password: emailPassword });
            if (!response.data?.success) throw new Error("email");
            setEmailPassword("");
            setEmailPending(true);
        } catch (reason) {
            setError(message(reason));
        } finally {
            setBusy(false);
        }
    };

    const confirmEmail = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/email/confirm", { code: emailCode.trim() });
            if (!response.data?.success) throw new Error("email");
            window.location.assign("/sign");
        } catch (reason) {
            setError(message(reason));
            setBusy(false);
        }
    };

    const requestDeletion = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/deletion/request", { password: deletePassword });
            if (!response.data?.success) throw new Error("delete");
            setDeletePassword("");
            setDeletePending(true);
        } catch (reason) {
            setError(message(reason));
        } finally {
            setBusy(false);
        }
    };

    const confirmDeletion = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/deletion/confirm", {
                code: deleteCode.trim(),
                deleteMessages
            });
            if (!response.data?.success) throw new Error("delete");
            sessionStorage.setItem("at-pending-deletion", JSON.stringify({
                email: user.mail,
                deadline: response.data.deadline
            }));
            window.location.assign("/account-deletion");
        } catch (reason) {
            setError(message(reason));
            setBusy(false);
        }
    };

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="account"/>}
            <div className="settingInnerDiv settingInnerAccDiv" data-setting-id="editAcc">
                <AccInfo acc={user} canView={() => true} collapsed={0}/>
            </div>
            <div className="settingAccordion" data-setting-id="email">
                <div className="settingHeader settingHeaderCollapsible" onClick={() => { setOpenEmail(value => !value); setError(""); }}>
                    <HighlightText text={t("acc.changeEmail")} search={search}/>
                    <CaretDownIcon size={20} className={`settingCaret ${openEmail ? "open" : ""}`}/>
                </div>
                <div className={`settingCollapsible ${openEmail ? "open" : ""}`}>
                    <div className="settingCollapsibleInner">
                        <p className="settingHint">{t("acc.emailSecurityHint")}</p>
                        {!emailPending ? <>
                            <div className="settingsInputDiv">
                                <label htmlFor="settingInfoInputEmail" className="settingsLabel">{t("acc.newEmail")}</label>
                                <div className="settingInputInnerList">
                                    <input id="settingInfoInputEmail" className="extraInfoInput" type="email"
                                        autoComplete="email" value={newEmail} onChange={event => setNewEmail(event.target.value)}/>
                                </div>
                            </div>
                            <div className="settingsInputDiv">
                                <label htmlFor="settingInfoInputPassEmail" className="settingsLabel">{t("acc.password")}</label>
                                <div className="settingInputInnerList">
                                    <input id="settingInfoInputPassEmail" className="extraInfoInput" type="password"
                                        autoComplete="current-password" value={emailPassword} onChange={event => setEmailPassword(event.target.value)}/>
                                </div>
                            </div>
                            <button className="safetyButt" type="button" disabled={busy || !newEmail.trim() || !emailPassword}
                                onClick={() => void requestEmail()}>{t("acc.sendCode")}</button>
                        </> : <>
                            <p className="settingHint">{t("acc.emailCodeHint", { email: newEmail })}</p>
                            <label htmlFor="settingEmailCode" className="settingsLabel">{t("acc.emailCode")}</label>
                            <div className="settingInputInnerList">
                                <input id="settingEmailCode" className="extraInfoInput" inputMode="numeric"
                                    autoComplete="one-time-code" maxLength={6} value={emailCode}
                                    onChange={event => setEmailCode(event.target.value.replace(/\D/g, ""))}/>
                            </div>
                            <button className="safetyButt" type="button" disabled={busy || emailCode.length !== 6}
                                onClick={() => void confirmEmail()}>{t("acc.confirmEmail")}</button>
                        </>}
                        {error && openEmail && <p className="settingHint" role="alert">{error}</p>}
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("acc.header")}</div>
                <div className="settingInnerList">
                    <button type="button" className="settingInnerButt delete" data-setting-id="deleteAccount"
                        onClick={() => { setOpenDelete(value => !value); setError(""); }}>
                        <TrashIcon size={20}/> <HighlightText text={t("acc.deleteAccount")} search={search}/>
                        <CaretDownIcon size={20} className={`settingCaret ${openDelete ? "open" : ""}`}/>
                    </button>
                    {openDelete && <div className="settingCollapsibleInner">
                        <p className="settingHint">{t("acc.deleteWarning")}</p>
                        <label className="settingTogglerDiv">
                            <input type="checkbox" checked={deleteMessages}
                                onChange={event => setDeleteMessages(event.target.checked)} disabled={deletePending}/>
                            <span>{t("acc.deleteMessages")}</span>
                        </label>
                        {!deletePending ? <>
                            <label htmlFor="deleteAccountPassword" className="settingsLabel">{t("acc.password")}</label>
                            <div className="settingInputInnerList">
                                <input id="deleteAccountPassword" className="extraInfoInput" type="password"
                                    autoComplete="current-password" value={deletePassword}
                                    onChange={event => setDeletePassword(event.target.value)}/>
                            </div>
                            <button className="settingInnerButt delete" type="button" disabled={busy || !deletePassword}
                                onClick={() => void requestDeletion()}>{t("acc.requestDeletion")}</button>
                        </> : <>
                            <p className="settingHint">{t("acc.deleteCodeHint", { email: user.mail })}</p>
                            <label htmlFor="deleteAccountCode" className="settingsLabel">{t("acc.emailCode")}</label>
                            <div className="settingInputInnerList">
                                <input id="deleteAccountCode" className="extraInfoInput" inputMode="numeric"
                                    autoComplete="one-time-code" maxLength={6} value={deleteCode}
                                    onChange={event => setDeleteCode(event.target.value.replace(/\D/g, ""))}/>
                            </div>
                            <button className="settingInnerButt delete" type="button" disabled={busy || deleteCode.length !== 6}
                                onClick={() => void confirmDeletion()}>{t("acc.confirmDeletion")}</button>
                        </>}
                        {error && <p className="settingHint" role="alert">{error}</p>}
                    </div>}
                </div>
            </div>
        </div>
    );
}