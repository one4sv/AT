import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, KeyIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useUser } from "../../components/hooks/UserHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { api } from "../../components/ts/api";
import { Background } from "../../components/ts/utils/background";
import "./scss/password.scss";

const validPassword = (password: string) =>
    password.length >= 8 && password.length <= 30 &&
    /^[A-Za-z0-9]+$/.test(password) && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

export default function PasswordAccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const change = location.pathname === "/settings/password";
    const [ token, setToken ] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
    const [ hadToken ] = useState(() => !!new URLSearchParams(window.location.hash.slice(1)).get("token"));
    const [ email, setEmail ] = useState("");
    const [ currentPassword, setCurrentPassword ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ confirm, setConfirm ] = useState("");
    const [ visible, setVisible ] = useState(false);
    const [ pending, setPending ] = useState(false);
    const [ completed, setCompleted ] = useState(false);
    const [ error, setError ] = useState("");
    const { t } = useTranslation("sign");
    const { setTitle } = usePageTitle();
    const { user, loadingUser, refetchUser } = useUser();

    useEffect(() => {
        if (location.hash.startsWith("#token=")) {
            window.history.replaceState(window.history.state, "", location.pathname + location.search);
        }
    }, [location.hash, location.pathname, location.search]);

    useEffect(() => {
        if (change && !loadingUser && !user.id) navigate("/sign", { replace: true });
    }, [change, loadingUser, user.id, navigate]);

    const title = change ? t("password.changeTitle") : hadToken ? t("password.resetTitle") : t("password.forgotTitle");
    useEffect(() => { setTitle(title); }, [setTitle, title]);

    const submit = async () => {
        if (pending || completed) return;
        setError("");
        if (!change && !token) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setError(t("password.invalidEmail"));
                return;
            }
        } else {
            if (!validPassword(password)) {
                setError(t("password.passwordRules"));
                return;
            }
            if (password !== confirm) {
                setError(t("password.notMatching"));
                return;
            }
            if (change && !currentPassword) {
                setError(t("password.currentRequired"));
                return;
            }
        }
        setPending(true);
        try {
            if (change) {
                await api.post("/auth/password/change", { currentPassword, newPassword: password });
                setCompleted(true);
                setCurrentPassword("");
                setPassword("");
                setConfirm("");
                await refetchUser();
                navigate("/sign", { replace: true });
            } else if (token) {
                await api.post("/auth/password/reset", { token, password });
                setToken("");
                setPassword("");
                setConfirm("");
                setCompleted(true);
            } else {
                await api.post("/auth/password/forgot", { email: email.trim() });
                setCompleted(true);
            }
        } catch (err) {
            const status = isAxiosError(err) ? err.response?.status : undefined;
            setError(status === 410 ? t("password.expired") :
                status === 429 ? t("password.rateLimited") :
                status === 403 && change ? t("password.wrongCurrent") :
                t("password.error"));
        } finally {
            setPending(false);
        }
    };

    const input = (id: string, label: string, value: string, onChange: (value: string) => void, autocomplete: string) => (
        <label className="passwordField" htmlFor={id}>
            <span>{label}</span>
            <input
                id={id}
                value={value}
                onChange={event => onChange(event.target.value)}
                type={visible ? "text" : "password"}
                autoComplete={autocomplete}
                maxLength={autocomplete === "current-password" ? 256 : 30}
                onKeyDown={event => { if (event.key === "Enter") void submit(); }}
            />
        </label>
    );

    return (
        <div className="passwordPage">
            <Background/>
            <main className="passwordCard">
                <Link className="passwordBack" to={change ? "/settings/security" : "/sign"}>
                    <ArrowLeftIcon size={22}/> {t("password.back")}
                </Link>
                <KeyIcon className="passwordIcon" size={40} aria-hidden="true"/>
                <h1>{title}</h1>
                <p>{completed ? (hadToken || change ? t("password.changed") : t("password.emailSent")) :
                    change ? t("password.changeDescription") : hadToken ? t("password.resetDescription") : t("password.forgotDescription")}</p>

                {!completed && (
                    <>
                        {!change && !token ? (
                            <label className="passwordField" htmlFor="reset-email">
                                <span>{t("password.email")}</span>
                                <input
                                    id="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={event => setEmail(event.target.value)}
                                    onKeyDown={event => { if (event.key === "Enter") void submit(); }}
                                />
                            </label>
                        ) : (
                            <>
                                {change && input("current-password", t("password.current"), currentPassword, setCurrentPassword, "current-password")}
                                {input("new-password", t("password.new"), password, setPassword, "new-password")}
                                {input("confirm-password", t("password.confirm"), confirm, setConfirm, "new-password")}
                                <button type="button" className="passwordVisibility" onClick={() => setVisible(v => !v)}>
                                    {visible ? <EyeSlashIcon/> : <EyeIcon/>}
                                    {t(visible ? "controls.hidePassword" : "controls.showPassword")}
                                </button>
                                <small>{t("password.passwordRules")}</small>
                            </>
                        )}
                        {error && <p className="passwordError" role="alert">{error}</p>}
                        <button type="button" className="passwordSubmit" disabled={pending} onClick={() => void submit()}>
                            {pending ? t("password.loading") : t(change || token ? "password.save" : "password.send")}
                        </button>
                    </>
                )}
                {completed && <Link className="passwordSubmit passwordDone" to="/sign">{t("password.signIn")}</Link>}
            </main>
        </div>
    );
}
