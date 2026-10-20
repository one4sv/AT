import { Eye, EyeOff } from "lucide-react";
import { CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../../components/hooks/AuthHook";
import { LoaderSmall } from "../../../components/ts/LoaderSmall";
import { useTranslation } from "react-i18next";

type Props = {
    active?: boolean;
    showPass: (value: "auth" | "reg" | "conf") => void;
    showedPass: { auth: boolean; reg: boolean; conf: boolean };
    swipeForm: (targetForm: "auth" | "reg") => void;
};

export default function AuthForm({ active = true, showPass, showedPass, swipeForm }: Props) {
    const { auth, response, setResponse, loadingAuth } = useAuth();
    const { t } = useTranslation("sign");
    const [pass, setPass] = useState("");
    const [login, setLogin] = useState("");
    const [isRemember, setIsRemember] = useState(false);

    const isAuthError = response.success === false && "form" in response && response.form === "auth";
    const field = isAuthError && "field" in response ? response.field : null;
    const error = isAuthError && "error" in response ? response.error : "";
    const wrongLogin = isAuthError && (field === "login" || field === "all");
    const wrongPass = isAuthError && (field === "pass" || field === "all");

    const clearError = () => {
        if (isAuthError) setResponse({ success: null });
    };

    const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loadingAuth) return;
        if (!login.trim()) {
            setResponse({ success: false, error: "Поле не может быть пустым", field: "login", form: "auth" });
            return;
        }
        if (!pass) {
            setResponse({ success: false, error: "Пароль не может быть пустым", field: "pass", form: "auth" });
            return;
        }
        await auth({ login: login.trim(), pass, isRemember });
    };

    return (
        <form className="landingForm" onSubmit={handleAuth} noValidate inert={!active} aria-hidden={!active}>
            <div className="landingField">
                <label htmlFor="auth-login" className="landingLabel">{t("auth.emailOrNickname")}</label>
                <input
                    id="auth-login"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    className={`landingInput ${wrongLogin ? "invalid" : ""}`}
                    placeholder={t("auth.emailOrNickname")}
                    aria-invalid={wrongLogin}
                    aria-describedby={wrongLogin ? "auth-login-error" : undefined}
                    required
                    value={login}
                    onChange={e => { clearError(); setLogin(e.currentTarget.value); }}
                />
                {wrongLogin && <span id="auth-login-error" className="inpExtraSpan invalid" role="alert">{error}</span>}
            </div>

            <div className="landingField">
                <label htmlFor="auth-password" className="landingLabel">{t("auth.password")}</label>
                <div className="passWrap">
                    <input
                        id="auth-password"
                        name="password"
                        type={showedPass.auth ? "text" : "password"}
                        autoComplete="current-password"
                        className={`landingInput landingInputPass ${wrongPass ? "invalid" : ""}`}
                        placeholder={t("auth.password")}
                        required
                        aria-invalid={wrongPass}
                        aria-describedby={wrongPass ? "auth-password-error" : undefined}
                        value={pass}
                        onChange={e => { clearError(); setPass(e.currentTarget.value); }}
                    />
                    <button
                        className="landingEyeButton"
                        type="button"
                        aria-label={showedPass.auth ? t("controls.hidePassword") : t("controls.showPassword")}
                        aria-pressed={showedPass.auth}
                        onPointerDown={e => e.preventDefault()}
                        onClick={() => showPass("auth")}
                    >
                        {showedPass.auth ? <Eye size={20}/> : <EyeOff size={20}/>}
                    </button>
                </div>
                {wrongPass && <span id="auth-password-error" className="inpExtraSpan invalid" role="alert">{error}</span>}
            </div>

            <label className="checkString">
                <input className="landingNativeCheckbox" type="checkbox" checked={isRemember} onChange={e => setIsRemember(e.target.checked)}/>
                {isRemember ? <CheckSquareIcon weight="fill" aria-hidden="true"/> : <SquareIcon aria-hidden="true"/>}
                <span>{t("auth.rememberMe")}</span>
            </label>

            <div className="landingButts">
                <button type="submit" className="greenButt" disabled={loadingAuth}>
                    {loadingAuth ? <LoaderSmall/> : t("auth.signIn")}
                </button>
                {/* Подключите сюда реальный маршрут восстановления пароля после его реализации. */}
            </div>
            <button type="button" className="landingSwitchForm" disabled={loadingAuth} onClick={() => { clearError(); swipeForm("reg"); }}>
                {t("auth.createAccount")}
            </button>
        </form>
    );
}
