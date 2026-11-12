import "./scss/confirmAction.scss";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";

export default function ConfirmAction() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const [ saving, setSaving ] = useState(false);
    const [ error, setError ] = useState("");
    const submitting = useRef(false);
    const action = blackout.confirmAction;
    if (!action) return null;
    return <div className="confirmActionModal" role="dialog" aria-modal="true" aria-label={action.title}>
        <div className="confirmActionHeader">{action.title}</div>
        <div className="confirmActionBody">
            <p>{action.description}</p>
            {error && <p role="alert">{error}</p>}
        </div>
        <div className="confirmActionButtons">
            <button type="button" disabled={saving} onClick={() => setBlackout({ seted: false })}>{t("dialog.cancel")}</button>
            <button type="button" className="danger" disabled={saving} onClick={async () => {
                if (submitting.current) return;
                submitting.current = true;
                setSaving(true);
                try {
                    await action.run();
                    setBlackout({ seted: false });
                } catch {
                    setError(t("dialog.actionFailed"));
                } finally {
                    submitting.current = false;
                    setSaving(false);
                }
            }}>{saving ? t("dialog.saving") : action.label || t("habitUi.delete")}</button>
        </div>
    </div>;
}
