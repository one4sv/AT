import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import RadioGroup from "../ts/RadioGroup";
import TA from "../ts/TA";
import "./FeedbackModal.scss";

type FeedbackKind = "bug" | "idea" | "complaint" | "other";

export default function FeedbackModal() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const { user } = useUser();
    const target = blackout.feedback;
    const strictReport = !!target;
    const [kind, setKind] = useState<FeedbackKind>("bug");
    const [reason, setReason] = useState("spam");
    const [title, setTitle] = useState("");
    const [details, setDetails] = useState("");
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [sentId, setSentId] = useState("");
    const [error, setError] = useState("");
    const reportKind = strictReport || kind === "complaint";

    const close = () => setBlackout({ seted: false });
    const types = (["bug", "idea", "complaint", "other"] as const).map(value => ({
        value,
        label: t("feedback.types." + value)
    }));
    const reasons = (["spam", "harassment", "hate", "violence", "sexual", "privacy", "fraud", "other"] as const).map(value => ({
        value,
        label: t("feedback.reasons." + value)
    }));

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (sending || !details.trim() || (strictReport && !user.id)) return;
        setError("");
        setSending(true);
        try {
            const subject = strictReport
                ? t("feedback.reportSubject", { target: t("feedback.targets." + target?.targetType) })
                : title.trim();
            const response = await api.post("feedback", {
                kind: strictReport ? "report" : kind,
                reason: reportKind ? reason : undefined,
                title: subject,
                details: details.trim(),
                contactEmail: user.id ? undefined : email.trim() || undefined,
                targetType: target?.targetType,
                targetId: target?.targetId,
                page: target?.targetUrl || window.location.pathname,
                website: ""
            });
            if (!response.data?.success || !response.data?.id) throw new Error("Feedback not accepted");
            setSentId(response.data.id);
        } catch {
            setError(t("feedback.sendFailed"));
        } finally {
            setSending(false);
        }
    };

    return <div className="feedbackModal" role="dialog" aria-modal="true" aria-label={t(strictReport ? "feedback.reportTitle" : "feedback.title")}>
        <div className="feedbackModalHeader">
            <div>
                <div className="feedbackModalName">{t(strictReport ? "feedback.reportTitle" : "feedback.title")}</div>
                <p>{t(strictReport ? "feedback.reportHint" : "feedback.hint")}</p>
            </div>
            <button type="button" className="feedbackModalClose" onClick={close} aria-label={t("feedback.close")}><XIcon size={20}/></button>
        </div>
        {sentId ?
            <div className="feedbackSuccess" role="status">
                <div>{t("feedback.success")}</div>
                <p>{t("feedback.ticket", { id: sentId })}</p>
                <button type="button" onClick={close}>{t("feedback.done")}</button>
            </div> :
            <form onSubmit={event => void submit(event)}>
                {!strictReport && <div className="feedbackField">
                    <span>{t("feedback.kindLabel")}</span>
                    <RadioGroup list={types} val={kind} newVal={value => setKind(value as FeedbackKind)} id="feedbackKind"/>
                </div>}
                {strictReport && <div className="feedbackTarget">
                    <span>{t("feedback.targetLabel")}</span>
                    <span>{t("feedback.targets." + target?.targetType)} · {target?.targetId}</span>
                </div>}
                {reportKind && <div className="feedbackField">
                    <span>{t("feedback.reasonLabel")}</span>
                    <RadioGroup list={reasons} val={reason} newVal={setReason} id="feedbackReason"/>
                </div>}
                {!strictReport && <label className="feedbackField">
                    <span>{t("feedback.subjectLabel")}</span>
                    <input value={title} onChange={event => setTitle(event.target.value)} maxLength={140} minLength={4} required placeholder={t("feedback.subjectPlaceholder")}/>
                </label>}
                <label className="feedbackField">
                    <span>{t("feedback.detailsLabel")}</span>
                    <TA value={details} minHeight={9} maxHeight={27} maxLength={3000} minLength={12} required
                        onChange={event => setDetails(event.target.value)}
                        placeholder={t(strictReport ? "feedback.reportPlaceholder" : "feedback.detailsPlaceholder")}/>
                    <span className="feedbackCounter">{details.length}/3000</span>
                </label>
                {!user.id && !strictReport && <label className="feedbackField">
                    <span>{t("feedback.emailLabel")}</span>
                    <input type="email" value={email} maxLength={140} onChange={event => setEmail(event.target.value)} placeholder={t("feedback.emailPlaceholder")}/>
                </label>}
                {strictReport && !user.id && <p className="feedbackError">{t("feedback.signIn")}</p>}
                {error && <p role="alert" className="feedbackError">{error}</p>}
                <p className="feedbackPrivacy">{t("feedback.privacy")}</p>
                <div className="feedbackActions">
                    <button type="button" onClick={close}>{t("feedback.cancel")}</button>
                    <button type="submit" disabled={sending || details.trim().length < 12 || (!strictReport && title.trim().length < 4) || (strictReport && !user.id)}>
                        <PaperPlaneTiltIcon size={20}/> {t(sending ? "feedback.sending" : "feedback.send")}
                    </button>
                </div>
            </form>}
    </div>;
}
