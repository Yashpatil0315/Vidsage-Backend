<div align="center">
  <div style="background-color: #4f46e5; border-radius: 50%; width: 80px; height: 80px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 22h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2Z"></path><path d="M5 12h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2Z"></path><path d="m9 18 6 0"></path><path d="m9 8 6 0"></path>
    </svg>
  </div>
  
  # Vidsage Backend API
  
  **The Core Intelligence Engine Powering Vidsage**

  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg?style=for-the-badge&logo=node.js)](#)
  [![Express.js](https://img.shields.io/badge/Express.js-5.x-black.svg?style=for-the-badge&logo=express)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?style=for-the-badge&logo=mongodb)](#)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black.svg?style=for-the-badge&logo=socket.io)](#)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Models-412991.svg?style=for-the-badge&logo=openai)](#)
</div>

---

## 🚀 Overview

The **Vidsage Backend** is a highly scalable, real-time Node.js server that acts as the intelligent backbone for the Vidsage learning platform. It seamlessly bridges the gap between educational media, artificial intelligence, and real-time human collaboration.

The API is responsible for processing YouTube videos, communicating directly with OpenAI to generate context-rich transcripts and intelligent quizzes, handling robust user authentication, and orchestrating multi-user live study rooms through WebSockets.

---

## ✨ System Architecture & Features

- 🧠 **AI Processing Pipeline:** Communicates with **OpenAI's API** using highly precise system prompts to analyze video context, summarize transcripts, and generate dynamic JSON-based learning quizzes on the fly.
- ⚡ **Real-Time Study Rooms:** Powered by **Socket.IO**. Implements dynamic room namespaces tied directly to video processes (`jobId`), enabling live chat and presence synchronization across multiple collaborating clients completely server-side.
- 🚦 **Concurrency & Job Management:** Utilizes `p-limit` for managing API throttling and parallel background processing, preventing rate limits while efficiently handling high-load async OpenAI inference requests.
- 🔐 **Hardened Security & Auth:** 
  - Complete **JWT** (JSON Web Token) strategy.
  - Secures sessions using strict `httpOnly`, `secure`, `sameSite` cookies (completely unreadable to client-side JS) via `cookie-parser`.
  - Passwords are securely hashed with `bcrypt`.
- 🗄️ **Robust Data Storage:** Powered by **MongoDB** and **Mongoose**. Highly structured schemas for user instances, AI jobs, generated quizzes, and video state tracking.

---

## 🛠️ Technology Stack

- **Runtime & Framework:** Node.js, Express 5
- **Database Architecture:** MongoDB via Mongoose
- **Websockets:** Socket.IO v4.x
- **Authentication:** jsonwebtoken, bcrypt, cookie-parser
- **AI / LLMs:** OpenAI Node SDK
- **Utilities:** p-limit (Concurrency Control), dotenv, cors

---

## 💡 Technical Highlights & Problem Solving

For Recruiters & Engineers reviewing this codebase:

1. **Optimized Socket.IO Broadcast Logic:** Addressed critical race conditions that caused duplicate message rendering in live chats. Implemented targeted `socket.to(jobId).emit` broadcasting mechanisms, ensuring payloads are only forwarded to peer clients rather than bouncing back to the sender, functioning smoothly with frontend optimistic UI rendering.
2. **Stateful Job Polling Architecture:** Built robust polling endpoints (`/job/:jobId`) that allow client apps to continuously request processing status without holding long-lived HTTP connections, preventing server memory leakage during long AI generation tasks.
3. **Graceful Authentication Guards:** Designed modular Express middleware to interpret JWT cookies seamlessly on every protected route. Integrated a single-source-of-truth `/user/me` validation endpoint keeping frontend routing logic stateless and completely secure.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- Local or Cloud MongoDB Instance (e.g., MongoDB Atlas)
- An active OpenAI API Key

### Installation

1. **Navigate to the Backend directory:**
   ```bash
   cd Vidsage-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the backend folder:
   ```env
   PORT=3001
   MONGO_URI=mongodb+srv://<your-cluster-url>
   JWT_SECRET=your_super_secret_jwt_key
   OPENAI_API_KEY=sk-your_openai_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Boot the Server:**
   ```bash
   # Starts the server in watch mode using nodemon:
   npm run dev
   ```

---

## 📂 Project Structure Overview

```text
Vidsage-Backend/
├── src/
│   ├── Controlers/    # Express route handlers and AI Logic 
│   ├── Models/        # MongoDB schemas (Mongoose)
│   ├── Routes/        # Express API routing definitions 
│   ├── service/       # Business logic operations (e.g. SocketService)
├── app.js             # Application entry point & Express configuration
└── package.json       # Project definitions and dependencies
```

---

<div align="center">
  <p>Engineered for high performance and intelligent scalability.</p>
</div>
