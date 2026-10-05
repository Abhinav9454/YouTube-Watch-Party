# 🍿 SyncWave — Real-Time YouTube Watch Party System

> **Full-Stack Assignment**: Real-time synchronized video player with WebSocket bidirectional state synchronization, Role-Based Access Control (RBAC), and modern interactive streaming features.

---

## 🚀 Quick Start (One Command)

The full-stack application is containerized with Docker & Docker Compose:

```bash
cd YouTube_Watch_Party
docker compose up --build
```

- 🌐 **Frontend (Web Application)**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend REST API**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- 📡 **WebSocket Endpoint**: `ws://localhost:8080/ws/party` (or via proxy at `ws://localhost:3000/ws/party`)
- 🗄️ **H2 SQL Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)

---

## 📁 Repository Directory

The complete implementation lives in [`YouTube_Watch_Party/`](./YouTube_Watch_Party/):

- [`YouTube_Watch_Party/backend/`](./YouTube_Watch_Party/backend/) — Spring Boot 3, Java 21 LTS, WebSockets, Spring Data JPA, H2 SQL database.
- [`YouTube_Watch_Party/frontend/`](./YouTube_Watch_Party/frontend/) — React 19, TypeScript, Vite, Web Audio API sound synthesis, modern dark glassmorphic UI.
- [`YouTube_Watch_Party/docker-compose.yml`](./YouTube_Watch_Party/docker-compose.yml) — Multi-container orchestration.
- [`YouTube_Watch_Party/render.yaml`](./YouTube_Watch_Party/render.yaml) — Turnkey 1-click cloud deployment blueprint for Render.
- [`YouTube_Watch_Party/README.md`](./YouTube_Watch_Party/README.md) — Comprehensive technical documentation, architecture sequence diagram, WebSocket protocol specifications, RBAC matrix, and interview walkthrough guide.

---

## 🧪 Automated Verification Suite

Run all test suites from the `YouTube_Watch_Party` directory:

```bash
cd YouTube_Watch_Party
node test_full_suite.mjs
node test_rbac.mjs
node test_ws.mjs
node test_webrtc.mjs
```

All integration suites pass with 100% success rate!
