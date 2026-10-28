import type { ReactNode, RefObject } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import "../../scss/PageBottom.scss";

interface PageBottomProps {
    children?: ReactNode;
    innerRef?: RefObject<HTMLDivElement | null>;
    onBack?: () => void;
    className?: string;
}

export default function PageBottom({ children, onBack, className = "", innerRef }: PageBottomProps) {
    const { t } = useTranslation("info");
    return (
        <div className={`pageBottom ${className}`} ref={innerRef}>
            {onBack && <button
                type="button"
                className="pageBottomBack"
                onClick={onBack}
                aria-label={t("navigation.back")}
            >
                <ArrowLeftIcon />
            </button>}
            {children}
        </div>
    );
}
