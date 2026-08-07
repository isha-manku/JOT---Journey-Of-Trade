import React, { useState, useEffect } from "react";
import "./CustomerLogs.css";
import { FiPlus, FiClock, FiEdit2, FiSave, FiX } from "react-icons/fi";

const API_BASE = "http://localhost:5000"; // Assuming backend is on 5000

export default function CustomerLogs() {
  const [allBuyers, setAllBuyers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  
  const [loggedBuyers, setLoggedBuyers] = useState([]);
  const [loggedSellers, setLoggedSellers] = useState([]);
  
  const [selectedContact, setSelectedContact] = useState(null); // { id, name, company_name, type }
  const [logs, setLogs] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('buyer'); // 'buyer' or 'seller'
  const [newLogNotes, setNewLogNotes] = useState("");
  
  const [editingLogId, setEditingLogId] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    fetchLoggedContacts();
    fetchAllContacts();
  }, []);

  const fetchLoggedContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-logs/contacts`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setLoggedBuyers(Array.isArray(data.buyers) ? data.buyers : []);
      setLoggedSellers(Array.isArray(data.sellers) ? data.sellers : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const [resB, resS] = await Promise.all([
        fetch(`${API_BASE}/buyers`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
        fetch(`${API_BASE}/sellers`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } })
      ]);
      const buyers = await resB.json();
      const sellers = await resS.json();
      setAllBuyers(Array.isArray(buyers) ? buyers : []);
      setAllSellers(Array.isArray(sellers) ? sellers : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogsForContact = async (contact) => {
    try {
      const res = await fetch(`${API_BASE}/customer-logs/${contact.type}/${contact.id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    fetchLogsForContact(contact);
  };

  const handleAddLog = async () => {
    if (!newLogNotes.trim() || !selectedContact) return;
    try {
      const res = await fetch(`${API_BASE}/customer-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          type: selectedContact.type, 
          contact_id: selectedContact.id, 
          notes: newLogNotes,
          author_name: localStorage.getItem("username")
        })
      });
      const newLog = await res.json();
      setLogs([newLog, ...logs]);
      setNewLogNotes("");
      
      // Refresh logged contacts in case this was their first log
      fetchLoggedContacts();
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
        body: JSON.stringify({ notes: editNotes, editor_name: localStorage.getItem("username") })
      });
      const updatedLog = await res.json();
      setLogs(logs.map(log => log.id === logId ? updatedLog : log));
      setEditingLogId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await fetch(`${API_BASE}/customer-logs/${logId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      setLogs(logs.filter(log => log.id !== logId));
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
          <p className="cl-subtitle">Track and manage conversations with your buyers and sellers</p>
        </div>
        <button className="cl-add-btn" onClick={() => setShowAddModal(true)}>
          <FiPlus size={16} /> New Log
        </button>
      </div>

      <div className="cl-layout">
        {/* Sidebar: Contact Selection */}
        <div className="cl-sidebar">
          <h3 className="cl-sidebar-title">Active Conversations</h3>
          <div className="cl-buyer-list">
            {(loggedBuyers.length === 0 && loggedSellers.length === 0) ? (
              <div className="cl-empty-state">No active logs. Click 'New Log' to start.</div>
            ) : (
              <>
                {loggedBuyers.length > 0 && <div className="cl-section-label">Buyers</div>}
                {loggedBuyers.map(b => (
                  <div 
                    key={`buyer-${b.id}`} 
                    className={`cl-buyer-item ${selectedContact?.id === b.id && selectedContact?.type === 'buyer' ? 'active' : ''}`}
                    onClick={() => handleSelectContact(b)}
                  >
                    <div className="cl-buyer-name">{b.name || 'Unknown Buyer'}</div>
                    <div className="cl-buyer-company">{b.company_name || 'No Company'}</div>
                  </div>
                ))}
                
                {loggedSellers.length > 0 && <div className="cl-section-label" style={{marginTop: '15px'}}>Sellers</div>}
                {loggedSellers.map(s => (
                  <div 
                    key={`seller-${s.id}`} 
                    className={`cl-buyer-item ${selectedContact?.id === s.id && selectedContact?.type === 'seller' ? 'active' : ''}`}
                    onClick={() => handleSelectContact(s)}
                  >
                    <div className="cl-buyer-name">{s.name || 'Unknown Seller'}</div>
                    <div className="cl-buyer-company">{s.company_name || 'No Company'}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Main Content: Timeline & Editor */}
        <div className="cl-main">
          {selectedContact ? (
            <div className="cl-timeline-container">
              <div className="cl-timeline-header">
                <h2>{selectedContact.name || 'Unknown Contact'} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#888', background: '#eee', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', textTransform: 'capitalize'}}>{selectedContact.type}</span></h2>
                <span>{selectedContact.company_name}</span>
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
                  <div className="cl-empty-timeline">No notes added yet for this contact.</div>
                ) : (
                  logs.map(log => {
                    const isEdited = log.updated_at && log.created_at && log.updated_at !== log.created_at;
                    const isEditing = editingLogId === log.id;
                    
                    return (
                      <div key={log.id} className="cl-log-card">
                        <div className="cl-log-header">
                          <div className="cl-log-meta">
                            <FiClock size={14} /> 
                            <span>{formatDate(log.created_at)} {log.author_name ? `by ${log.author_name}` : ''}</span>
                            {isEdited && <span className="cl-edited-badge">(Edited: {formatDate(log.updated_at)} {log.editor_name ? `by ${log.editor_name}` : ''})</span>}
                          </div>
                          {!isEditing && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="cl-edit-icon" onClick={() => { setEditingLogId(log.id); setEditNotes(log.notes); }}>
                                <FiEdit2 size={14} />
                              </button>
                              {localStorage.getItem("role") === "admin" && (
                                <button className="cl-edit-icon" style={{ color: '#d32f2f' }} onClick={() => handleDeleteLog(log.id)}>
                                  <FiX size={14} />
                                </button>
                              )}
                            </div>
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
              <h2>Select a contact</h2>
              <p>Choose a buyer or seller from the list to view their logs or add a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="cl-modal-overlay">
          <div className="cl-modal">
            <div className="cl-modal-header">
              <h2>Select Contact for New Log</h2>
              <button onClick={() => setShowAddModal(false)}><FiX size={20} /></button>
            </div>
            <div className="cl-modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: modalType === 'buyer' ? '#0e2318' : '#fff', color: modalType === 'buyer' ? '#c9a96e' : '#333', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setModalType('buyer')}
                >
                  Buyer
                </button>
                <button 
                  style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '8px', background: modalType === 'seller' ? '#0e2318' : '#fff', color: modalType === 'seller' ? '#c9a96e' : '#333', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setModalType('seller')}
                >
                  Seller
                </button>
              </div>

              <select 
                className="cl-select"
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const arr = modalType === 'buyer' ? allBuyers : allSellers;
                  const item = arr.find(x => x.id === id);
                  if (item) {
                    handleSelectContact({ 
                      id: item.id, 
                      name: modalType === 'buyer' ? item.buyer_name : item.name, 
                      company_name: modalType === 'buyer' ? item.company_name : item.country, 
                      type: modalType 
                    });
                    setShowAddModal(false);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Select from {modalType}s --</option>
                {(modalType === 'buyer' ? allBuyers : allSellers).map(x => (
                  <option key={x.id} value={x.id}>
                    {modalType === 'buyer' ? x.buyer_name : x.name} ({modalType === 'buyer' ? x.company_name : x.country})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
