import { Eye, EyeOff } from "lucide-react";
import { CheckIcon, CheckSquareIcon, SquareIcon, CircleNotchIcon, DotOutlineIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../components/hooks/AuthHook";
import { LoaderSmall } from "../../../components/ts/LoaderSmall";
import { useTranslation } from "react-i18next";

type Props = {
    active?: boolean;
    showPass: (value: "auth" | "reg" | "conf") => void;
    showedPass: { auth: boolean; reg: boolean; conf: boolean };
    swipeForm: (targetForm: "auth" | "reg") => void;
};
type Check = { valid: boolean; error?: string; checkedValue?: string };
type RegisterField = "nick" | "email" | "pass" | "confirm" | "terms" | "pol" | "accepts";

export default function RegistrationForm({ active = true, showPass, showedPass, swipeForm }: Props) {
    const { register, response, setResponse, checkRegister, loadingAuth } = useAuth();
    const { t } = useTranslation("sign");
    const [nick, setNick] = useState("");
    const [mail, setMail] = useState("");
    const [pass, setPass] = useState("");
    const [confPass, setConfPass] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPol, setAcceptPol] = useState(false);
    const [nickCheck, setNickCheck] = useState<Check>({ valid: false });
    const [mailCheck, setMailCheck] = useState<Check>({ valid: false });
    const [loadingNick, setLoadingNick] = useState(false);
    const [loadingMail, setLoadingMail] = useState(false);
    const checkRegisterRef = useRef(checkRegister);
    checkRegisterRef.current = checkRegister;
    const nickController = useRef<AbortController | null>(null);
    const mailController = useRef<AbortController | null>(null);
    const nickRequestId = useRef(0);
    const mailRequestId = useRef(0);
    const nickRef = useRef<HTMLInputElement>(null);
    const mailRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);
    const confRef = useRef<HTMLInputElement>(null);
    const termsRef = useRef<HTMLInputElement>(null);
    const polRef = useRef<HTMLInputElement>(null);

    const isRegError = response.success === false && "form" in response && response.form === "reg";
    const field = isRegError && "field" in response ? response.field : null;
    const error = isRegError && "error" in response ? response.error : "";
    const passwordLength = pass.length >= 8 && pass.length <= 30;
    const passwordLatin = /^[A-Za-z\d]+$/.test(pass);
    const passwordMixed = /[A-Za-z]/.test(pass) && /\d/.test(pass);
    const passwordValid = passwordLength && passwordLatin && passwordMixed;
    const confirmValid = confPass.length > 0 && pass === confPass;
    const nickLocalValid = /^[A-Za-z0-9_]{4,16}$/.test(nick);
    const mailLocalValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
    const checkedNick = nickLocalValid && nickCheck.valid && nickCheck.checkedValue === nick;
    const checkedMail = mailLocalValid && mailCheck.valid && mailCheck.checkedValue === mail.trim();
    const pending = loadingAuth || loadingNick || loadingMail;

    const clearError = () => { if (isRegError) setResponse({ success: null }); };
    const fail = (target: RegisterField, message: string) => {
        setResponse({ success: false, form: "reg", field: target, error: message });
        const refs = {
            nick: nickRef, email: mailRef, pass: passRef, confirm: confRef, terms: termsRef, pol: polRef, accepts: termsRef
        };
        const element = refs[target]?.current;
        element?.focus({ preventScroll: true });
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        const id = ++nickRequestId.current;
        nickController.current?.abort();
        setLoadingNick(false);
        setNickCheck({ valid: false });
        if (!nickLocalValid) return;
        const timer = window.setTimeout(async () => {
            const controller = new AbortController();
            nickController.current = controller;
            setLoadingNick(true);
            try {
                const result = await checkRegisterRef.current({ nick, signal: controller.signal });
                if (id !== nickRequestId.current || controller.signal.aborted) return;
                setNickCheck({ valid: result.success, checkedValue: nick, error: result.success ? undefined : t("reg.nickTaken") });
            } catch {
                if (!controller.signal.aborted && id === nickRequestId.current)
                    setNickCheck({ valid: false, error: "Не удалось проверить никнейм" });
            } finally {
                if (id === nickRequestId.current && !controller.signal.aborted) setLoadingNick(false);
            }
        }, 500);
        return () => { window.clearTimeout(timer); nickController.current?.abort(); };
    }, [nick, nickLocalValid, t]);

    useEffect(() => {
        const id = ++mailRequestId.current;
        mailController.current?.abort();
        setLoadingMail(false);
        setMailCheck({ valid: false });
        if (!mailLocalValid) return;
        const value = mail.trim();
        const timer = window.setTimeout(async () => {
            const controller = new AbortController();
            mailController.current = controller;
            setLoadingMail(true);
            try {
                const result = await checkRegisterRef.current({ mail: value, signal: controller.signal });
                if (id !== mailRequestId.current || controller.signal.aborted) return;
                setMailCheck({ valid: result.success, checkedValue: value, error: result.success ? undefined : t("reg.emailTaken") });
            } catch {
                if (!controller.signal.aborted && id === mailRequestId.current)
                    setMailCheck({ valid: false, error: "Не удалось проверить почту" });
            } finally {
                if (id === mailRequestId.current && !controller.signal.aborted) setLoadingMail(false);
            }
        }, 500);
        return () => { window.clearTimeout(timer); mailController.current?.abort(); };
    }, [mail, mailLocalValid, t]);

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;
        if (!checkedNick) return fail("nick", !nick ? t("reg.nickEmpty") : nickCheck.error || t("reg.nickInvalid"));
        if (!checkedMail) return fail("email", !mail ? t("reg.emailEmpty") : mailCheck.error || t("reg.emailInvalid"));
        if (!passwordValid) return fail("pass", !pass ? t("reg.passwordEmpty") : !passwordLength ? "length" : !passwordLatin ? "regex" : "symbols");
        if (!confirmValid) return fail("confirm", !confPass ? t("reg.confirmRequired") : t("reg.passwordMismatch"));
        if (!acceptTerms && !acceptPol) return fail("accepts", "unaccepted");
        if (!acceptTerms) return fail("terms", "unaccepted");
        if (!acceptPol) return fail("pol", "unaccepted");
        await register({ mail: mail.trim(), pass, nick });
    };

    const wrong = (name: string) => isRegError && (field === name || (name === "terms" || name === "pol") && field === "accepts");
    const status = (busy: boolean, valid: boolean, message: string) => (
        <span className={`inpExtraSpan ${busy ? "loading" : valid ? "valid" : "invalid"}`} role="status">
            {busy ? <CircleNotchIcon weight="bold"/> : valid ? <CheckIcon weight="bold"/> : <XIcon weight="bold"/>} {message}
        </span>
    );
    const rule = (valid: boolean, label: string, code: string) => (
        <span className={valid ? "valid" : wrong("pass") && error === code ? "invalid" : ""}>
            {valid ? <CheckIcon weight="bold"/> : wrong("pass") && error === code ? <XIcon weight="bold"/> : <DotOutlineIcon weight="fill"/>} {label}
        </span>
    );

    return (
        <form className="landingForm" onSubmit={handleRegister} noValidate inert={!active} aria-hidden={!active}>
            <div className="landingField">
                <label className="landingLabel" htmlFor="reg-nick">{t("reg.nickname")}</label>
                <input id="reg-nick" name="username" ref={nickRef} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={4} maxLength={16} required
                    className={`landingInput ${wrong("nick") ? "invalid" : ""}`} placeholder={t("reg.nickname")} value={nick}
                    onChange={e => { clearError(); setNick(e.target.value); }} aria-invalid={wrong("nick")}/>
                {nick && (!nickLocalValid ? status(false, false, !/^[A-Za-z0-9_]+$/.test(nick) ? t("reg.invalidSymbols") : t("reg.nickLength"))
                    : status(loadingNick, checkedNick, loadingNick ? t("reg.checkingNick") : checkedNick ? t("reg.nickAvailable") : nickCheck.error || t("reg.checkingNick")))}
                {wrong("nick") && <span className="inpExtraSpan invalid" role="alert">{error}</span>}
            </div>
            <div className="landingField">
                <label className="landingLabel" htmlFor="reg-mail">{t("reg.email")}</label>
                <input id="reg-mail" name="email" ref={mailRef} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required
                    className={`landingInput ${wrong("email") ? "invalid" : ""}`} placeholder={t("reg.email")} value={mail}
                    onChange={e => { clearError(); setMail(e.target.value); }} aria-invalid={wrong("email")}/>
                {mail && (!mailLocalValid ? status(false, false, t("reg.invalidEmail"))
                    : status(loadingMail, checkedMail, loadingMail ? t("reg.checkingEmail") : checkedMail ? t("reg.emailAvailable") : mailCheck.error || t("reg.checkingEmail")))}
                {wrong("email") && <span className="inpExtraSpan invalid" role="alert">{error}</span>}
            </div>
            <div className="landingField">
                <label className="landingLabel" htmlFor="reg-pass">{t("reg.password")}</label>
                <div className="passWrap">
                    <input id="reg-pass" name="new-password" ref={passRef} type={showedPass.reg ? "text" : "password"} autoComplete="new-password" required
                        className={`landingInput landingInputPass ${wrong("pass") ? "invalid" : ""}`} placeholder={t("reg.password")} value={pass}
                        onChange={e => { clearError(); setPass(e.target.value); }} aria-invalid={wrong("pass")}/>
                    <button type="button" className="landingEyeButton" aria-label={showedPass.reg ? t("controls.hidePassword") : t("controls.showPassword")} onPointerDown={e => e.preventDefault()} onClick={() => showPass("reg")}>
                        {showedPass.reg ? <Eye size={20}/> : <EyeOff size={20}/>}
                    </button>
                </div>
                <div className="passRules">
                    {rule(passwordLength, t("reg.passwordLengthRule"), "length")}
                    {rule(passwordLatin, t("reg.passwordLatinRule"), "regex")}
                    {rule(passwordMixed, t("reg.passwordSymbolsRule"), "symbols")}
                </div>
            </div>
            <div className="landingField">
                <label className="landingLabel" htmlFor="reg-conf">{t("reg.confirmPassword")}</label>
                <div className="passWrap">
                    <input id="reg-conf" name="confirm-password" ref={confRef} type={showedPass.conf ? "text" : "password"} autoComplete="new-password" required
                        className={`landingInput landingInputPass ${wrong("confirm") ? "invalid" : ""}`} placeholder={t("reg.confirmPassword")} value={confPass}
                        onChange={e => { clearError(); setConfPass(e.target.value); }} aria-invalid={wrong("confirm")}/>
                    <button type="button" className="landingEyeButton" aria-label={showedPass.conf ? t("controls.hidePassword") : t("controls.showPassword")} onPointerDown={e => e.preventDefault()} onClick={() => showPass("conf")}>
                        {showedPass.conf ? <Eye size={20}/> : <EyeOff size={20}/>}
                    </button>
                </div>
                {!!confPass && !confirmValid && <span className="inpExtraSpan invalid" role="status">{t("reg.passwordMismatch")}</span>}
            </div>
            <div className="landingConsents">
                <div className={`checkString ${wrong("terms") ? "notAccepted" : ""}`}>
                    <input ref={termsRef} id="reg-terms" className="landingNativeCheckbox" type="checkbox" checked={acceptTerms} onChange={e => { clearError(); setAcceptTerms(e.target.checked); }}/>
                    <label htmlFor="reg-terms">{acceptTerms ? <CheckSquareIcon weight="fill" aria-hidden="true"/> : <SquareIcon aria-hidden="true"/>}{t("reg.acceptTerms")}</label> <Link className="acceptSpan" to="/info/terms">{t("reg.userAgreement")}</Link>
                </div>
                <div className={`checkString ${wrong("pol") ? "notAccepted" : ""}`}>
                    <input ref={polRef} id="reg-policy" className="landingNativeCheckbox" type="checkbox" checked={acceptPol} onChange={e => { clearError(); setAcceptPol(e.target.checked); }}/>
                    <label htmlFor="reg-policy">{acceptPol ? <CheckSquareIcon weight="fill" aria-hidden="true"/> : <SquareIcon aria-hidden="true"/>}{t("reg.acceptTerms")}</label> <Link className="acceptSpan" to="/info/policy">{t("reg.privacyPolicy")}</Link>
                </div>
            </div>
            <div className="landingButts">
                <button type="submit" className="greenButt" disabled={pending}>{loadingAuth ? <LoaderSmall/> : t("reg.createAccount")}</button>
            </div>
            <button type="button" className="landingSwitchForm" disabled={loadingAuth} onClick={() => { clearError(); swipeForm("auth"); }}>{t("reg.signIn")}</button>
        </form>
    );
}
