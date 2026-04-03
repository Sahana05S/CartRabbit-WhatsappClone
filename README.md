# NexTalk

A modern, full-stack, real-time web application inspired by WhatsApp Web. Features complete user authentication using JWT, encrypted passwords with bcrypt, a premium Tailwind CSS dark-mode UI, and instant messaging via Socket.IO.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, lucide-react, Socket.IO Client, Axios (with interceptors)
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.IO, JWT, bcryptjs
- **Design:** Glassmorphism UI, custom micro-animations

## Features
- **Group Chatting:** Create and manage group conversations with multiple participants.
- **Real-time Chatting:** Instant 1-on-1 and group message delivery using Socket.IO.
- **Rich Media Support:** Send Emojis, GIFs (GIPHY integration), and Stickers.
- **Voice Messages:** Record and send audio messages directly within the chat.
- **File Attachments:** Support for images, videos, and various document types (PDF, Docx, etc.) with previews.
- **Media Gallery:** Dedicated panel to browse shared images, videos, and files in a conversation.
- **Pin & Archive:** Organise your chat list by pinning important conversations or archiving old ones.
- **Presence System:** Real-time online/offline status and "last seen" indicators.
- **Message Status:** WhatsApp-style read receipts (seen status).
- **Reply System:** Contextual replies to specific messages.
- **Typing Indicators:** See when others are typing in real-time.
- **Robust Auth:** JWT-based authentication with secure password hashing.
- **Modern UI:** Premium Glassmorphism design with Tailwind CSS and dark mode support.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` folder: `cd backend`
2. Run `npm install` to get the latest packages.
3. Rename `.env.example` to `.env`.
   - Add your `MONGO_URI` (MongoDB Atlas connection string).
   - Add a `JWT_SECRET` string.
4. Run `npm run dev` to start the backend on port `5000`.

### 2. Frontend Setup
1. Open a separate terminal.
2. Navigate to the `frontend` folder: `cd frontend`
3. Run `npm install` to download Vite and React dependencies.
4. Run `npm run dev` to start the client on port `5173`.
5. Open your browser and go to `http://localhost:5173`.

Enjoy chatting!
