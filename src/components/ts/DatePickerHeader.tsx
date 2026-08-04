import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
];

export default function DatePickerHeader({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
}: {
    date: Date;
    changeYear: (year: number) => void;
    changeMonth: (month: number) => void;
    decreaseMonth: () => void;
    increaseMonth: () => void;
}) {
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    const years = Array.from(
        { length: 100 },
        (_, i) => new Date().getFullYear() - i
    );

    return (
        <div className="datePickerHeader">
            <button onClick={decreaseMonth}>
                <CaretLeft size={18} />
            </button>

            <div className="datePickerSelects">
                <div className="datePickerDropdown">
                    <button
                        type="button"
                        onClick={() => {
                            setMonthOpen(!monthOpen);
                            setYearOpen(false);
                        }}
                    >
                        {months[date.getMonth()]}
                    </button>

                    {monthOpen && (
                        <div className="datePickerDropdownMenu">
                            {months.map((month, index) => (
                                <div
                                    key={month}
                                    className="datePickerDropdownItem"
                                    onClick={() => {
                                        changeMonth(index);
                                        setMonthOpen(false);
                                    }}
                                >
                                    {month}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="datePickerDropdown">
                    <button
                        type="button"
                        onClick={() => {
                            setYearOpen(!yearOpen);
                            setMonthOpen(false);
                        }}
                    >
                        {date.getFullYear()}
                    </button>

                    {yearOpen && (
                        <div className="datePickerDropdownMenu">
                            {years.map((year) => (
                                <div
                                    key={year}
                                    className="datePickerDropdownItem"
                                    onClick={() => {
                                        changeYear(year);
                                        setYearOpen(false);
                                    }}
                                >
                                    {year}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button onClick={increaseMonth}>
                <CaretRight size={18} />
            </button>
        </div>
    );
}