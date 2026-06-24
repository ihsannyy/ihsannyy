# 📝 Wiki Notes & Publisher

A self-hosted, minimalist markdown wiki and note-taking application. Write notes using markdown, edit in real-time with a live preview, and publish them to a beautiful public read-only page with a single click.

## 🚀 How to Run

Because you are running in a Termux/Android environment, use the direct Node.js execution commands below.

### 1. Start the Backend API Server
The server stores the notes in a local JSON file (`server/db.json`) and renders the public view.
```bash
cd server
node server.js
```
*Runs on http://localhost:5000*

### 2. Start the Frontend client (Vite Dev Server)
The client provides the notes manager dashboard, editor canvas, and live preview.
```bash
cd client
node node_modules/vite/bin/vite.js
```
*Runs on http://localhost:5173*

---

## 🛠️ Features & Setup
- **Database**: All notes are stored inside [server/db.json](file:///data/data/com.termux/files/home/IHx-cmyk/markdown-notes/server/db.json). Easy to back up or move.
- **Publishing**: When you click **Publish**, a link is generated: `http://localhost:5000/p/<note-id>`. Anyone with the link can view your note styled in a premium dark format.
- **Proxy Support**: Vite config automatically forwards requests starting with `/api` to the Express server, preventing any CORS issues.
