import React, { useState, useEffect } from "react";
import "./CustomerLogs.css";
import { FiPlus, FiChevronDown, FiClock, FiEdit2, FiSave, FiX } from "react-icons/fi";

const API_BASE = "http://localhost:5000"; // Assuming backend is on 5000

export default function CustomerLogs() {
  const [allBuyers, setAllBuyers] = useState([]);
  const [loggedBuyers, setLoggedBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogNotes, setNewLogNotes] = useState("");
  
  const [editingLogId, setEditingLogId] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    fetchLoggedBuyers();
    fetchAllBuyers();
  }, []);

  const fetchLoggedBuyers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-logs/buyers`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setLoggedBuyers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBuyers = async () => {
    try {
      const res = await fetch(`${API_BASE}/buyers`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setAllBuyers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogsForBuyer = async (buyerId) => {
    try {
      const res = await fetch(`${API_BASE}/customer-logs/${buyerId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectBuyer = (buyer) => {
    setSelectedBuyer(buyer);
    fetchLogsForBuyer(buyer.id);
  };

  const handleAddLog = async () => {
    if (!newLogNotes.trim() || !selectedBuyer) return;
    try {
      const res = await fetch(`${API_BASE}/customer-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ buyer_id: selectedBuyer.id, notes: newLogNotes })
      });
      const newLog = await res.json();
      setLogs([newLog, ...logs]);
      setNewLogNotes("");
      
      // Update logged buyers list in case this was their first log
      if (!loggedBuyers.find(b => b.id === selectedBuyer.id)) {
        fetchLoggedBuyers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (logId) => {
    if (!editNotes.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/customer-logs/${logId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ notes: editNotes })
      });
      const updatedLog = await res.json();
      setLogs(logs.map(log => log.id === logId ? updatedLog : log));
      setEditingLogId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="cl-page">
      <div className="cl-header">
        <div>
          <h1 className="cl-title">Customer Logs</h1>
          <p className="cl-subtitle">Track and manage conversations with your buyers</p>
        </div>
        <button className="cl-add-btn" onClick={() => setShowAddModal(true)}>
          <FiPlus size={16} /> New Buyer Log
        </button>
      </div>

      <div className="cl-layout">
        {/* Sidebar: Buyer Selection */}
        <div className="cl-sidebar">
          <h3 className="cl-sidebar-title">Active Conversations</h3>
          <div className="cl-buyer-list">
            {loggedBuyers.length === 0 ? (
              <div className="cl-empty-state">No active logs. Click 'New Buyer Log' to start.</div>
            ) : (
              loggedBuyers.map(b => (
                <div 
                  key={b.id} 
                  className={`cl-buyer-item ${selectedBuyer?.id === b.id ? 'active' : ''}`}
                  onClick={() => handleSelectBuyer(b)}
                >
                  <div className="cl-buyer-name">{b.buyer_name || 'Unknown Buyer'}</div>
                  <div className="cl-buyer-company">{b.company_name || 'No Company'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Timeline & Editor */}
        <div className="cl-main">
          {selectedBuyer ? (
            <div className="cl-timeline-container">
              <div className="cl-timeline-header">
                <h2>{selectedBuyer.buyer_name || 'Unknown Buyer'}</h2>
                <span>{selectedBuyer.company_name}</span>
              </div>
              
              <div className="cl-editor-card">
                <textarea 
                  className="cl-textarea" 
                  placeholder="Type your notes or conversation summary here..."
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                ></textarea>
                <div className="cl-editor-footer">
                  <button className="cl-submit-btn" onClick={handleAddLog}>Add Note</button>
                </div>
              </div>

              <div className="cl-timeline">
                {logs.length === 0 ? (
                  <div className="cl-empty-timeline">No notes added yet for this buyer.</div>
                ) : (
                  logs.map(log => {
                    const isEdited = log.updated_at && log.created_at && log.updated_at !== log.created_at;
                    const isEditing = editingLogId === log.id;
                    
                    return (
                      <div key={log.id} className="cl-log-card">
                        <div className="cl-log-header">
                          <div className="cl-log-meta">
                            <FiClock size={14} /> 
                            <span>{formatDate(log.created_at)}</span>
                            {isEdited && <span className="cl-edited-badge">(Edited: {formatDate(log.updated_at)})</span>}
                          </div>
                          {!isEditing && (
                            <button className="cl-edit-icon" onClick={() => { setEditingLogId(log.id); setEditNotes(log.notes); }}>
                              <FiEdit2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="cl-edit-mode">
                            <textarea 
                              className="cl-textarea edit-mode" 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                            />
                            <div className="cl-edit-actions">
                              <button className="cl-cancel-btn" onClick={() => setEditingLogId(null)}>Cancel</button>
                              <button className="cl-save-btn" onClick={() => handleSaveEdit(log.id)}>
                                <FiSave size={14} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="cl-log-content">{log.notes}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="cl-placeholder">
              <div className="cl-placeholder-icon">💬</div>
              <h2>Select a buyer</h2>
              <p>Choose a buyer from the list to view their logs or add a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Buyer Modal */}
      {showAddModal && (
        <div className="cl-modal-overlay">
          <div className="cl-modal">
            <div className="cl-modal-header">
              <h2>Select Buyer for New Log</h2>
              <button onClick={() => setShowAddModal(false)}><FiX size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <select 
                className="cl-select"
                onChange={(e) => {
                  const b = allBuyers.find(x => x.id === parseInt(e.target.value));
                  if (b) {
                    handleSelectBuyer(b);
                    setShowAddModal(false);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Select from all buyers --</option>
                {allBuyers.map(b => (
                  <option key={b.id} value={b.id}>{b.buyer_name} ({b.company_name})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
