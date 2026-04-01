# NexTalk

A modern, full-stack, real-time web application inspired by WhatsApp Web. Features complete user authentication using JWT, encrypted passwords with bcrypt, a premium Tailwind CSS dark-mode UI, and instant messaging via Socket.IO.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, lucide-react, Socket.IO Client, Axios (with interceptors)
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.IO, JWT, bcryptjs
- **Design:** Glassmorphism UI, custom micro-animations

## Features
- Complete REST API integration
- Robust User Authentication System (Username + Email + Password)
- Real-time chatting functionality
- Presence system (Online/Offline status)
- Optimistic Message Appends
- Clean and reusable Context-driven architecture
- MongoDB Atlas ready

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
