
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { ArrowSquareOut, Link as LinkIcon, ShieldWarning } from "@phosphor-icons/react";
import "./scss/LinkConfirm.scss";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { api } from "../ts/api";

interface LinkPreviewData {
    url: string;
    hostname: string;
    title: string;
    description: string;
    image?: string;
}

export default function LinkConfirm() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { showLinkPreview } = useSettings();
    const url = blackout.options?.url as string | undefined;
    const [preview, setPreview] = useState<LinkPreviewData | null>(null);
    const [loading, setLoading] = useState(false);

    const close = () => {
        setBlackout({ seted: false, module: "" });
    };

    useEffect(() => {
        if (!url || !showLinkPreview) {
            setLoading(false);
            setPreview(null);
            return;
        }

        const controller = new AbortController();

        const loadPreview = async () => {
            setLoading(true);
            setPreview(null);

            try {
                const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                const res = await api.get("link-preview", {
                    params: { url: target },
                    signal: controller.signal,
                });

                if (!controller.signal.aborted && res.data.success) {
                    setPreview(res.data);
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    return;
                }

                let hostname = url;

                try {
                    hostname = new URL(
                        /^https?:\/\//i.test(url) ? url : `https://${url}`
                    ).hostname;
                } catch {
                    // Оставляем исходный адрес
                }

                setPreview({
                    url,
                    hostname,
                    title: hostname,
                    description: "",
                });

                console.log(err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadPreview();

        return () => {
            controller.abort();
        };
    }, [url, showLinkPreview]);

    if (!url) return null;

    const openLink = () => {
        try {
            const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            const parsed = new URL(target);

            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;

            window.open(parsed.href, "_blank", "noopener,noreferrer");
            close();
        } catch {
            return;
        }
    };

    return (
        <div className="linkConfirmDiv">
            <div className="moduleName">
                <LinkIcon size={24} />
                {t(showLinkPreview ? "security.linkPreview" : "security.externalLink")}
            </div>

            <div className="linkConfirmWarning">
                <ShieldWarning size={22} weight="fill" />
                <div>
                    <div className="linkConfirmWarningTitle">
                        Вы переходите на внешний сайт
                    </div>
                    <div className="linkConfirmWarningText">
                        Убедитесь, что доверяете этому адресу и отправителю. Не вводите пароли и
                        личные данные на подозрительных сайтах.
                    </div>
                </div>
            </div>

            <div className="linkConfirmCard" onClick={() => openLink()}>
                {showLinkPreview && preview?.image && (
                    <img
                        className="linkConfirmImage"
                        src={preview.image}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                )}

                <div className="linkConfirmCardContent">
                    {showLinkPreview && <>
                        <div className="linkConfirmHostname">
                            {preview?.hostname || "Загрузка сайта..."}
                        </div>

                        <div className="linkConfirmTitle">
                            {loading ? "Загрузка предпросмотра..." : preview?.title || url}
                        </div>

                        {!!preview?.description && (
                            <div className="linkConfirmDescription">
                                {preview.description}
                            </div>
                        )}

                    </>}
                    <div className="linkConfirmUrl">{url}</div>
                </div>
            </div>

            <div className="linkConfirmActions">
                <button className="addHabitGoal" onClick={close}>
                    Отмена
                </button>

                <button className="addHabitSave" onClick={openLink}>
                    Открыть
                    <ArrowSquareOut size={18} />
                </button>
            </div>
        </div>
    );
}
