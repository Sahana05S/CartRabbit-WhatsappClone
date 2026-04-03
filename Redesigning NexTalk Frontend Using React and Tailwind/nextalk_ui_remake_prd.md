# NexTalk Frontend Refactor / UI Remake PRD

## Overview
NexTalk is a modern, real-time messaging web application (MERN stack + Socket.io) designed with a WhatsApp Web-inspired layout. The goal of this redesign is to dramatically elevate the visual aesthetics while maintaining 100% functional parity. The new UI should feel premium, fluid, and highly interactive.

## Core Design Directives
- **Aesthetic Feel:** Premium dark mode, glassmorphism, vibrant but controlled neon accents, smooth micro-interactions, layout transitions.
- **Frameworks:** React (Vite), Tailwind CSS (for styling), Lucide-React (for icons). React Router DOM for routing.
- **State Management:** React Context API (`AuthContext`, `SocketContext`, `ChatContext`).
- **Responsiveness:** Must be fully mobile-responsive (Mobile: full-screen panels that slide over each other; Desktop: Multi-pane layout like WhatsApp Web).

---

## 1. Routes & Pages

### A. Auth Page (`/login`, `/register`)
- **Purpose:** Handles new user registration, returning user sign-in, and Multi-Factor Authentication (MFA) challenges.
- **Layout Requirements:**
  - Split layout or centered floating card over an ambient, animated background.
  - Tabs or toggles to switch between "Sign In" and "Sign Up".
  - **Inputs:**
    - Registration: Username, Email, Password.
    - Login: Email, Password.
  - **Google OAuth:** A prominent "Sign in with Google" button.
- **MFA Challenge State:**
  - If the backend returns `mfaRequired`, the UI must slide the login form away and present a "Verify it’s you" screen.
  - Needs a 6-digit TOTP code input (like an authenticator app) and a toggle to "Use Recovery Code" (8 characters).
  - Clean error states (`Session expired`, `Invalid code`) that bump the user back to the normal login state if they timeout.

### B. OAuth Success Page (`/auth/google/success`)
- **Purpose:** An invisible/loading transition screen.
- **Layout Requirements:** 
  - Just a beautiful, pulsing loading spinner with "Signing you in...".
  - It handles extracting `?oauth_token` from the URL, saving the session, and redirecting to `/chat`.

### C. Chat Page (`/chat`)
- **Purpose:** The main application hub. This page holds the core MERN application and Socket.io instances.
- **Layout Requirements (Desktop):**
  - **Left Pane (Sidebar):** ~30-35% width. Houses navigation, chat lists, and slides into Settings/Profile panels.
  - **Right Pane (Main Chat):** ~65-70% width. Houses the active conversation, header, and message input.

---

## 2. Left Pane (Sidebar) Architecture

### A. Main Chat List View
- **Header:** Logged-in user's avatar, status, and icon buttons (New Chat, Create Group, Menu).
- **Search Bar:** A sticky search input to filter contacts/chats.
- **List Items (Chats):**
  - Avatar (with online status indicator dot).
  - Contact Name.
  - Last message preview.
  - Timestamp.
  - "Unread" badge count.
  - Pin icon / Archive button actions (hover state or swipe action).
  - Pinned chats should stay at the top visually.

### B. Profile Panel
- **Trigger:** Clicking the user's own avatar in the Chat List header.
- **Features:** 
  - Large editable Avatar display (hover to upload new).
  - Editable Display Name.
  - Editable Bio/About text.
  - Slides in over the Chat List from the left.

### C. Settings Panel
- **Trigger:** Settings icon in the menu.
- **Tabs/Sections:**
  - **Appearance:** Select Chat Wallpapers (Built-in presets, solid colors, upload custom custom image).
  - **Privacy:** Toggles for "Last Seen", "Read Receipts".
  - **Security (MFA):** 
    - Setup Wizard: Shows QR code, Manual Entry Key, and 6-digit verify input.
    - Active view: Shows "MFA is Active" badge, "Disable MFA" badge, and "Regenerate Recovery Codes" button.
    - Recovery codes view: A temporary list of 8 strings that can be "Copied" or "Downloaded".

### D. New Chat / Group Creation Panel
- **Trigger:** "New Chat" icon.
- **Features:** 
  - List of available external contacts to start a 1:1 chat.
  - "Create Group Chat" wizard: Input group name, select multiple participants, set a group avatar.

---

## 3. Right Pane (Active Chat Area)

### A. Empty State
- **Trigger:** When no chat is selected.
- **Features:** Beautiful graphic/illustration. "NexTalk for Web" title. Information about real-time capabilities.

### B. Chat Header
- **Features:**
  - Back button (Mobile only).
  - Contact/Group Avatar.
  - Contact Name.
  - Subtitle: Typing indicator ("typing..."), Presence status ("Online", "Offline"), or "Last seen at X".
  - Icons on the right: View Contact Info, Media Gallery toggle, Search in chat.

### C. Message List (The Canvas)
- **Features:**
  - **Background:** Should render the customizable user Chat Wallpaper behind the messages.
  - **Message Bubbles:**
    - "Me" messages on the right (Accent color).
    - "Them" messages on the left (Neutral panel color).
    - Timestamps inside the bubble.
    - **Read Receipts (WhatsApp style):** 1 gray tick (sent), 2 gray ticks (delivered), 2 blue ticks (read).
  - **Media Attachments:** In-bubble display of images/videos.
  - System messages (e.g., "John created this group" or "Date: Today") centered tightly.
  - Scroll-to-bottom button appears if the user scrolls up.

### D. Media Gallery (Right Offcanvas Panel)
- **Trigger:** Clicking the "Gallery" icon in the header.
- **Features:** 
  - Slides in from the right edge, taking up about 30% width, shrinking the main chat.
  - Tabs: "Images", "Videos", "Files".
  - Grid view of all media ever sent in that specific conversation. Lazy-loaded.

### E. Message Input Area
- **Features:**
  - Attachment icon (Images, Docs).
  - Emoji picker toggle (slides up an emoji grid).
  - Textarea (auto-expanding up to max-height).
  - Send button (or Mic button if we add push-to-talk later).

---

## 4. Technical Constraints for the UI Generator
1. **Never mock the Context logic:** Do not write fake `useState` hooks to mock user authentication or sockets if the hook is expected to use `AuthContext`, `SocketContext`, or `ChatContext`. Leave standard API/Context interfaces intact or comment explicitly where the logic hooks in.
2. **Icons:** Exclusively use `lucide-react`.
3. **Animations:** Use Framer Motion or Tailwind config animations (`animate-pulse`, `animate-slide-in`, etc.) for pane transitions.
4. **Modals vs Panes:** Follow the WhatsApp paradigm. Heavy use of sliding panes over the sidebar rather than traditional centered modals. Everything should feel anchored and smooth.

## Hand-off Instructions
When returning the UI components, organize them functionally (e.g., `components/Sidebar`, `components/Chat`, `pages/AuthPage`). Make sure the CSS matches via `index.css` Tailwind directives. Provide the `App.jsx` routing structure wrapper.
