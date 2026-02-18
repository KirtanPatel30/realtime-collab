🧠 Realtime AI Collaborative Editor-A Google Docs–style realtime collaboration platform with built-in local AI features for summarization and contextual explanations.
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
Frontend-Next.js (App Router),TypeScript,TipTap editor,TailwindCSS
Realtime Engine-Yjs CRDT for conflict-free editing,Supabase Realtime channels,Presence tracking system,Incremental update broadcasting
Backend / API-Next.js server routes,Local AI inference via Ollama,Document snapshot persistence,Debounced autosave system
AI Layer-Local Llama3 model via Ollama,Document summarization endpoint,Selected text explanation endpoint,Fully offline processing

⚡ Why this project is interesting?
This project demonstrates:Distributed realtime systems (CRDT sync),Full-stack engineering,Local LLM integration,Realtime presence architecture,Performance-aware autosave + sync design
Built to explore how AI + collaborative systems can work together in modern productivity tools.

🖼️ Screenshots
<img width="726" height="597" alt="image" src="https://github.com/user-attachments/assets/18b1d6b8-6e94-4524-8dd6-134d6584381f" />
<img width="895" height="419" alt="image" src="https://github.com/user-attachments/assets/ef1932a1-e157-449e-bf65-6b36bd35c0c2" />
