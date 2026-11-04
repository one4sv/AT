import { useEffect, useState, useRef, type PointerEvent } from "react";
import { ListIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";

export default function HabitsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { orderHabits, showArchived, showArchivedInAcc, weekStart, settingsLoaded } = useSettings();
    const { setNewOrder, setNewShowArchived, setNewShowArchivedInAcc, setNewWeekStart } = useUpSettings();

    const [displayOrder, setDisplayOrder] = useState<string[]>([]);
    const [dragging, setDragging] = useState<string | null>(null);
    const currentOrder = useRef<string[]>([]);
    const drag = useRef<{ id: number; index: number; changed: boolean } | null>(null);

    useEffect(() => {
        if (!drag.current && Array.isArray(orderHabits)) {
            currentOrder.current = [...orderHabits];
            setDisplayOrder([...orderHabits]);
        }
    }, [orderHabits]);

    const startDrag = (e: PointerEvent<HTMLButtonElement>, index: number) => {
        if (drag.current || !settingsLoaded || displayOrder.length < 2) return;
        e.preventDefault();
        e.stopPropagation();
        drag.current = { id: e.pointerId, index, changed: false };
        currentOrder.current = [...displayOrder];
        setDragging(displayOrder[index]);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const moveDrag = (e: PointerEvent<HTMLButtonElement>) => {
        const active = drag.current;
        if (!active || active.id !== e.pointerId) return;
        e.preventDefault();
        e.stopPropagation();

        const element = document.elementFromPoint(e.clientX, e.clientY);
        const row = element?.closest<HTMLElement>(".orderSetDiv");
        if (!row) return;
        const index = Number(row.dataset.orderIndex);
        if (!Number.isInteger(index) || index < 0 || index >= currentOrder.current.length ||
            index === active.index) return;

        const next = [...currentOrder.current];
        const item = next.splice(active.index, 1)[0];
        next.splice(index, 0, item);
        active.index = index;
        active.changed = true;
        currentOrder.current = next;
        setDisplayOrder(next);
    };

    const endDrag = (e: PointerEvent<HTMLButtonElement>, cancelled = false) => {
        const active = drag.current;
        if (!active || active.id !== e.pointerId) return;
        drag.current = null;
        setDragging(null);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        if (cancelled) {
            currentOrder.current = [...orderHabits];
            setDisplayOrder([...orderHabits]);
        } else if (active.changed) {
            setNewOrder(currentOrder.current);
        }
    };

    const moveByKeyboard = (index: number, direction: number) => {
        const target = index + direction;
        if (target < 0 || target >= displayOrder.length) return;
        const next = [...displayOrder];
        next.splice(target, 0, ...next.splice(index, 1));
        currentOrder.current = next;
        setDisplayOrder(next);
        setNewOrder(next);
    };

    const getHabitLabel = (type: string) => {
        switch (type) {
            case "everyday":
                return t("habits.everyday");
            case "weekly":
                return t("habits.weekly");
            case "sometimes":
                return t("habits.sometimes");
            default:
                return type;
        }
    };

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="habits"/>}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("habits.archive")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewShowArchived(!showArchived)} data-setting-id="showArchived">
                        <HighlightText text={t("habits.archivedInSideMenu")} search={search} />
                        <Toggler state={showArchived} />
                    </div>
                    <div className="settingHint">
                        {t("habits.archivedInSideMenuHint")}
                    </div>
                    <div className="settingTogglerDiv" onClick={() => setNewShowArchivedInAcc(!showArchivedInAcc)} data-setting-id="showArchivedInAcc">
                        <HighlightText text={t("habits.archivedInProfile")} search={search} />
                        <Toggler state={showArchivedInAcc} />
                    </div>
                    <div className="settingHint">
                        {t("habits.archivedInProfileHint")}
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="weekStart">
                <div className="settingHeader">
                    {t("habits.schedule")}
                </div>
                <div className="habitTabDiv">
                    <HighlightText text={t("habits.weekStartFrom")} search={search} />
                    <DatePicker
                        className="habitTabDP"
                        selected={weekStart ? new Date(weekStart) : null}
                        maxDate={new Date()}
                        dateFormat="dd.MM.yyyy"
                        minDate={new Date(2000, 0, 1)}
                        onChange={(date) => {
                            if (!date) return;
                            const formatted = date.toISOString().split("T")[0];
                            setNewWeekStart(formatted);
                        }}
                    />
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="orderHabits">
                <div className="settingHeader">
                    <HighlightText text={t("habits.displayOrder")} search={search} />
                </div>
                <div className="orderShown" role="list">
                    {!settingsLoaded ?
                        Array.from({ length: 3 }, (_, index) => (
                            <div className="orderSetDiv skeletonOrderItem" key={index}>
                                <div className="skeletonLine skeletonShort"/>
                            </div>
                        )) :
                        displayOrder.map((type, index) => (
                            <motion.div
                                layout
                                transition={{ layout: { duration: .22, ease: "easeOut" } }}
                                key={type}
                                role="listitem"
                                data-order-index={index}
                                className={`orderSetDiv ${dragging === type ? "dragging" : ""}`}
                            >
                                <button type="button" className="orderDragHandle" data-no-pull-refresh="true"
                                    aria-label={t("habits.displayOrder")}
                                    onPointerDown={e => startDrag(e, index)}
                                    onPointerMove={moveDrag}
                                    onPointerUp={e => endDrag(e)}
                                    onPointerCancel={e => endDrag(e, true)}
                                    onKeyDown={e => {
                                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                            e.preventDefault();
                                            moveByKeyboard(index, e.key === "ArrowUp" ? -1 : 1);
                                        }
                                    }}
                                ><ListIcon size={20}/></button>
                                {getHabitLabel(type)}
                            </motion.div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
