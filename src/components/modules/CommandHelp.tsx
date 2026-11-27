import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import useModalSlider from "../hooks/utils/useModalSlider";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "./scss/CommandHelp.scss";

export default function CommandHelp() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const commands = blackout.commandHelp?.commands ?? [];
    const [selected, setSelected] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const current = commands.find(item => item.label === selected);
    const slider = useModalSlider(page, current ? 2 : 1, selected ?? "", setPage);
    const prefix = "chatUi.commandHelpDetails." + (current?.label.slice(1) ?? "");
    const examples = current ? t(prefix + ".examples", { returnObjects: true }) : [];
    const close = () => setBlackout({seted:false});
    const apply = () => {
        if (!current || !blackout.commandHelp) return;
        const onApply = blackout.commandHelp.onApply;
        close();
        onApply(current.label);
    };

    return <ConfirmActionLayout className="commandHelpModal" title={t("chatUi.commandHelp")} actions={page === 0
        ? <button type="button" onClick={close}>{t("chatUi.quickCommands.close")}</button>
        : <>
            <button type="button" className="commandHelpBack" aria-label={t("chatUi.commandHelpBack")} onClick={() => setPage(0)}><ArrowLeftIcon size={24}/></button>
            <button type="button" className="approve" disabled={!current} onClick={apply}>{t("chatUi.commandHelpApply")}</button>
        </>}>
        <div className="commandHelpViewport" ref={slider.viewportRef} onClickCapture={slider.onClickCapture}>
            <div className={`commandHelpTrack${slider.previewIndex !== null ? " dragging" : ""}`} style={{ transform: `translate3d(${-slider.position * 100}%, 0, 0)` }}>
                <div className="commandHelpPanel commandHelpList" aria-hidden={page !== 0} inert={page !== 0}>
                    {commands.map(item => <button key={item.label} type="button" className="commandHelpRow" onClick={() => {
                        setSelected(item.label);
                        setPage(1);
                    }}>
                        {item.icon && <span className="commandHelpIcon">{item.icon}</span>}
                        <span className="commandHelpRowText"><span>{item.label}</span><span>{item.description}</span></span>
                        <CaretRightIcon size={18}/>
                    </button>)}
                </div>
                <div className="commandHelpPanel commandHelpDetails" aria-hidden={page !== 1} inert={page !== 1}>
                    {current && <div key={current.label} className="commandHelpDetailContent">
                        <div className="commandHelpDetailHeading">
                            {current.icon && <span className="commandHelpIcon">{current.icon}</span>}
                            <div><div>{current.label}</div><span>{current.description}</span></div>
                        </div>
                        <div className="commandHelpLabel">{t("chatUi.commandHelpSyntax")}</div>
                        <code>{t(prefix + ".syntax")}</code>
                        <p>{t(prefix + ".body")}</p>
                        <div className="commandHelpLabel">{t("chatUi.commandHelpExamples")}</div>
                        {Array.isArray(examples) && examples.map((example, index) => <code key={index}>{String(example)}</code>)}
                    </div>}
                </div>
            </div>
        </div>
    </ConfirmActionLayout>;
}
