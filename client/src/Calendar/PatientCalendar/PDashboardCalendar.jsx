import React, { useState } from "react";
import CalendarC from "../CalendarC.jsx";
import "react-calendar/dist/Calendar.css";
import "../../Styles/Calendar.css";

function PDashboardCalendar({ onDateChange, markedDates = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onDateChange(date); // just logs for now
  };

  return (
    <div className="calendar-container">
      <h3>Calendar</h3>
      <CalendarC
        value={selectedDate}
        onChange={handleDateChange}
        showHeader={false}
        markedDates={markedDates}
      />
    </div>
  );
}

export default PDashboardCalendar;
