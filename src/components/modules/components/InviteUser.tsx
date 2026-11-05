import { CopyIcon, LinkIcon, QrCodeIcon } from "@phosphor-icons/react";
import { useGroup } from "../../hooks/GroupHook";
import { useBlackout } from "../../hooks/BlackoutHook";
import { api } from "../../ts/api";
import { useNote } from "../../hooks/NoteHook";
import { useEffect, useState } from "react";
import { formatDistanceToNow, isPast } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export default function InviteUser() {
    const { t, i18n } = useTranslation("common");
    const { group, refetchGroup } = useGroup();
    const { showNotification } = useNote();
    const { setBlackout } = useBlackout();

    const [ loading, setLoading ] = useState(false);
    const [ generatedLink, setGeneratedLink ] = useState("");
    const [ showCopied, setShowCopied ] = useState(false);

    const expiresAt = group.invite_expires_at ? new Date(group.invite_expires_at) : null;
    const isExpired = !!expiresAt && isPast(expiresAt);
    const linked = generatedLink || (isExpired ? "" : group.link || "");

    useEffect(() => {
        setGeneratedLink("");
        setShowCopied(false);
    }, [group.id]);

    const ensureLink = async () => {
        if (linked) return linked;
        if (!group.id || loading) return "";
        setLoading(true);
        try {
            const res = await api.post("group/generate_link", { group_id: group.id });
            if (!res.data.success || !res.data.link) throw new Error("Link generation failed");
            setGeneratedLink(res.data.link);
            await refetchGroup(group.id);
            return res.data.link as string;
        } catch {
            showNotification("error", t("invite.createFailed"));
            return "";
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        const link = await ensureLink();
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1200);
        } catch {
            showNotification("error", t("links.copyFailed"));
        }
    };

    const openQr = async () => {
        const link = await ensureLink();
        if (!link) return;
        setBlackout({
            seted: true,
            module: "ShareAcc",
            options: {
                link,
                name: group.name,
                url: group.avatar_url ?? undefined
            }
        });
    };

    const timeLeftText = expiresAt && !isExpired
        ? t("invite.expires", { time: formatDistanceToNow(expiresAt, { locale: i18n.resolvedLanguage?.startsWith("en") ? enUS : ru, addSuffix: true }) })
        : t("invite.validForDay");

    return (
        <div className="inviteUser">
            <label htmlFor="inviteUserLink">{t("invite.label")}</label>
            <div className="InviteUserWrapper">
                <input
                    type="text"
                    className="inviteUserLink"
                    id="inviteUserLink"
                    readOnly
                    value={linked}
                    placeholder={loading ? t("invite.generating") : t("invite.tapToGenerate")}
                    onClick={() => {
                        if (!linked) void ensureLink();
                    }}
                />
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void copyLink()}
                    aria-label={linked ? t("links.copy") : t("invite.createAndCopy")}
                    title={linked ? t("links.copy") : t("invite.createLink")}
                >
                    {linked ? <CopyIcon weight="bold" /> : <LinkIcon weight="bold" />}
                </button>
            </div>
            {showCopied && <span className="copiedToast" role="status">{t("links.copied")}</span>}
            <span className="inviteUserHint">{timeLeftText}</span>
            <button
                type="button"
                className="inviteUserQrButton"
                disabled={loading}
                onClick={() => void openQr()}
            >
                <QrCodeIcon weight="fill" />
                {t("invite.showQr")}
            </button>
        </div>
    );
}
