import { useEffect, useState, useRef } from "react";
import {
  FiSend, FiSearch, FiX, FiUsers, FiMessageCircle,
  FiHash, FiTrash2
} from "react-icons/fi";

// ─── helpers ─────────────────────────────────────────────────────────────────
const myId       = () => parseInt(localStorage.getItem("userId")  || "0");
const myName     = () => localStorage.getItem("username") || "User";
const myFullName = () => localStorage.getItem("full_name") || myName();
const myRole     = () => localStorage.getItem("role") || "member";

const avatarColor = (name = "") => {
  const colors = ["#123524","#c9a96e","#356859","#8faf9f","#1d3b2f","#6b8f71","#a0785a"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");

const fmtTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (ts) => {
  const d   = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// group messages by date
const groupByDate = (msgs) => {
  const groups = {};
  msgs.forEach(m => {
    const key = new Date(m.created_at).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return groups;
};

// ─── Main Messages Component ──────────────────────────────────────────────────
function Messages() {
  const [users,        setUsers]        = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [channel,      setChannel]      = useState("general"); // "general" | userId (DM)
  const [channelLabel, setChannelLabel] = useState("# General");
  const [text,         setText]         = useState("");
  const [search,       setSearch]       = useState("");
  const [userSearch,   setUserSearch]   = useState("");
  const [showMembers,  setShowMembers]  = useState(false);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);

  // ── Load users ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then(r => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  // ── Load messages + poll every 3s ──────────────────────────────────────────
  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  const loadMessages = () => {
    const url = channel === "general"
      ? "http://localhost:5000/messages?channel=general"
      : `http://localhost:5000/messages?channel=dm&with=${channel}&me=${myId()}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  };

  // ── Scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = {
      sender_id:   myId(),
      sender_name: myFullName(),
      channel:     channel === "general" ? "general" : "dm",
      receiver_id: channel === "general" ? null : channel,
      message:     trimmed,
    };
    await fetch("http://localhost:5000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setText("");
    loadMessages();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Delete message (admin only) ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/messages/${id}`, { method: "DELETE" }).catch(() => {});
    loadMessages();
  };

  // ── Switch channel ───────────────────────────────────────────────────────────
  const switchChannel = (ch, label) => {
    setChannel(ch);
    setChannelLabel(label);
    setMessages([]);
  };

  // ── Filtered users for DM list ───────────────────────────────────────────────
  const otherUsers = users.filter(u =>
    u.id !== myId() &&
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Online indicator (simple: all loaded users shown as online) ──────────────
  const filtered = search
    ? messages.filter(m => m.message?.toLowerCase().includes(search.toLowerCase()))
    : messages;

  const grouped = groupByDate(filtered);

  return (
    <div className="msg-page">

      {/* ── SIDEBAR ── */}
      <div className="msg-sidebar">

        <div className="msg-sidebar-head">
          <h2>Messages</h2>
          <span className="msg-badge">{messages.length}</span>
        </div>

        {/* Search users */}
        <div className="msg-user-search">
          <FiSearch size={13} />
          <input
            placeholder="Search people..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>

        {/* General channel */}
        <div className="msg-section-label">Channels</div>
        <button
          className={`msg-channel-btn ${channel === "general" ? "msg-channel-active" : ""}`}
          onClick={() => switchChannel("general", "# General")}
        >
          <span className="msg-channel-hash"><FiHash size={14} /></span>
          <span>General</span>
          <span className="msg-channel-sub">Everyone</span>
        </button>

        {/* DM list */}
        <div className="msg-section-label" style={{ marginTop: 16 }}>
          Direct Messages
        </div>
        {otherUsers.map(u => (
          <button
            key={u.id}
            className={`msg-dm-btn ${channel === u.id ? "msg-channel-active" : ""}`}
            onClick={() => switchChannel(u.id, u.full_name)}
          >
            <div className="msg-dm-avatar" style={{ background: avatarColor(u.full_name) }}>
              {initials(u.full_name)}
            </div>
            <div className="msg-dm-info">
              <span className="msg-dm-name">{u.full_name}</span>
              <span className="msg-dm-role">{u.role}</span>
            </div>
            <div className="msg-online-dot"></div>
          </button>
        ))}

      </div>

      {/* ── CHAT AREA ── */}
      <div className="msg-chat">

        {/* Chat Header */}
        <div className="msg-chat-header">
          <div className="msg-chat-title">
            {channel === "general"
              ? <><FiHash size={18} /><span>General</span></>
              : <>
                  <div className="msg-header-avatar"
                    style={{ background: avatarColor(channelLabel) }}>
                    {initials(channelLabel)}
                  </div>
                  <span>{channelLabel}</span>
                </>
            }
          </div>
          <div className="msg-chat-actions">
            {/* Search in chat */}
            <div className="msg-chat-search">
              <FiSearch size={13} />
              <input
                placeholder="Search messages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <FiX size={12} onClick={() => setSearch("")} style={{ cursor: "pointer" }} />}
            </div>
            <button
              className="msg-members-btn"
              onClick={() => setShowMembers(v => !v)}
              title="Members"
            >
              <FiUsers size={16} />
              {users.length}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="msg-messages">
          {messages.length === 0 ? (
            <div className="msg-empty">
              <FiMessageCircle size={40} />
              <h3>No messages yet</h3>
              <p>Be the first to say something in {channelLabel}!</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateKey, dayMsgs]) => (
              <div key={dateKey}>
                {/* Date divider */}
                <div className="msg-date-divider">
                  <span>{fmtDate(dayMsgs[0].created_at)}</span>
                </div>

                {dayMsgs.map((m, i) => {
                  const isMe       = m.sender_id === myId();
                  const showAvatar = i === 0 || dayMsgs[i-1].sender_id !== m.sender_id;
                  return (
                    <div
                      key={m.id}
                      className={`msg-row ${isMe ? "msg-row-me" : ""}`}
                    >
                      {/* Avatar — only show on first of group */}
                      {!isMe && (
                        <div className="msg-avatar-col">
                          {showAvatar ? (
                            <div className="msg-avatar"
                              style={{ background: avatarColor(m.sender_name) }}>
                              {initials(m.sender_name)}
                            </div>
                          ) : (
                            <div className="msg-avatar-spacer" />
                          )}
                        </div>
                      )}

                      <div className="msg-bubble-wrap">
                        {showAvatar && !isMe && (
                          <div className="msg-sender-name">
                            {m.sender_name}
                            <span className="msg-time">{fmtTime(m.created_at)}</span>
                          </div>
                        )}
                        <div className={`msg-bubble ${isMe ? "msg-bubble-me" : "msg-bubble-them"}`}>
                          {m.message}
                          {isMe && (
                            <span className="msg-bubble-time">{fmtTime(m.created_at)}</span>
                          )}
                        </div>
                      </div>

                      {/* Delete (admin or own message) */}
                      {(myRole() === "admin" || isMe) && (
                        <button
                          className="msg-delete-btn"
                          onClick={() => handleDelete(m.id)}
                          title="Delete"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="msg-input-wrap">
          <textarea
            className="msg-input"
            placeholder={`Message ${channelLabel}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`msg-send-btn ${text.trim() ? "msg-send-active" : ""}`}
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <FiSend size={16} />
          </button>
        </div>

      </div>

      {/* ── MEMBERS PANEL ── */}
      {showMembers && (
        <div className="msg-members-panel">
          <div className="msg-members-head">
            <h3>Members ({users.length})</h3>
            <button onClick={() => setShowMembers(false)}><FiX size={16} /></button>
          </div>
          {users.map(u => (
            <div className="msg-member-item" key={u.id}>
              <div className="msg-avatar" style={{ background: avatarColor(u.full_name), width:34, height:34, fontSize:12 }}>
                {initials(u.full_name)}
              </div>
              <div>
                <strong>{u.full_name}</strong>
                <span>{u.role}</span>
              </div>
              <div className="msg-online-dot" style={{ marginLeft: "auto" }}></div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Messages;