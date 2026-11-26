import "./scss/confirmAction.scss";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
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
    return <ConfirmActionLayout title={action.title} actions={<>
            <button type="button" disabled={saving} onClick={() => setBlackout({ seted: false })}>{t("dialog.cancel")}</button>
            <button type="button" className={action.variant === "approve" ? "approve" : "danger"} disabled={saving} onClick={async () => {
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
        </>}>
        <p>{action.description}</p>
        {error && <p role="alert">{error}</p>}
    </ConfirmActionLayout>;
}
