import { useState, useRef, useEffect } from "react";
import "./scss/Landing.scss";
import { useAuth } from "../../components/hooks/AuthHook";
import { useUser } from "../../components/hooks/UserHook";
import { useNavigate } from "react-router-dom";
import LandingFooter from "./Components/LandingFooter";
import BodyMail from "./Components/BodyMail";
import RegistrationForm from "./Components/RegistrationForm";
import AuthForm from "./Components/AuthForm";
import { useSettings } from "../../components/hooks/SettingsHook";
import { useUpSettings } from "../../components/hooks/UpdateSettingsHook";
import { MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import useFormSwipe, { landingForms, type LandingFormId } from "./Components/useFormSwipe";
import QuickLogin from "./Components/QuickLogin";
import useLandingSheet from "./Components/useLandingSheet";
import { useTranslation } from "react-i18next";
import "../../scss/landingBackground.scss";
import { Background } from "../../components/ts/utils/background";
export default function Landing() {
    const {
        loadingAuth,
        response
    } = useAuth();
    const { setTitle } = usePageTitle();
    const {
        loadingUser,
        user
    } = useUser();
    const { setNewTheme } = useUpSettings();
    const { theme } = useSettings();
    const navigate = useNavigate();
    const {
        t,
        i18n
    } = useTranslation("common");
    const {
        rootRef,
        open,
        setOpen,
        drag,
        close
    } = useLandingSheet();
    const footerRef = useRef<HTMLDivElement>(null);
    const footerButtonRef = useRef<HTMLButtonElement>(null);
    const wasOpen = useRef(false);
    const russian = i18n.language.startsWith("ru");
    const [body, setBody] = useState<"sign" | "mail">("sign");
    const [activeForm, setActiveForm] = useState<LandingFormId>("auth");
    const [showedPass, setShowedPass] = useState({
        auth: false,
        reg: false,
        conf: false
    });
    const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
    const isDark = theme === "dark" || theme === "system" && systemDark;
    const formRef = useRef<HTMLDivElement>(null);
    useFormSwipe(formRef, activeForm, setActiveForm, body, loadingAuth || loadingUser);
    const isTwoAuth = response.success === true && response.form === "auth" && response.two_auth;
    const notTwoAuth = response.success === true && response.form === "auth" && !response.two_auth;
    const regSuccess = response.success === true && response.form === "reg";

    useEffect(
        () => {
            const query = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
            query.addEventListener("change", handleChange);
            return () => query.removeEventListener("change", handleChange);
        },
        []
    );

    useEffect(
        () => {
            setBody(isTwoAuth && !loadingAuth || regSuccess ? "mail" : "sign");
        },
        [isTwoAuth, loadingAuth, regSuccess]
    );

    useEffect(
        () => {
            if (user.id) {
                const qr = sessionStorage.getItem("at-pending-qr");
                navigate(qr ? `/auth/qr#${qr}` : "/", {
                    replace: true
                });
            }
        },
        [user.id, navigate]
    );

    useEffect(() => {
        setTitle("Achieve Together");
    }, [setTitle]);

    useEffect(
        () => {
            if (open) footerRef.current?.focus({
                preventScroll: true
            }); else if (wasOpen.current) footerButtonRef.current?.focus({
                preventScroll: true
            });
            wasOpen.current = open;
        },
        [open]
    );
    const swipeForm = (targetForm: LandingFormId) => {
        if (!formRef.current || loadingAuth || loadingUser || notTwoAuth) return;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        setActiveForm(targetForm);
        formRef.current.scrollTo(
            {
                left: landingForms.indexOf(targetForm) * formRef.current.clientWidth,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
            }
        );
    };
    const showPass = (value: "auth" | "reg" | "conf") => {
        setShowedPass(
            previous => ({
                ...previous,
                [value]: !previous[value]
            })
        );
    };

    return (
        <div
            className={`landing ${open ? "landingFooterOpen" : ""} ${drag ? "landingDragging" : ""}`}
            ref={rootRef}
            style={{
                "--landing-drag": `${drag}px`
            } as React.CSSProperties}
        >
            <Background />
            <button
                type="button"
                className="changeSignTheme"
                aria-label={t(isDark ? "appearance.enableLight" : "appearance.enableDark")}
                onClick={() => setNewTheme(isDark ? "light" : "dark")}
            >
                {isDark ? <MoonStarsIcon /> : <SunDimIcon />}
            </button>
            <main className="landingDiv" inert={open}>
                <div className="title">{"Achieve Together "}<span>beta</span>
                </div>
                {body === "mail" ? <BodyMail /> : <div className={`landingFormWrapper ${activeForm}`} ref={formRef}>
                    <section
                        className="landingForm landingQrSlide"
                        inert={activeForm !== "qr"}
                        aria-hidden={activeForm !== "qr"}
                    >
                        <QuickLogin
                            mode="qr"
                            active={activeForm === "qr" && !loadingUser}
                            onBack={() => swipeForm("auth")}
                        />
                    </section>
                    <AuthForm
                        active={activeForm === "auth"}
                        showPass={showPass}
                        showedPass={showedPass}
                        swipeForm={swipeForm}
                        onQr={() => swipeForm("qr")}
                    />
                    <RegistrationForm
                        active={activeForm === "reg"}
                        showPass={showPass}
                        showedPass={showedPass}
                        swipeForm={swipeForm}
                    />
                </div>}
            </main>
            <button
                type="button"
                className="landingFooterTrigger"
                ref={footerButtonRef}
                aria-expanded={open}
                aria-controls="landingFooterSheet"
                onClick={() => setOpen(true)}
                inert={open}
            >
                <span>
                    {russian ? "Об Achieve Together" : "About Achieve Together"}
                </span>
                <span aria-hidden="true">⌄</span>
            </button>
            <div className="landingFooterBackdrop" aria-hidden="true" onClick={close} />
            <div
                className="landingFooterSheet"
                id="landingFooterSheet"
                ref={footerRef}
                role="dialog"
                aria-modal={open ? true : undefined}
                aria-label={russian ? "Об Achieve Together" : "About Achieve Together"}
                tabIndex={-1}
                inert={!open}
            >
                <button
                    type="button"
                    className="landingFooterHandle"
                    aria-label={russian ? "Вернуться ко входу" : "Back to sign in"}
                    onClick={close}
                >
                    <span />
                </button>
                <LandingFooter isDark={isDark} />
                <button type="button" className="wtbgButt landingFooterBack" onClick={close}>
                    {russian ? "Вернуться ко входу" : "Back to sign in"}
                </button>
            </div>
        </div>
    );
}
