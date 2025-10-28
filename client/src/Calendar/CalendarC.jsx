import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Styles/Calendar.css'; 

function CalendarC({ value, onChange, showHeader = true, minDate }) {
  const [selectedDate, setSelectedDate] = useState(value || new Date());

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
      <Calendar onChange={handleDateChange} value={selectedDate} minDate={minDate} />
    </div>
  );
}

export default CalendarC;
