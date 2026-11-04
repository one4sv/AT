import type { ReactNode, RefObject, MouseEvent } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import "../../scss/PageBottom.scss";

interface PageBottomProps {
    children?: ReactNode;
    innerRef?: RefObject<HTMLDivElement | null>;
    onBack?: () => void;
    onBackContextMenu?: (event: MouseEvent<HTMLElement>) => void;
    className?: string;
}

export default function PageBottom({ children, onBack, onBackContextMenu, className = "", innerRef }: PageBottomProps) {
    const { t } = useTranslation("info");
    return (
        <div className={`pageBottom ${className}`} ref={innerRef}>
            {onBack && <button
                type="button"
                className="pageBottomBack"
                data-context-menu={onBackContextMenu ? "true" : undefined}
                data-context-menu-allow-button={onBackContextMenu ? "true" : undefined}
                onContextMenu={onBackContextMenu}
                onClick={onBack}
                aria-label={t("navigation.back")}
            >
                <ArrowLeftIcon />
            </button>}
            {children}
        </div>
    );
}
