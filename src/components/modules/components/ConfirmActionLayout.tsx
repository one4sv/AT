import type { ReactNode } from "react";
import "../scss/confirmAction.scss";

export default function ConfirmActionLayout({ title, children, actions, className = "" }: {
    title: string;
    children: ReactNode;
    actions: ReactNode;
    className?: string;
}) {
    return <div className={`confirmActionModal${className ? " " + className : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirmActionHeader">{title}</div>
        <div className="confirmActionBody">{children}</div>
        <div className="confirmActionButtons">{actions}</div>
    </div>;
}
