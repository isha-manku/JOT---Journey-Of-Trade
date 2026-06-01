import { useState, useEffect, useCallback } from "react";
import {
  FiChevronLeft, FiChevronRight, FiPlus, FiX,
  FiEdit2, FiTrash2, FiCalendar,
  FiRefreshCw, FiFilter, FiCheck
} from "react-icons/fi";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const EVENT_TYPES = [
  { label: "Meeting",   color: "#123524", dot: "#123524" },
  { label: "Follow-up", color: "#c9a96e", dot: "#c9a96e" },
  { label: "Task",      color: "#4ade80", dot: "#16a34a" },
  { label: "Review",    color: "#a16207", dot: "#ca8a04" },
  { label: "Reminder",  color: "#818cf8", dot: "#6366f1" },
  { label: "Deadline",  color: "#ef4444", dot: "#dc2626" },
];

const TYPE_COLORS = Object.fromEntries(EVENT_TYPES.map(t => [t.label, t]));

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const toKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const fmtDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const fmtMini = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({ viewYear, viewMonth, selectedDate, onSelect }) {
  const [y, setY] = useState(viewYear);
  const [m, setM] = useState(viewMonth);

  useEffect(() => { setY(viewYear); setM(viewMonth); }, [viewYear, viewMonth]);

  const prev = () => { if (m === 0) { setM(11); setY(y - 1); } else setM(m - 1); };
  const next = () => { if (m === 11) { setM(0); setY(y + 1); } else setM(m + 1); };

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = toKey(TODAY);

  return (
    <div className="cal-mini">
      <div className="cal-mini-head">
        <button className="cal-mini-nav" onClick={prev}><FiChevronLeft size={13} /></button>
        <span>{MONTHS[m]} {y}</span>
        <button className="cal-mini-nav" onClick={next}><FiChevronRight size={13} /></button>
      </div>
      <div className="cal-mini-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="cal-mini-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const key = toKey(new Date(y, m, day));
          const isToday = key === todayKey;
          const isSel = key === selectedDate;
          return (
            <button
              key={key}
              className={`cal-mini-day ${isToday ? "mini-today" : ""} ${isSel ? "mini-selected" : ""}`}
              onClick={() => onSelect(key)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────

function EventModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || {
      title: "", description: "", date: toKey(TODAY),
      time: "10:00", type: "Meeting", user: "",
    }
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { alert("Please enter a title"); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box cal-modal">
        <div className="modal-header">
          <h2>{initial?.id ? "Edit Event" : "Add New Event"}</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>

        <div className="cal-form">
          <div className="cal-form-row">
            <label>Event Title *</label>
            <input placeholder="e.g. Buyer Meeting" value={form.title}
              onChange={e => set("title", e.target.value)} />
          </div>

          <div className="cal-form-2col">
            <div className="cal-form-row">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="cal-form-row">
              <label>Time</label>
              <input type="time" value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
          </div>

          <div className="cal-form-2col">
            <div className="cal-form-row">
              <label>Event Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t.label}>{t.label}</option>)}
              </select>
            </div>
            <div className="cal-form-row">
              <label>Person / Company</label>
              <input placeholder="e.g. Isha Traders" value={form.user}
                onChange={e => set("user", e.target.value)} />
            </div>
          </div>

          <div className="cal-form-row">
            <label>Description</label>
            <textarea placeholder="Optional notes..." value={form.description}
              onChange={e => set("description", e.target.value)} rows={3} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="jot-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>
            <FiCheck size={14} /> {initial?.id ? "Update Event" : "Add Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── All Events Modal ─────────────────────────────────────────────────────────

function AllEventsModal({ events, todayKey, onClose, onEdit, onDelete }) {
  const allUpcoming = [...events]
    .filter(e => e.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 620 }}>

        <div className="modal-header">
          <h2>All Upcoming Events ({allUpcoming.length})</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        {allUpcoming.length === 0 ? (
          <p className="cal-empty" style={{ padding: "30px 0" }}>No upcoming events</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
            {allUpcoming.map(ev => {
              const tc = TYPE_COLORS[ev.type] || TYPE_COLORS["Meeting"];
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "#f9f7f2",
                    border: "1px solid #f0ede6",
                  }}
                >
                  {/* colour dot */}
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: tc.dot, flexShrink: 0,
                  }} />

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 14, color: "#0e2318", display: "block", marginBottom: 2 }}>
                      {ev.title}
                    </strong>
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {fmtMini(ev.date)} · {ev.time}
                      {ev.user ? ` · ${ev.user}` : ""}
                    </span>
                    {ev.description && (
                      <p style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* type badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 20,
                    background: "#f0f7f3", color: "#0e2318",
                    border: "1px solid #c9a96e",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {ev.type}
                  </span>

                  {/* actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      className="jot-icon-btn"
                      title="Edit"
                      onClick={() => { onEdit(ev); onClose(); }}
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      className="jot-icon-btn"
                      title="Delete"
                      style={{ color: "#dc2626" }}
                      onClick={() => onDelete(ev.id)}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Main CalendarPage ────────────────────────────────────────────────────────

function CalendarPage() {
  const [viewYear,     setViewYear]     = useState(TODAY.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(TODAY.getMonth());
  const [viewMode,     setViewMode]     = useState("Month");
  const [selected,     setSelected]     = useState(toKey(TODAY));
  const [events,       setEvents]       = useState([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editEvent,    setEditEvent]    = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);   // ← NEW
  const [filterType,   setFilterType]   = useState("All Event Types");
  const [filterUser,   setFilterUser]   = useState("All Users");

  // ── Load events ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then(r => r.json())
      .then(data => {
        const normalized = data.map(e => ({
          id:          e.id,
          title:       e.title || e.name || e.text || "",
          description: e.description || e.notes || "",
          date:        e.date ? e.date.slice(0, 10) : (e.event_date ? e.event_date.slice(0, 10) : ""),
          time:        e.time || "00:00",
          type:        e.type || "Meeting",
          user:        e.user || e.person || "",
        }));
        setEvents(normalized);
      })
      .catch(() => {
        const saved = JSON.parse(localStorage.getItem("crmEvents") || "[]");
        const migrated = saved.map(e => ({
          id:          e.id,
          title:       e.text || e.title || "",
          description: e.description || "",
          date:        e.date ? toKey(new Date(e.date)) : "",
          time:        e.time || "00:00",
          type:        e.type || "Meeting",
          user:        e.user || "",
        }));
        setEvents(migrated);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("crmEvents", JSON.stringify(events));
  }, [events]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (form) => {
    if (form.id) {
      try {
        await fetch(`http://localhost:5000/events/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } catch {}
      setEvents(prev => prev.map(e => e.id === form.id ? { ...e, ...form } : e));
    } else {
      const newEv = { ...form, id: Date.now() };
      try {
        const res = await fetch("http://localhost:5000/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEv),
        });
        const saved = await res.json().catch(() => null);
        if (saved?.id) newEv.id = saved.id;
      } catch {}
      setEvents(prev => [...prev, newEv]);
    }
    setShowModal(false);
    setEditEvent(null);
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await fetch(`http://localhost:5000/events/${id}`, { method: "DELETE" });
    } catch {}
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(TODAY.getFullYear());
    setViewMonth(TODAY.getMonth());
    setSelected(toKey(TODAY));
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays   = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--)
    cells.push({ day: prevMonthDays - i, current: false, key: toKey(new Date(viewYear, viewMonth - 1, prevMonthDays - i)) });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true, key: toKey(new Date(viewYear, viewMonth, d)) });
  let next = 1;
  while (cells.length % 7 !== 0)
    cells.push({ day: next++, current: false, key: toKey(new Date(viewYear, viewMonth + 1, next - 1)) });

  // ── Filtered events ───────────────────────────────────────────────────────
  const filteredEvents = events.filter(e => {
    if (filterType !== "All Event Types" && e.type !== filterType) return false;
    if (filterUser !== "All Users" && e.user !== filterUser) return false;
    return true;
  });

  const eventsOnDay = (key) => filteredEvents.filter(e => e.date === key);

  const todayKey = toKey(TODAY);
  const upcoming = [...events]
    .filter(e => e.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const allUsers = ["All Users", ...new Set(events.map(e => e.user).filter(Boolean))];

  const openAdd = (dateKey) => {
    setEditEvent({ date: dateKey || selected, time: "10:00", type: "Meeting", title: "", description: "", user: "" });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditEvent({ ...ev });
    setShowModal(true);
  };

  return (
    <div className="cal-page">

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <EventModal
          initial={editEvent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
        />
      )}

      {/* ── ALL EVENTS MODAL ── */}
      {showAllEvents && (
        <AllEventsModal
          events={events}
          todayKey={todayKey}
          onClose={() => setShowAllEvents(false)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── PAGE HEADER ── */}
      <div className="cal-page-header">
        <div>
          <h1 className="cal-page-title">Calendar</h1>
          <p className="cal-page-sub">Manage your meetings, follow-ups and important events.</p>
        </div>
      </div>

      <div className="cal-layout">

        {/* ── MAIN AREA ── */}
        <div className="cal-main">

          {/* Toolbar */}
          <div className="cal-toolbar">
            <div className="cal-toolbar-left">
              <button className="cal-today-btn" onClick={goToday}>Today</button>
              <button className="cal-nav-btn" onClick={prevMonth}><FiChevronLeft size={16} /></button>
              <button className="cal-nav-btn" onClick={nextMonth}><FiChevronRight size={16} /></button>
              <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            </div>
            <div className="cal-toolbar-right">
              {["Month", "Week", "Day"].map(m => (
                <button
                  key={m}
                  className={`cal-view-btn ${viewMode === m ? "cal-view-active" : ""}`}
                  onClick={() => setViewMode(m)}
                >
                  {m}
                </button>
              ))}
              <button className="cal-view-btn" onClick={() => openAdd(selected)} title="Add Event">
                <FiCalendar size={14} />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="cal-grid-wrap">
            <div className="cal-dow-row">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="cal-dow">{d}</div>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((cell, i) => {
                const isToday   = cell.key === todayKey;
                const isSel     = cell.key === selected;
                const dayEvents = eventsOnDay(cell.key);
                return (
                  <div
                    key={i}
                    className={`cal-cell ${!cell.current ? "cal-cell-dim" : ""} ${isSel ? "cal-cell-sel" : ""}`}
                    onClick={() => setSelected(cell.key)}
                    onDoubleClick={() => openAdd(cell.key)}
                  >
                    <div className={`cal-cell-num ${isToday ? "cal-today-num" : ""}`}>
                      {cell.day}
                    </div>
                    <div className="cal-cell-events">
                      {dayEvents.slice(0, 2).map(ev => {
                        const tc = TYPE_COLORS[ev.type] || TYPE_COLORS["Meeting"];
                        return (
                          <div
                            key={ev.id}
                            className="cal-ev-chip"
                            style={{ borderLeftColor: tc.dot }}
                            onClick={e => { e.stopPropagation(); openEdit(ev); }}
                            title={ev.title}
                          >
                            {ev.time && <span className="cal-ev-time">{ev.time}</span>}
                            <span className="cal-ev-title">{ev.title}</span>
                            {ev.user && <span className="cal-ev-user">({ev.user})</span>}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="cal-ev-more">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="cal-legend">
            {EVENT_TYPES.map(t => (
              <div key={t.label} className="cal-legend-item">
                <span className="cal-legend-dot" style={{ background: t.dot }}></span>
                {t.label}
              </div>
            ))}
          </div>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="cal-right">

          <MiniCalendar
            viewYear={viewYear} viewMonth={viewMonth}
            selectedDate={selected}
            onSelect={key => setSelected(key)}
          />

          {/* Upcoming Events */}
          <div className="cal-panel-card">
            <div className="cal-panel-head">
              <h3>Upcoming Events</h3>
              {/* ← FIXED: now opens all-events list, not add form */}
              <button className="cal-text-btn" onClick={() => setShowAllEvents(true)}>
                View All
              </button>
            </div>
            {upcoming.length ? upcoming.map(ev => {
              const tc = TYPE_COLORS[ev.type] || TYPE_COLORS["Meeting"];
              return (
                <div className="cal-upcoming-item" key={ev.id}>
                  <span className="cal-upcoming-dot" style={{ background: tc.dot }}></span>
                  <div className="cal-upcoming-body">
                    <strong>{ev.title}</strong>
                    <span>{fmtMini(ev.date)} · {ev.time}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="cal-empty">No upcoming events</p>
            )}
          </div>

          {/* Selected day events */}
          <div className="cal-panel-card">
            <div className="cal-panel-head">
              <h3>{fmtDisplay(selected)}</h3>
              <button className="cal-add-btn" onClick={() => openAdd(selected)}>
                <FiPlus size={13} /> Add
              </button>
            </div>
            {eventsOnDay(selected).length ? eventsOnDay(selected).map(ev => {
              const tc = TYPE_COLORS[ev.type] || TYPE_COLORS["Meeting"];
              return (
                <div className="cal-day-event" key={ev.id}>
                  <div className="cal-day-ev-left">
                    <span className="cal-day-ev-dot" style={{ background: tc.dot }}></span>
                    <div>
                      <strong>{ev.title}</strong>
                      <p>{ev.time}{ev.user ? ` · ${ev.user}` : ""}</p>
                    </div>
                  </div>
                  <div className="cal-day-ev-actions">
                    <button className="jot-icon-btn" onClick={() => openEdit(ev)}><FiEdit2 size={13} /></button>
                    <button className="jot-icon-btn jot-icon-danger" onClick={() => handleDelete(ev.id)}><FiTrash2 size={13} /></button>
                  </div>
                </div>
              );
            }) : (
              <p className="cal-empty">No events. Double-click a day to add.</p>
            )}
          </div>

          {/* Filters */}
          <div className="cal-panel-card">
            <div className="cal-panel-head">
              <h3><FiFilter size={14} /> Filters</h3>
            </div>
            <select className="cal-filter-sel" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option>All Event Types</option>
              {EVENT_TYPES.map(t => <option key={t.label}>{t.label}</option>)}
            </select>
            <select className="cal-filter-sel" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              {allUsers.map(u => <option key={u}>{u}</option>)}
            </select>
            <button className="cal-clear-btn" onClick={() => { setFilterType("All Event Types"); setFilterUser("All Users"); }}>
              <FiRefreshCw size={13} /> Clear Filters
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CalendarPage;