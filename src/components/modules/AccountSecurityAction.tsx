import { CheckSquareIcon, SquareIcon, XIcon } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useBlackout } from "../hooks/BlackoutHook";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import "./scss/AccountSecurityAction.scss";

export default function AccountSecurityAction() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { user } = useUser();
    const isDelete = blackout.point === "delete";
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pending, setPending] = useState(false);
    const [deleteMessages, setDeleteMessages] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const message = (reason: unknown) => axios.isAxiosError(reason) ?
        (reason.response?.data?.error || t("acc.requestError")) : t("acc.requestError");

    const request = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = isDelete ?
                await api.post("auth/account/deletion/request", { password }) :
                await api.post("auth/account/email/request", { email: newEmail.trim(), password });
            if (!response.data?.success) throw new Error("request");
            setPassword("");
            setPending(true);
        } catch (reason) {
            setError(message(reason));
        } finally {
            setBusy(false);
        }
    };

    const confirm = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const response = isDelete ?
                await api.post("auth/account/deletion/confirm", { code: code.trim(), deleteMessages }) :
                await api.post("auth/account/email/confirm", { code: code.trim() });
            if (!response.data?.success) throw new Error("confirm");
            if (isDelete) {
                sessionStorage.setItem("at-pending-deletion", JSON.stringify({
                    email: user.mail,
                    deadline: response.data.deadline
                }));
                window.location.assign("/account-deletion");
            } else {
                window.location.assign("/sign");
            }
        } catch (reason) {
            setError(message(reason));
            setBusy(false);
        }
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) void confirm();
        else void request();
    };

    const close = () => setBlackout({ seted: false });
    const title = t(isDelete ? "acc.deleteAccount" : "acc.changeEmail");

    return (
        <div className={`accountSecurityModal ${isDelete ? "deletion" : "email"}`} role="dialog" aria-modal="true" aria-label={title}>
            <div className="accountSecurityHeader">
                <span>{title}</span>
                <button type="button" className="accountSecurityClose" onClick={close} aria-label={t("acc.close")}>
                    <XIcon size={20}/>
                </button>
            </div>
            <form className="accountSecurityForm" onSubmit={submit} aria-busy={busy}>
                <div className="accountSecurityBody">
                    <p className="accountSecurityHint">{t(isDelete ? "acc.deleteWarning" : "acc.emailSecurityHint")}</p>
                    {isDelete && <div className="checkString accountSecurityCheckbox">
                        <input id="accountDeleteMessages" className="landingNativeCheckbox" type="checkbox" checked={deleteMessages}
                            onChange={event => setDeleteMessages(event.target.checked)} disabled={pending || busy}/>
                        <label htmlFor="accountDeleteMessages">
                            {deleteMessages ? <CheckSquareIcon weight="fill" aria-hidden="true"/> : <SquareIcon aria-hidden="true"/>}
                            {t("acc.deleteMessages")}
                        </label>
                    </div>}
                    {!pending ? <>
                        {!isDelete && <div className="accountSecurityField">
                            <label htmlFor="accountNewEmail">{t("acc.newEmail")}</label>
                            <input id="accountNewEmail" type="email" autoComplete="email" required
                                value={newEmail} onChange={event => setNewEmail(event.target.value)}/>
                        </div>}
                        <div className="accountSecurityField">
                            <label htmlFor="accountCurrentPassword">{t("acc.password")}</label>
                            <input id="accountCurrentPassword" type="password" autoComplete="current-password" required
                                value={password} onChange={event => setPassword(event.target.value)}/>
                        </div>
                    </> : <>
                        <p className="accountSecurityHint">{isDelete ?
                            t("acc.deleteCodeHint", { email: user.mail }) :
                            t("acc.emailCodeHint", { email: newEmail })}</p>
                        <div className="accountSecurityField">
                            <label htmlFor={isDelete ? "deleteAccountCode" : "settingEmailCode"}>{t("acc.emailCode")}</label>
                            <input id={isDelete ? "deleteAccountCode" : "settingEmailCode"} inputMode="numeric" autoComplete="one-time-code"
                                maxLength={6} required pattern="[0-9]{6}" value={code}
                                onChange={event => setCode(event.target.value.replace(/\D/g, ""))}/>
                        </div>
                    </>}
                    {error && <p className="accountSecurityError" role="alert">{error}</p>}
                </div>
                <div className="accountSecurityActions">
                    <button type="button" className="accountSecurityCancel" disabled={busy} onClick={close}>{t("acc.cancel")}</button>
                    <button type="submit" className={isDelete ? "accountSecurityDanger" : "accountSecurityPrimary"}
                        disabled={busy || (pending ? code.length !== 6 : !password || !isDelete && !newEmail.trim())}>
                        {t(isDelete ?
                            pending ? "acc.confirmDeletion" : "acc.requestDeletion" :
                            pending ? "acc.confirmEmail" : "acc.sendCode")}
                    </button>
                </div>
            </form>
        </div>
    );
}
