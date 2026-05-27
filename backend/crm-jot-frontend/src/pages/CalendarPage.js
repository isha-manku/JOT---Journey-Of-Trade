import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarPage() {

  const [date, setDate] = useState(new Date());

  const [events, setEvents] = useState([]);

  const [eventText, setEventText] = useState("");

  const [editId, setEditId] = useState(null);

  // LOAD EVENTS
  useEffect(() => {

    const savedEvents =
      JSON.parse(localStorage.getItem("crmEvents")) || [];

    setEvents(savedEvents);

  }, []);

  // SAVE EVENTS
  useEffect(() => {

    localStorage.setItem(
      "crmEvents",
      JSON.stringify(events)
    );

  }, [events]);

  // FORMAT DATE
  const formatDate = (d) => {

    return new Date(d).toLocaleDateString();

  };

  // FILTER EVENTS
  const selectedDateEvents = events.filter(
    e => e.date === formatDate(date)
  );

  // ADD EVENT
  const handleAddEvent = () => {

    if (!eventText) {
      alert("Enter event");
      return;
    }

    // UPDATE EVENT
    if (editId) {

      const updated = events.map(e =>
        e.id === editId
          ? {
              ...e,
              text: eventText
            }
          : e
      );

      setEvents(updated);

      setEditId(null);

    }

    // NEW EVENT
    else {

      const newEvent = {
        id: Date.now(),
        date: formatDate(date),
        text: eventText
      };

      setEvents([...events, newEvent]);

    }

    setEventText("");

  };

  // DELETE EVENT
  const handleDelete = (id) => {

    const filtered = events.filter(
      e => e.id !== id
    );

    setEvents(filtered);

  };

  // EDIT EVENT
  const handleEdit = (event) => {

    setEventText(event.text);

    setEditId(event.id);

  };

  return (

    <div className="calendar-page">

      <div className="calendar-card">

        <div className="calendar-header">

          <h1>
            CRM Calendar
          </h1>

          <p>
            Manage Meetings & Important Dates
          </p>

        </div>

        {/* CALENDAR */}
        <Calendar
          onChange={setDate}
          value={date}
        />

        {/* EVENT BOX */}
        <div className="event-box">

          <h3>

            Events for:

            {" "}

            {formatDate(date)}

          </h3>

          {/* INPUT */}
          <div className="event-input-box">

            <input
              type="text"
              placeholder="Add event..."
              value={eventText}
              onChange={(e) =>
                setEventText(e.target.value)
              }
            />

            <button
              onClick={handleAddEvent}
            >
              {editId
                ? "Update"
                : "Add"}
            </button>

          </div>

          {/* EVENT LIST */}
          <div className="event-list">

            {selectedDateEvents.length === 0 ? (

              <p className="no-events">
                No Events
              </p>

            ) : (

              selectedDateEvents.map(event => (

                <div
                  className="event-item"
                  key={event.id}
                >

                  <span>
                    {event.text}
                  </span>

                  <div className="event-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(event)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(event.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

export default CalendarPage;