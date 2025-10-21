import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../Styles/Calendar.css'; 

function CalendarC() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log("Selected date:", date);

  };

  return (
    <div className="calendar-container">
      <h3>Calendar</h3>
      <Calendar onChange={handleDateChange} value={selectedDate} />
    </div>
  );
}

export default CalendarC;
