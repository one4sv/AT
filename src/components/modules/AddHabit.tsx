import { useTranslation } from "react-i18next";
import { XIcon } from "@phosphor-icons/react";
import TA from "../ts/TA";
import { useState, useEffect } from "react"
import "../../scss/modules/addHabit.scss"
import { forwardRef, useRef } from "react"
import SelectList from "../ts/SelectList"
import "react-datepicker/dist/react-datepicker.css";
import { useBlackout } from "../hooks/BlackoutHook"
import { useNote } from "../hooks/NoteHook"
import { useHabits } from "../hooks/HabitsHook"
import TagSelector from "../ts/TagSelector"
import DayChanger from "../ts/DayChanger"
import { initialChosenDays } from "../ts/initialChosenDays"
import { isMobile } from "react-device-detect"

import { api } from "../ts/api";

const AddHabit = forwardRef<HTMLDivElement>((_, ref) => {
    const { t } = useTranslation("common");
    const { refetchHabits } = useHabits()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()

    const [ name, setName ] = useState<string>("")
    const [ desc, setDescription ] = useState<string>("")
    const [ selectedperiodicity, setSelectedperiodicity ] = useState<string | number | undefined>()
    const [ startTime, setStartTime ] = useState<string>("")
    const [ endTime, setEndTime ] = useState<string>("") 
    const [ selectedTag, setSelectedTag ] = useState<string | undefined>()
    const [ cycle_days_active, setCycleDaysActive ] = useState("");
    const [ cycle_days_rest, setCycleDaysRest ] = useState("");
    const [ chosenDays, setChosenDays ] = useState(initialChosenDays)

    const periodicityArr = [
        { label: t("habitUi.period.everyday"), value: "everyday" },
        { label: t("habitUi.period.weekly"), value: "weekly" },
        { label: t("habitUi.period.cycle"), value: "cycle"},
        { label: t("habitUi.period.sometimes"), value: "sometimes" },
    ];

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const timeInputPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    const clearInputPer = () => {
        setChosenDays(initialChosenDays);
    }

    const fetchAddHabit = async () => {
        const chosenValues = chosenDays.filter(d => d.chosen).map(d => d.value);

        const payload = {
            name,
            desc,
            startDate:new Date(),
            endDate:null,
            now:true,
            periodicity: selectedperiodicity,
            chosenDays:chosenValues.length ? chosenValues : null,
            start_time:startTime||null,
            end_time:endTime||null,
            tag: selectedTag || null,
            cycle_days_active:Number(cycle_days_active) || null,
            cycle_days_rest:Number(cycle_days_rest) || null,
        };
        if (!name || !selectedperiodicity || (selectedperiodicity === "weekly" && !chosenDays)) {
            showNotification("error", t("habitUi.fillFields"))
            return
        }
        if (startTime && !timeInputPattern.test(startTime)) {
            showNotification("error", t("habitUi.invalidStart"));
            return;
        }
        if (endTime && !timeInputPattern.test(endTime)) {
            showNotification("error", t("habitUi.invalidEnd"));
            return;
        }
        if (
            selectedperiodicity === "cycle" && (!cycle_days_active || !cycle_days_rest)
        ) {
            showNotification("error", t("habitUi.enterCycle"));
            return;
        }
        try {
            const res = await api.post(`addhabit`, payload);
            if (res.data.success) {
                setBlackout({ seted: false, module: undefined });
                showNotification("success", t("habitUi.added"))
            }
            refetchHabits()
        } catch (err) {
            console.error("Ошибка при отправке:", err);
            showNotification("error", t("habitUi.addFailed"));
        }
    };
    function toggleDay(value: number) {
        setChosenDays(prev =>
            prev.map(day =>
                day.value === value ? { ...day, chosen: !day.chosen } : day
            )
        );
    }

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto"; // сброс
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px"; // выставляем по контенту
        }
    }, [desc]);

    return (
        <div className={`addHabitDiv ${isMobile ? "mobile" : ""}`} ref={ref}>
            <div className="addHabitWrapper">
                <label htmlFor="inputName">{t("habitUi.name")}</label>
                <input type="text" id="inputName" className="inputName addHabitInput" maxLength={40} onChange={(e)=>setName(e.currentTarget.value)}/>
                <span>{name.length}/40</span>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="inputDesc">{t("habitUi.description")}</label>
                <TA id="inputDesc" className="inputDesc addHabitInput" maxLength={120} taRef={textAreaRef}onChange={(e) => setDescription(e.currentTarget.value)}></TA>
                <span>{desc.length}/120</span>
            </div>            
            <div className="addHabitWrapper">
                <TagSelector selectedTag={selectedTag} setSelectedTag={setSelectedTag}/>
            </div>
            <div className="inpWrapperAddHabit">
                <label htmlFor="addHabitSL">{t("habitUi.periodicity")}</label>
                <SelectList id="addHabitSL" placeholder="" className="redHabitSL" chevron={true} arr={periodicityArr} hide={true} prop={setSelectedperiodicity} readOnly={true} extraFunction={clearInputPer} selected={undefined}/>
                <div className="settingHint">
                    {selectedperiodicity && t(`habitUi.periodHint.${selectedperiodicity}`)}
                </div>
            </div>
            {selectedperiodicity === "cycle" && (
                <div className="addHabitTimeWrapper">
                    <div className="addHabitWrapper time">
                        <label htmlFor="inputActive">{t("habitUi.activeDays")}</label>
                        <input
                            type="number"
                            id="inputActive"
                            className="addHabitInput"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => setCycleDaysActive(e.target.value)}
                            value={cycle_days_active ?? undefined}
                        />
                    </div>

                    <div className="addHabitWrapper time">
                        <label htmlFor="inputRest">{t("habitUi.restDays")}</label>
                        <input
                            type="number"
                            id="inputRest"
                            className="addHabitInput"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => setCycleDaysRest(e.target.value)}
                            value={cycle_days_rest ?? undefined}
                        />
                    </div>
                </div>
            )}
            {selectedperiodicity === "weekly" && (
                <DayChanger toggleDay={toggleDay} chosenDays={chosenDays}/>
            )}
            <div className="addHabitTimeWrapper timeInputs">
                <div className="addHabitWrapper time">
                    <label htmlFor="inputStartTime">{t("habitUi.startTime")}</label>
                    <div className="timeInputShell">
                        <input type="time" id="inputStartTime" className="inputStartTime addHabitInput" value={startTime}
                            onInput={e => setStartTime(e.currentTarget.value)}
                            onChange={e => setStartTime(e.target.value)}
                            onBlur={e => setStartTime(e.currentTarget.value)}/>
                        {startTime && <button type="button" className="timeInputClear" aria-label={t("habitUi.clearTime")}
                            onClick={() => setStartTime("")}><XIcon size={18}/></button>}
                    </div>
                </div>
                <div className="addHabitWrapper time">
                    <label htmlFor="inputEndTime">{t("habitUi.endTime")}</label>
                    <div className="timeInputShell">
                        <input type="time" id="inputEndTime" className="inputEndTime addHabitInput" value={endTime}
                            onInput={e => setEndTime(e.currentTarget.value)}
                            onChange={e => setEndTime(e.target.value)}
                            onBlur={e => setEndTime(e.currentTarget.value)}/>
                        {endTime && <button type="button" className="timeInputClear" aria-label={t("habitUi.clearTime")}
                            onClick={() => setEndTime("")}><XIcon size={18}/></button>}
                    </div>
                </div>
            </div>
            <button className="addHabitGoal">{t("habitUi.addGoal")}</button>
            <button className="addHabitSave" onClick={fetchAddHabit}>{t("habitUi.save")}</button>
        </div>
    )
})

export default AddHabit
