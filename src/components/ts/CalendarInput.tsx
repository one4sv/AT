import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CalendarInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  minDate?: Date;
  placeholder?: string;
  className?:string
  id?:string;
  readOnly?:boolean
}

export default function CalendarInput({
  value,
  onChange,
  maxDate,
  minDate,
  placeholder,
  className,
  id,
  readOnly
}: CalendarInputProps) {
  const handleDateChange = (date: Date | null) => {
    onChange(date);
  };

  const handleChangeRaw = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    if (!inputValue) return;

    let digits = inputValue.replace(/\D/g, '');

    if (digits.length > 2) digits = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) digits = digits.slice(0, 5) + '.' + digits.slice(5, 9);

    digits = digits.slice(0, 10);
    e.currentTarget.value = digits;

    if (digits.length === 10) {
      const [day, month, year] = digits.split('.');
      const dateObj = new Date(`${year}-${month}-${day}`);
      onChange(!isNaN(dateObj.getTime()) ? dateObj : null);
    } else {
      onChange(null);
    }
  };

  return (
    <DatePicker
      id={id}
      className={className}
      selected={value}
      onChange={handleDateChange}
      readOnly={readOnly ?? false}
      onChangeRaw={handleChangeRaw}
      dateFormat="dd.MM.yyyy"
      maxDate={maxDate}
      minDate={minDate}
      placeholderText={placeholder}
    />
  );
}
