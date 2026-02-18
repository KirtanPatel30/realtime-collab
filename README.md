🧠 Realtime AI Collaborative Editor

A Google Docs–style realtime collaboration platform with built-in local AI features for summarization and contextual explanations.
Designed to simulate modern tools like Notion and Google Docs with integrated offline AI assistance.

🚀 Features
✍️ Realtime Collaboration
Multi-user editing with instant sync
Conflict-free editing using CRDT (Yjs)
Presence indicators (see who is online)
Autosave + persistent storage

🤖 AI-Powered Productivity (Local + Free)
✨ AI document summarization
🧠 Explain selected text
Runs fully offline using Ollama + Llama3
No external API cost or data sharing
Privacy-friendly local inference

💾 Persistence & Sync
Autosaves every few seconds
Stored in Supabase database
Snapshot recovery on reload
Robust sync using state vectors

🧠 Architecture
Frontend
Next.js (App Router)
TypeScript
TipTap editor
TailwindCSS
Realtime Engine
Yjs CRDT for conflict-free editing
Supabase Realtime channels
Presence tracking system
Incremental update broadcasting

Backend / API
Next.js server routes
Local AI inference via Ollama
Document snapshot persistence
Debounced autosave system
AI Layer
Local Llama3 model via Ollama
Document summarization endpoint
Selected text explanation endpoint
Fully offline processing

⚡ Why this project is interesting?
This project demonstrates:
Distributed realtime systems (CRDT sync)
Full-stack engineering
Local LLM integration
Realtime presence architecture
Performance-aware autosave + sync design

Built to explore how AI + collaborative systems can work together in modern productivity tools.

🛠️ Run Locally
1. Clone repo
git clone https://github.com/KirtanPatel30/realtime-ai-editor.git
cd realtime-ai-editor
2. Install dependencies
npm install
3. Setup Supabase env
Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
4. Start Ollama (for AI)
Install Ollama, then run:
ollama run llama3
Keep it running in terminal.
5. Start app
npm run dev
Open:
http://localhost:3000

🔮 Future Improvements
Document version history
AI chat with document
Role-based collaboration
Redis caching layer
Deployment with Docker
Streaming AI responses

👨‍💻 Author

Kirtan Patel
Computer Science @ UIC
Software Engineering | Distributed Systems | AI Systems
