import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Styles/Calendar.css'; 

function CalendarC({ value, onChange, showHeader = true, minDate, markedDates = [] }) {
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const marks = React.useMemo(() => {
    try {
      return new Set(
        (markedDates || []).map((d) => {
          if (d instanceof Date) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          }
          // assume already Y-M-D
          return String(d).slice(0, 10);
        })
      );
    } catch {
      return new Set();
    }
  }, [markedDates]);

  useEffect(() => {
    if (value && value.toDateString() !== selectedDate.toDateString()) {
      setSelectedDate(value);
    }
  }, [value]); 

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onChange?.(date);
    console.log('Selected date:', date);
  };

  return (
    <div className="calendar-container">
      {showHeader && <h3>Calendar</h3>}
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        minDate={minDate}
        tileClassName={({ date, view }) => {
          if (view !== 'month') return null;
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${d}`;
          return marks.has(key) ? 'has-appt' : null;
        }}
      />
    </div>
  );
}

export default CalendarC;
