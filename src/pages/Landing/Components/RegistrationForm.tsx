import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook";
import { CheckIcon, CheckSquareIcon, CircleNotchIcon, DotOutlineIcon, SquareIcon, XIcon } from "@phosphor-icons/react";
import { LoaderSmall } from "../../../components/ts/LoaderSmall";
import { useTranslation } from "react-i18next";

type validationResponse = {
    valid: boolean;
    error?: string;
};

export default function RegistrationForm({
    showPass,
    showedPass,
    swipeForm,
}: {
    showPass: (value: "auth" | "reg" | "conf") => void;
    showedPass: { auth: boolean; reg: boolean; conf: boolean };
    swipeForm: (targetForm: "auth" | "reg") => void;
}) {
    const { register, response, setResponse, checkRegister, loadingAuth } = useAuth();
    const { t } = useTranslation("sign");

    const [nick, setNick] = useState("");
    const [mail, setMail] = useState("");
    const [pass, setPass] = useState("");
    const [confPass, setConfPass] = useState("");
    const [isValidNick, setIsValidNick] = useState<validationResponse>({ valid: false });
    const [isValidMail, setIsValidMail] = useState<validationResponse>({ valid: false });
    const [isValidPass, setIsValidPass] = useState(false);
    const [isValidConf, setIsValidConf] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPol, setAcceptPol] = useState(false);
    const [loadingNick, setLoadingNick] = useState(false);
    const [loadingMail, setLoadingMail] = useState(false);

    const nickTimeout = useRef<number | undefined>(undefined);
    const mailTimeout = useRef<number | undefined>(undefined);
    const nickAbort = useRef<AbortController | null>(null);
    const mailAbort = useRef<AbortController | null>(null);
    const nickReqId = useRef(0);
    const mailReqId = useRef(0);
    const nickRef = useRef<HTMLInputElement>(null);
    const mailRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);
    const confRef = useRef<HTMLInputElement>(null);
    const termsRef = useRef<HTMLDivElement>(null);
    const polRef = useRef<HTMLDivElement>(null);

    const success = response.success;
    const form = "form" in response && response.form === "reg" ? response.form : null;
    const field = "field" in response ? response.field : null;
    const error = "error" in response ? response.error : "";

    const notPol = (success === false && form && field === "accepts") || field === "pol";
    const notTerms = (success === false && form && field === "accepts") || field === "terms";
    const wrongNick = success === false && form && field === "nick"
    const wrongMail = success === false && form && field === "email"
    const wrongPass = success === false && form && field === "pass"
    const wrongConf = success === false && form && field === "confirm"

    const validateNick = (value: string) => {
        clearTimeout(nickTimeout.current);
        nickAbort.current?.abort();
        nickAbort.current = null;
        if (wrongNick) {
            setResponse({ success: null });
        }
        setNick(value);

        if (!value.trim()) {
            setIsValidNick({ valid: false, error: "" });
            setLoadingNick(false);
            return;
        }

        const regex = /^[A-Za-z0-9_]+$/;
        const valid = regex.test(value);

        if (!valid) {
            setIsValidNick({ valid: false, error: t("reg.invalidSymbols") });
            setLoadingNick(false);
            return;
        }

        if (value.trim().length < 4 || value.trim().length > 16) {
            setIsValidNick({ valid: false, error: t("reg.nickLength") });
            setLoadingNick(false);
            return;
        }

        const currentReqId = ++nickReqId.current;

        nickTimeout.current = window.setTimeout(async () => {
            const controller = new AbortController();
            nickAbort.current = controller;
            setLoadingNick(true);
            try {
                const res = await checkRegister({ nick: value, signal:controller.signal});
                if (currentReqId !== nickReqId.current) return;
                if (!res.success) {
                    setIsValidNick({ valid: false, error: t("reg.nickTaken") });
                } else {
                    setIsValidNick({ valid: true });
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                console.log(e);
            } finally {
                if (currentReqId === nickReqId.current) {
                    setLoadingNick(false);
                }
            }
        }, 500);
    };

    const validateMail = (value: string) => {
        clearTimeout(mailTimeout.current);
        mailAbort.current?.abort();
        mailAbort.current = null;
        if (wrongMail) {
            setResponse({ success: null });
        }
        setMail(value);

        if (!value.trim()) {
            setIsValidMail({ valid: false, error: "" });
            setLoadingMail(false);
            return;
        }

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = regex.test(value);

        if (!valid) {
            setIsValidMail({ valid: false, error: t("reg.invalidEmail") });
            setLoadingMail(false);
            return;
        }

        const currentReqId = ++mailReqId.current;

        mailTimeout.current = window.setTimeout(async () => {
            const controller = new AbortController();
            mailAbort.current = controller;

            setLoadingMail(true);

            try {
                const res = await checkRegister({ mail: value, signal:controller.signal});

                if (currentReqId !== mailReqId.current) return;

                if (!res.success) {
                    setIsValidMail({
                        valid: false,
                        error: t("reg.emailTaken"),
                    });
                } else {
                    setIsValidMail({ valid: true });
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                console.log(e);
            } finally {
                if (currentReqId === mailReqId.current) {
                    setLoadingMail(false);
                }
            }
        }, 500);
    };

    const validatePass = (value: string) => {
        if (wrongPass) {
            setResponse({ success: null });
        }
        setPass(value);
        const lengthV = value.length >= 8 && value.length <= 30;
        const type = /^[A-Za-z\d]+$/.test(value);
        const min = /[A-Za-z]/.test(value) && /\d/.test(value);
        setIsValidPass(lengthV && type && min);
        setIsValidConf(value === confPass);
    };

    const validateConf = (value: string) => {
        if (wrongConf) {
            setResponse({ success: null });
        }
        setConfPass(value);
        setIsValidConf(value === pass && value.length > 0);
    };

    const handleRegister = async () => {
        if (loadingNick || loadingMail) return;
        if (!isValidNick.valid) {
            if (nick.trim() === "") {
                setResponse({success:false, form:"reg", field:"nick", error: t("reg.nickEmpty")})
            } else setResponse({success:false, form:"reg", field:"nick", error: t("reg.nickInvalid")})
            return
        } else if (!isValidMail.valid) {
            if (mail.trim() === "") {
                setResponse({success:false, form:"reg", field:"email", error: t("reg.emailEmpty")})
            } else setResponse({success:false, form:"reg", field:"email", error: t("reg.emailInvalid")})
            return
        } else if (!isValidPass) {
            if (pass.trim() === "") {
                setResponse({success:false, form:"reg", field:"pass", error: t("reg.passwordEmpty")})
            } else if (pass.length < 8 || pass.length > 30) {
                setResponse({success:false, form:"reg", field:"pass", error:"length"})
            } else if (/^[A-Za-z\d]+$/.test(pass) === false) {
                setResponse({success:false, form:"reg", field:"pass", error:"regex"})
            } else if (/[A-Za-z]/.test(pass) === false || /\d/.test(pass) === false) {
                setResponse({success:false, form:"reg", field:"pass", error:"symbols"})
            }
            return
        } else if (!isValidConf) {
            if (confPass.trim() === "") {
                setResponse({success:false, form:"reg", field:"confirm", error: t("reg.confirmRequired")})
            } else setResponse({success:false, form:"reg", field:"confirm", error: t("reg.passwordMismatch")})
            return
        }
        if (!acceptPol && acceptTerms) {
            setResponse({ success: false, form: "reg", field: "pol", error: "unaccepted" });
            return;
        } else if (!acceptTerms && acceptPol) {
            setResponse({ success: false, form: "reg", field: "terms", error: "unaccepted" });
            return;
        } else if (!acceptPol && !acceptTerms) {
            setResponse({ success: false, form: "reg", field: "accepts", error: "unaccepted" });
            return;
        }
        await register({ mail, pass, nick });
    };

    useEffect(() => {
        if (acceptPol && notPol) {
            if (field === "pol") {
                setResponse({ success: null });
            } else if (field === "accepts") {
                setResponse({ success: false, form: "reg", field: "terms", error: "unaccepted" });
            }
        }
        if (acceptTerms && notTerms) {
            if (field === "terms") {
                setResponse({ success: null });
            } else if (field === "accepts") {
                setResponse({ success: false, form: "reg", field: "pol", error: "unaccepted" });
            }
        }
    }, [acceptPol, acceptTerms, field, notPol, notTerms]);

    useEffect(() => {
        return () => {
            clearTimeout(nickTimeout.current);
            clearTimeout(mailTimeout.current);
            nickAbort.current?.abort();
            mailAbort.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (success !== false || form !== "reg") return;

        switch (field) {
            case "nick":
                nickRef.current?.focus();
                nickRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;

            case "email":
                mailRef.current?.focus();
                mailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;

            case "pass":
                passRef.current?.focus();
                passRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;

            case "confirm":
                confRef.current?.focus();
                confRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;
            case "terms":
                termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;
            case "pol":
                polRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;
            case "accepts":
                termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                break;
        }
    }, [success, form, field]);

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleRegister()
        }
    };

    return (
        <div className="landingForm" onKeyDown={handleKeyDown}>
            <input
                type="text"
                className={`landingInput ${wrongNick ? "invalid" : ""}`}
                placeholder={wrongNick ? error : t("reg.nickname")}
                required
                minLength={4}
                maxLength={16}
                ref={nickRef}
                onChange={(e) => validateNick(e.currentTarget.value)}
            />
            {nick.trim() !== "" &&
                (loadingNick ? (
                    <span className="inpExtraSpan loading">
                        <CircleNotchIcon weight="bold" />
                        {t("reg.checkingNick")}
                    </span>
                ) : !isValidNick.valid ? (
                    <span className="inpExtraSpan invalid">
                        <XIcon weight="bold" />
                        {isValidNick.error}
                    </span>
                ) : (
                    <span className="inpExtraSpan valid">
                        <CheckIcon weight="bold" />
                        {t("reg.nickAvailable")}   
                    </span>
                ))}

            <input
                type="email"
                className={`landingInput ${wrongMail ? "invalid" : ""}`}
                placeholder={wrongMail ? error : t("reg.email")}
                required
                ref={mailRef}
                onChange={(e) => validateMail(e.currentTarget.value)}
            />
            {mail.trim() !== "" &&
                (loadingMail ? (
                    <span className="inpExtraSpan loading">
                        <CircleNotchIcon weight="bold" />
                        {t("reg.checkingEmail")}
                    </span>
                ) : !isValidMail.valid ? (
                    <span className="inpExtraSpan invalid">
                        <XIcon weight="bold" />
                        {isValidMail.error}
                    </span>
                ) : (
                    <span className="inpExtraSpan valid">
                        <CheckIcon weight="bold" />
                        {t("reg.emailAvailable")}   
                    </span>
                ))}

            <div
                className="passWrap"
            >
                <input
                    type={showedPass.reg ? "text" : "password"}
                    className={`landingInput landingInputPass ${wrongPass ? "invalid" : ""}`}
                    placeholder={wrongPass ? error : t("reg.password")}
                    required
                    ref={passRef}
                    onChange={(e) => validatePass(e.target.value)}
                />
                {showedPass.reg ? (
                    <Eye onClick={() => showPass("reg")} onMouseDown={(e) => e.preventDefault()} />
                ) : (
                    <EyeOff onClick={() => showPass("reg")} onMouseDown={(e) => e.preventDefault()} />
                )}
            </div>
            <div className="passRules">
                <span className={`${pass.length >= 8 && pass.length <= 30 ? "valid" : ""} ${wrongPass && field === "pass" && error === "length" ? "invalid" : ""}`}>
                    {pass.length >= 8 && pass.length <= 30 ? (
                        <CheckIcon weight="bold" />
                    ) : wrongPass && field === "pass" && error === "length" ? (
                        <XIcon weight="bold" />
                    ) : (
                        <DotOutlineIcon weight="fill" />
                    )}
                    {t("reg.passwordLengthRule")}
                </span>
                <span className={`${/^[A-Za-z\d]+$/.test(pass) ? "valid" : ""} ${wrongPass && field === "pass" && error === "regex" ? "invalid" : ""}`}>
                    {/^[A-Za-z\d]+$/.test(pass) ? (
                        <CheckIcon weight="bold" />
                    ) : wrongPass && field === "pass" && error === "regex" ? (
                        <XIcon weight="bold" />
                    ) : (
                        <DotOutlineIcon weight="fill" />
                    )}
                    {t("reg.passwordLatinRule")}
                </span>
                <span className={`${/[A-Za-z]/.test(pass) && /\d/.test(pass) ? "valid" : ""} ${wrongPass && field === "pass" && error === "symbols" ? "invalid" : ""}`}>
                    {/[A-Za-z]/.test(pass) && /\d/.test(pass) ? (
                        <CheckIcon weight="bold" />
                    ) : wrongPass && field === "pass" && error === "symbols" ? (
                        <XIcon weight="bold" />
                    ) : (
                        <DotOutlineIcon weight="fill" />
                    )}
                    {t("reg.passwordSymbolsRule")}
                </span>
            </div>
            <div className="passWrap">
                <input
                    type={showedPass.conf ? "text" : "password"}
                    className={`landingInput landingInputPass ${wrongConf ? "invalid" : ""}`}
                    placeholder={wrongConf ? error : t("reg.confirmPassword")}
                    required
                    ref={confRef}
                    onChange={(e) => validateConf(e.target.value)}
                />
                {showedPass.conf ? (
                    <Eye onClick={() => showPass("conf")} />
                ) : (
                    <EyeOff onClick={() => showPass("conf")} />
                )}
            </div>

            <div
                className={`checkString ${notTerms && "notAccepted"}`}
                onClick={() => setAcceptTerms(!acceptTerms)}
                ref={termsRef}
            >
                {acceptTerms ? <CheckSquareIcon weight="fill" /> : <SquareIcon />}
                {t("reg.acceptTerms")}
                <span
                    className="acceptSpan"
                    onClick={(e) => {
                        e.preventDefault();
                    }}
                >
                    {t("reg.userAgreement")}
                </span>
            </div>

            <div
                className={`checkString ${notPol && "notAccepted"}`}
                onClick={() => setAcceptPol(!acceptPol)}
                ref={polRef}
            >
                {acceptPol ? <CheckSquareIcon weight="fill" /> : <SquareIcon />}
                {t("reg.acceptTerms")}
                <span
                    className="acceptSpan"
                    onClick={(e) => {
                        e.preventDefault();
                    }}
                >
                    {t("reg.privacyPolicy")}
                </span>
            </div>

            <div className="landingButts">
            {loadingAuth
                ? <LoaderSmall/>
                : <button type="submit" className="greenButt" onClick={() => handleRegister()}>{t("reg.createAccount")}</button>
            }
                
            </div>
            <button type="button" onClick={() => swipeForm("auth")}>
                {t("reg.signIn")}
            </button>
        </div>
    );
}