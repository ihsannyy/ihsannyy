import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET all notes
app.get('/api/notes', (req, res) => {
  res.json(db.data.notes);
});

// GET a single public published note (json)
app.get('/api/notes/public/:id', (req, res) => {
  const note = db.data.notes.find((n) => n.id === req.params.id);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  if (!note.isPublished) {
    return res.status(403).json({ error: 'This note is private' });
  }
  res.json(note);
});

// GET public HTML rendering of the note
app.get('/p/:id', async (req, res) => {
  const note = db.data.notes.find((n) => n.id === req.params.id);
  
  if (!note) {
    return res.status(404).send(`
      <html>
        <head><title>404 - Not Found</title></head>
        <body style="background: #0b0f19; color: #f3f4f6; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <h2>Note not found</h2>
        </body>
      </html>
    `);
  }

  if (!note.isPublished) {
    return res.status(403).send(`
      <html>
        <head><title>403 - Forbidden</title></head>
        <body style="background: #0b0f19; color: #f3f4f6; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <h2>This note is private 🔒</h2>
        </body>
      </html>
    `);
  }

  // Parse markdown
  const htmlContent = marked.parse(note.content || '');

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${note.title} - Wiki Notes</title>
        <style>
          :root {
            --bg-primary: #0b0f19;
            --bg-secondary: #111827;
            --border-color: #374151;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent: #a78bfa;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.7;
            padding: 40px 20px;
          }
          .container {
            max-width: 780px;
            margin: 0 auto;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          }
          header {
            margin-bottom: 30px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 20px;
          }
          h1 {
            font-size: 2.2rem;
            color: var(--text-primary);
            margin-bottom: 10px;
            font-weight: 800;
          }
          .meta {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
          /* Markdown elements styling */
          h2, h3 { margin-top: 1.8rem; margin-bottom: 1rem; font-weight: 700; color: var(--text-primary); }
          h2 { font-size: 1.5rem; }
          p { margin-bottom: 1.2rem; color: #d1d5db; }
          a { color: var(--accent); text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { font-family: monospace; background-color: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px; color: var(--accent); font-size: 0.85em; }
          pre { background-color: #0c0f16; padding: 18px; border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto; margin-bottom: 1.2rem; }
          pre code { background-color: transparent; padding: 0; color: #f3f4f6; font-size: 0.9em; }
          blockquote { border-left: 4px solid var(--accent); padding-left: 15px; color: var(--text-secondary); font-style: italic; margin: 1.5rem 0; }
          ul, ol { margin-bottom: 1.2rem; padding-left: 20px; }
          li { margin-bottom: 0.4rem; }
          footer {
            margin-top: 50px;
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>${note.title}</h1>
            <div class="meta">
              Published on ${new Date(note.updatedAt).toLocaleString('id-ID')}
            </div>
          </header>
          <article>
            ${htmlContent}
          </article>
          <footer>
            Published with 📝 Wiki Notes by <a href="https://github.com/IHx-cmyk" target="_blank">IHx-cmyk</a>
          </footer>
        </div>
      </body>
    </html>
  `);
});

// POST create a new note
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  const newNote = {
    id: uuidv4(),
    title: title || 'Untitled Note',
    content: content || '',
    isPublished: false,
    updatedAt: new Date().toISOString(),
  };

  db.data.notes.unshift(newNote);
  await db.write();
  res.status(201).json(newNote);
});

// PUT update a note
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, isPublished } = req.body;

  const noteIndex = db.data.notes.findIndex((n) => n.id === id);
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const existingNote = db.data.notes[noteIndex];
  const updatedNote = {
    ...existingNote,
    title: title !== undefined ? title : existingNote.title,
    content: content !== undefined ? content : existingNote.content,
    isPublished: isPublished !== undefined ? isPublished : existingNote.isPublished,
    updatedAt: new Date().toISOString(),
  };

  db.data.notes[noteIndex] = updatedNote;
  await db.write();

  res.json(updatedNote);
});

// DELETE a note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const noteIndex = db.data.notes.findIndex((n) => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  db.data.notes.splice(noteIndex, 1);
  await db.write();

  res.json({ message: 'Note deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
