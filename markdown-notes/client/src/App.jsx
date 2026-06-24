import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

function App() {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved' | 'Saving...' | 'Error'
  const saveTimeoutRef = useRef(null);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  // Fetch all notes on component mount
  useEffect(() => {
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        setNotes(data);
        if (data.length > 0) {
          setActiveNoteId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching notes:', err));
  }, []);

  // Create a new blank note
  const createNote = () => {
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Note 📝', content: '# New Note\n\nStart writing here...' }),
    })
      .then((res) => res.json())
      .then((newNote) => {
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
      })
      .catch((err) => console.error('Error creating note:', err));
  };

  // Trigger auto-save to API (debounced)
  const triggerAutoSave = (updatedNote) => {
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/notes/${updatedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedNote.title,
          content: updatedNote.content,
          isPublished: updatedNote.isPublished,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Save failed');
          return res.json();
        })
        .then(() => setSaveStatus('Saved'))
        .catch((err) => {
          console.error(err);
          setSaveStatus('Error');
        });
    }, 800); // 800ms debounce
  };

  // Handle local typing updates
  const handleNoteChange = (fields) => {
    if (!activeNote) return;
    
    const updatedNote = {
      ...activeNote,
      ...fields,
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately for smooth typing
    setNotes(notes.map((n) => (n.id === activeNote.id ? updatedNote : n)));
    
    // Queue save request
    triggerAutoSave(updatedNote);
  };

  // Toggle publish status of active note
  const togglePublish = () => {
    if (!activeNote) return;
    const updatedPublishState = !activeNote.isPublished;
    handleNoteChange({ isPublished: updatedPublishState });
  };

  // Delete active note
  const deleteNote = () => {
    if (!activeNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    fetch(`/api/notes/${activeNote.id}`, { method: 'DELETE' })
      .then((res) => {
        if (res.ok) {
          const remainingNotes = notes.filter((n) => n.id !== activeNote.id);
          setNotes(remainingNotes);
          if (remainingNotes.length > 0) {
            setActiveNoteId(remainingNotes[0].id);
          } else {
            setActiveNoteId(null);
          }
        }
      })
      .catch((err) => console.error('Error deleting note:', err));
  };

  // Format date display
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Filter notes list by search query
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate public published URL
  const getPublicUrl = (id) => {
    return `${window.location.protocol}//${window.location.hostname}:5000/p/${id}`;
  };

  // Copy link helper
  const copyPublicLink = (id) => {
    navigator.clipboard.writeText(getPublicUrl(id));
    alert('Public note link copied to clipboard! 📋');
  };

  return (
    <div className="app-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>📝 Wiki Notes</h2>
          <button className="btn-new-note" onClick={createNote}>
            + New Note
          </button>
        </div>
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="notes-list">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
              onClick={() => setActiveNoteId(note.id)}
            >
              <div className="note-title">{note.title || 'Untitled Note'}</div>
              <div className="note-meta">
                <span>{formatDate(note.updatedAt)}</span>
                {note.isPublished && <span className="note-published-tag">Public 🌐</span>}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
              No notes found
            </div>
          )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="canvas">
        {activeNote ? (
          <>
            {/* Canvas Header */}
            <div className="canvas-header">
              <input
                type="text"
                className="note-title-input"
                value={activeNote.title}
                onChange={(e) => handleNoteChange({ title: e.target.value })}
              />
              <div className="canvas-actions">
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: saveStatus === 'Saving...' ? 'var(--accent)' : 'var(--text-secondary)',
                    marginRight: '10px',
                  }}
                >
                  {saveStatus}
                </span>
                <button
                  className={`btn ${activeNote.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={togglePublish}
                >
                  {activeNote.isPublished ? '🌐 Unpublish' : '🚀 Publish'}
                </button>
                <button className="btn btn-danger" onClick={deleteNote}>
                  Delete
                </button>
              </div>
            </div>

            {/* Published URL Notification Banner */}
            {activeNote.isPublished && (
              <div className="publish-banner">
                <span>
                  🌐 Note is public at:{' '}
                  <span className="publish-link" onClick={() => window.open(getPublicUrl(activeNote.id), '_blank')}>
                    {getPublicUrl(activeNote.id)}
                  </span>
                </span>
                <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => copyPublicLink(activeNote.id)}>
                  Copy Link
                </button>
              </div>
            )}

            {/* Split Screen Panels */}
            <div className="editor-container">
              {/* Left Panel: Markdown Editor */}
              <div className="panel panel-left">
                <div className="panel-header">Markdown Editor</div>
                <textarea
                  className="markdown-textarea"
                  value={activeNote.content}
                  onChange={(e) => handleNoteChange({ content: e.target.value })}
                  placeholder="Write your markdown here..."
                />
              </div>

              {/* Right Panel: Live HTML Preview */}
              <div className="panel">
                <div className="panel-header">Live Preview</div>
                <div
                  className="preview-area"
                  dangerouslySetInnerHTML={{ __html: marked.parse(activeNote.content || '') }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="no-notes">
            <h3>Welcome to Wiki Notes</h3>
            <p>Create a new note in the sidebar to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
