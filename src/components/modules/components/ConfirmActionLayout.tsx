import type { ReactNode } from "react";
import "../scss/confirmAction.scss";

export default function ConfirmActionLayout({ title, children, actions }: {
    title: string;
    children: ReactNode;
    actions: ReactNode;
}) {
    return <div className="confirmActionModal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirmActionHeader">{title}</div>
        <div className="confirmActionBody">{children}</div>
        <div className="confirmActionButtons">{actions}</div>
    </div>;
}
