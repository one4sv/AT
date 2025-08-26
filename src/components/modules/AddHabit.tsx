import { useState, useEffect } from "react"
import "../../scss/addHabit.scss"
import { forwardRef, useRef } from "react"
import SelectList from "../ts/SelectList"
import { SquareCheck, Square } from "lucide-react"
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios"
import { useBlackout } from "../hooks/BlackoutHook"
import { useNote } from "../hooks/NoteHook"
import CalendarInput from "../ts/CalendarInput"
import { useHabits } from "../hooks/HabitsHook"
import TagSelector from "../ts/TagSelector"
import DayChanger from "../ts/dayChanger"
import { initialChosenDays } from "../ts/initialChosenDays"

const AddHabit = forwardRef<HTMLDivElement>((_, ref) => {
    const { refetchHabits } = useHabits()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()

    const [ name, setName ] = useState<string>("")
    const [ desc, setDescription ] = useState<string>("")
    const [ selectedperiodicity, setSelectedperiodicity ] = useState<string | number | undefined>()
    const [ checkedPresent, setCheckedPresent ] = useState<boolean>(false)
    const [ startDate, setStartDate ] = useState<Date | null>(null)
    const [ endDate, setEndDate ] = useState<Date | null>(null)
    const [startTime, setStartTime] = useState<string>("")
    const [endTime, setEndTime] = useState<string>("") 
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    const [chosenDays, setChosenDays] = useState(initialChosenDays)

    const periodicityArr = [
        { label: "каждый день", value: "everyday" },
        { label: "несколько дней в неделю", value: "weekly" },
        { label: "иногда", value: "sometimes" }
    ];

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const timeInputPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    const formatTimeInput = (val: string) => {
        const digits = val.replace(/\D/g, "");
        if (digits.length >= 3) {
            let hh = digits.slice(0, 2);
            let mm = digits.slice(2, 4);

            if (parseInt(hh) > 23) hh = "23";
            if (parseInt(mm) > 59) mm = "59";

            return hh + ":" + mm;
        }
        return digits;
    };

    const clearInputPer = () => {
        setChosenDays(initialChosenDays);
    }

    const handleStartDateChange = (date: Date | null) => {
        setStartDate(date ?? null);
    };
    const handleEndDateChange = (date: Date | null) => {
        setEndDate(date ?? null);
    };

    useEffect(() => {
        if (startDate && endDate && endDate < startDate) {
            setEndDate(null)
        }
    }, [startDate, endDate])

    const fetchAddHabit = async () => {
        const chosenValues = chosenDays.filter(d => d.chosen).map(d => d.value);

        const payload = {
            name,
            desc,
            startDate:startDate,
            endDate:checkedPresent ? null : endDate,
            now:checkedPresent ? checkedPresent : null,
            periodicity: selectedperiodicity,
            chosenDays:chosenValues ? chosenValues : null,
            start_time:startTime||null,
            end_time:endTime||null,
            tag: selectedTag || null
        };
        if (!name || !startDate || (!endDate && !checkedPresent) || !selectedperiodicity || (selectedperiodicity === "weekly" && !chosenDays)) {
            showNotification("error", "Заполните все поля")
            return
        }
        if (startTime && !timeInputPattern.test(startTime)) {
            showNotification("error", "Неверный формат времени начала");
            return;
        }
        if (endTime && !timeInputPattern.test(endTime)) {
            showNotification("error", "Неверный формат времени конца");
            return;
        }
        if (!startTime && endTime) {
            showNotification("error", "Заполните время начала");
            return;
        }
        console.log(payload)
        try {
            const res = await axios.post("http://localhost:3001/addhabit", payload, {withCredentials:true});
            if (res.data.success) {
                setBlackout({ seted: false, module: undefined });
                showNotification("success", "Успешно добавлено")
            }
            console.log("Успешно отправлено:", res.data);
            refetchHabits()
        } catch (err) {
            console.error("Ошибка при отправке:", err);
            showNotification("error", "Не удалось добавить");
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
        <div className="addHabitDiv" ref={ref}>
            <div className="addHabitWrapper">
                <label htmlFor="inputName">Название</label>
                <input type="text" id="inputName" className="inputName addHabitInput" maxLength={40} onChange={(e)=>setName(e.currentTarget.value)}/>
                <span>{name.length}/40</span>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="inputDesc">Описание</label>
                <textarea id="inputDesc" className="inputDesc addHabitInput" maxLength={120} ref={textAreaRef}onChange={(e) => setDescription(e.currentTarget.value)}></textarea>
                <span>{desc.length}/120</span>
            </div>            
            <div className="addHabitWrapper">
                <TagSelector selectedTag={selectedTag} setSelectedTag={setSelectedTag}/>
            </div>
            <div className="addHabitTimeWrapper">
                <div className="addHabitWrapper">
                    <label htmlFor="inputStartDate">дата начала</label>
                    <CalendarInput
                        id="inputStartDate"
                        value={startDate}
                        onChange={handleStartDateChange}
                        maxDate={new Date()}
                        minDate={undefined}
                        className="addHabitInput"
                    />
                </div>
                <div className="addHabitWrapper">
                    <label htmlFor="inputEndDate">дата окончания</label>
                    {checkedPresent ? (
                        <input type="text" className="addHabitInput" readOnly value={"По настоящее время"}/>
                    ) : (<CalendarInput
                        id="inputEndDate"
                        value={endDate}
                        onChange={handleEndDateChange}
                        maxDate={new Date()}
                        minDate={startDate || undefined}
                        className="addHabitInput"
                    />)}
                </div>
            </div>
            <div className="addHabbitCheckBox" onClick={() => setCheckedPresent(!checkedPresent)}>
                {checkedPresent ? (
                    <SquareCheck id="checkBoxPresent" className="active"/>
                ) : (
                    <Square id="checkBoxPresent" className="notactive"/>
                )}
                <label htmlFor="chekBoxPresent">
                    по настоящее время
                </label>
            </div>
            <div className="inpWrapperAddHabit">
                <label htmlFor="addHabitSL">Переодичность</label>
                <SelectList id="addHabitSL" placeholder="" className="addHabitSL" chevron={true} arr={periodicityArr} hide={true} prop={setSelectedperiodicity} readOnly={true} extraFunction={clearInputPer} selected={undefined}/>
            </div>
            {selectedperiodicity === "weekly" && (
                <DayChanger toggleDay={toggleDay} chosenDays={chosenDays}/>
            )}
            <div className="addHabitTimeWrapper">
                <div className="addHabitWrapper time">
                    <label htmlFor="inputStartTime">Время(начало)</label>
                    <input type="text" id="inputStartTime" className="inputStartTime addHabitInput" value={startTime} onChange={(e) => {
                        const formatted = formatTimeInput(e.target.value);
                        if (formatted.length <= 5) {
                            setStartTime(formatted);
                        }
                    }}/>
                </div>
                <div className="addHabitWrapper time">
                    <label htmlFor="inputEndTime">Время(конец)</label>
                    <input type="text" id="inputEndTime" className="inputEndTime addHabitInput" value={endTime} onChange={(e) => {
                        const formatted = formatTimeInput(e.target.value);
                        if (formatted.length <= 5) {
                            setEndTime(formatted);
                        }
                    }}/>
                </div>
            </div>
            <button className="addHabitGoal">Добавить цель</button>
            <button className="addHabitSave" onClick={fetchAddHabit}>Сохранить</button>
        </div>
    )
})

export default AddHabit
