import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, DesktopIcon, DeviceMobileIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../components/hooks/UserHook";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { api } from "../../components/ts/api";
import { Background } from "../../components/ts/utils/background";
import "./scss/password.scss";

interface Session {
    id: string;
    user_agent: string;
    ip_address: string | null;
    created_at: string;
    last_seen_at?: string;
    last_used_at?: string;
    expires_at: string;
    current: boolean;
}

const describe = (agent: string) => {
    const browser = /Edg\//.test(agent) ? "Edge" : /Firefox\//.test(agent) ? "Firefox" :
        /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Browser";
    const system = /iPhone|iPad/.test(agent) ? "iPhone / iPad" :
        /Android/.test(agent) ? "Android" : /Windows/.test(agent) ? "Windows" :
        /Macintosh|Mac OS/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "";
    return system ? `${browser} · ${system}` : browser;
};

export default function AuthorizedDevices() {
    const { t, i18n } = useTranslation("settings");
    const { user, loadingUser, refetchUser } = useUser();
    const { setBlackout } = useBlackout();
    const { setTitle } = usePageTitle();
    const navigate = useNavigate();
    const [ sessions, setSessions ] = useState<Session[]>([]);
    const [ trusted, setTrusted ] = useState<Session[]>([]);
    const [ legacy, setLegacy ] = useState(false);
    const [ pending, setPending ] = useState(true);
    const [ error, setError ] = useState("");

    const load = useCallback(async () => {
        setPending(true);
        try {
            const { data } = await api.get("/auth/sessions");
            setSessions(data.sessions || []);
            setTrusted(data.trustedDevices || []);
            setLegacy(!!data.legacySession);
            setError("");
        } catch {
            setError(t("securityDevices.loadError"));
        } finally {
            setPending(false);
        }
    }, [t]);

    useEffect(() => {
        setTitle(t("security.devices"));
    }, [setTitle, t]);

    useEffect(() => {
        if (!loadingUser && !user.id) navigate("/sign", { replace: true });
        if (user.id) void load();
    }, [loadingUser, user.id, navigate, load]);

    const confirm = (description: string, run: () => Promise<void>) => {
        setBlackout({
            seted: true,
            module: "ConfirmAction",
            confirmAction: {
                title: t("securityDevices.confirmTitle"),
                description,
                label: t("securityDevices.revoke"),
                run
            }
        });
    };

    const revoke = (session: Session, quick: boolean) => {
        confirm(t(quick ? "securityDevices.confirmTrust" : "securityDevices.confirmSession"), async () => {
            await api.delete(quick ? `/auth/trusted-devices/${session.id}` : `/auth/sessions/${session.id}`);
            if (!quick && session.current) {
                await refetchUser();
                navigate("/sign", { replace: true });
            } else {
                await load();
            }
        });
    };

    const date = (value: string) => {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? "—" :
            new Intl.DateTimeFormat(i18n.language.startsWith("ru") ? "ru-RU" : "en-US", {
                dateStyle: "medium", timeStyle: "short"
            }).format(parsed);
    };

    const list = (items: Session[], quick: boolean) => (
        <div className="devicesList">
            {items.map(item => (
                <div className="devicesRow" key={item.id}>
                    <div className="devicesDeviceIcon">
                        {/iPhone|iPad|Android/.test(item.user_agent) ? <DeviceMobileIcon/> : <DesktopIcon/>}
                    </div>
                    <div className="devicesDetails">
                        <div className="devicesName">
                            {describe(item.user_agent)}
                            {item.current && <span>{t("securityDevices.current")}</span>}
                        </div>
                        <small>{t("securityDevices.since", { date: date(item.created_at) })}</small>
                        <small>{t("securityDevices.lastSeen", { date: date(item.last_used_at || item.last_seen_at || item.created_at) })}</small>
                        {item.ip_address && <small>{t("securityDevices.address", { ip: item.ip_address })}</small>}
                    </div>
                    <button
                        type="button"
                        className="devicesRevoke"
                        onClick={() => revoke(item, quick)}
                        aria-label={t("securityDevices.revoke")}
                    >
                        {t("securityDevices.revoke")}
                    </button>
                </div>
            ))}
            {!items.length && <p>{t("securityDevices.empty")}</p>}
        </div>
    );

    return (
        <div className="passwordPage devicesPage">
            <Background/>
            <main className="passwordCard devicesCard">
                <Link className="passwordBack" to="/settings/security">
                    <ArrowLeftIcon size={22}/> {t("language.back")}
                </Link>
                <ShieldCheckIcon className="passwordIcon" size={40} aria-hidden="true"/>
                <h1>{t("security.devices")}</h1>
                <p>{t("securityDevices.description")}</p>
                {error && <p className="passwordError" role="alert">{error}</p>}
                {pending ? <p>{t("securityDevices.loading")}</p> : (
                    <>
                        {legacy && <p>{t("securityDevices.legacy")}</p>}
                        <h2>{t("securityDevices.sessions")}</h2>
                        {list(sessions, false)}
                        <h2>{t("securityDevices.trusted")}</h2>
                        {list(trusted, true)}
                        <button
                            type="button"
                            className="passwordSubmit"
                            onClick={() => confirm(t("securityDevices.confirmOthers"), async () => {
                                await api.post("/auth/sessions/logout-others");
                                await load();
                            })}
                        >
                            {t("security.logoutAll")}
                        </button>
                    </>
                )}
            </main>
        </div>
    );
}
