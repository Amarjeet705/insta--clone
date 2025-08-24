import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera, Heart, Home, MessageCircle, PlusSquare, Search, Send, User, Bookmark,
  MessageSquare, MoreHorizontal, LogOut, Loader2, Image as ImageIcon, Grid, Bell,
  PlayCircle, ChevronLeft, ChevronRight
} from "lucide-react";

// --- Minimal utility styles (TailwindCSS is available in the canvas preview) ---
// The component is self‑contained and uses localStorage as a mock backend.
// Features:
// - Mock auth (set a username)
// - Stories (horizontal scroll)
// - Feed with posts (like/comment/save)
// - Create Post (image upload, caption, tags)
// - Explore grid
// - Profile (user posts, bio edit, followers mock)
// - Search across users & captions
// - Persistent data in localStorage
// NOTE: This is a demo clone for learning only. Not affiliated with Instagram.

// ---------- Types ----------
/** @typedef {{ id:string, username:string, avatar?:string, bio?:string, followers:number, following:number }} UserType */
/** @typedef {{ id:string, author:string, image:string, caption:string, likes:string[], saved:string[], comments: {id:string, user:string, text:string, ts:number}[], ts:number, tags?:string[] }} PostType */

// ---------- Mock Data ----------
const DEFAULT_USERS /** @type {UserType[]} */ = [
  { id: "u1", username: "arjun", followers: 120, following: 180, avatar: "https://i.pravatar.cc/150?img=12", bio: "Coffee • Code • Cricket" },
  { id: "u2", username: "meera", followers: 420, following: 210, avatar: "https://i.pravatar.cc/150?img=32", bio: "Travel ✈ | Foodie 🍜" },
  { id: "u3", username: "rahul", followers: 88, following: 99, avatar: "https://i.pravatar.cc/150?img=56", bio: "Designer • Minimalist" },
  { id: "u4", username: "sana", followers: 301, following: 150, avatar: "https://i.pravatar.cc/150?img=14", bio: "Street photography 📷" },
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1526401281623-279b498f10b4?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512427691650-1f48f8eb3e47?q=80&w=1200&auto=format&fit=crop",
];

// ---------- Storage Helpers ----------
const LS_KEY = "instaclone_state_v1";
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

// ---------- Helper Components ----------
function IconButton({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-50 ${active ? "text-pink-600" : ""}`}
    >
      {children}
    </button>
  );
}

function Avatar({ src, alt, size = 36 }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(alt||"user")}&background=random`}
      alt={alt}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border"
    />
  );
}

function Pill({ children }) {
  return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">{children}</span>;
}

function Divider() {
  return <div className="h-px w-full bg-gray-200" />;
}

// ---------- Main App ----------
export default function InstaCloneApp() {
  // global state
  const [users, setUsers] = useState(() => loadState()?.users || DEFAULT_USERS);
  const [posts, setPosts] = useState(() => {
    const init = SAMPLE_IMAGES.slice(0, 4).map((img, i) => ({
      id: `p${i+1}`,
      author: DEFAULT_USERS[i % DEFAULT_USERS.length].username,
      image: img,
      caption: ["Sunset vibes", "Minimal desk", "City lights", "Cozy reads"][i] || "",
      likes: [],
      saved: [],
      comments: [],
      ts: Date.now() - (i+1)*3600_000,
      tags: ["#aesthetic", "#daily", "#igers"].slice(0, 1 + (i % 3))
    }));
    const persisted = loadState();
    return persisted?.posts || init;
  });
  const [currentUser, setCurrentUser] = useState(() => loadState()?.currentUser || "");
  const [route, setRoute] = useState(() => loadState()?.route || "home"); // home | explore | create | profile | post/:id | search
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  // persist
  useEffect(() => {
    saveState({ users, posts, currentUser, route });
  }, [users, posts, currentUser, route]);

  // derived
  const me = useMemo(() => users.find(u => u.username === currentUser), [users, currentUser]);
  const myPosts = useMemo(() => posts.filter(p => p.author === currentUser), [posts, currentUser]);

  // handlers
  function handleToggleLike(postId) {
    if (!currentUser) return;
    setPosts(ps => ps.map(p =>
      p.id === postId
        ? { ...p, likes: p.likes.includes(currentUser) ? p.likes.filter(u => u !== currentUser) : [...p.likes, currentUser] }
        : p
    ));
  }
  function handleToggleSave(postId) {
    if (!currentUser) return;
    setPosts(ps => ps.map(p =>
      p.id === postId
        ? { ...p, saved: p.saved.includes(currentUser) ? p.saved.filter(u => u !== currentUser) : [...p.saved, currentUser] }
        : p
    ));
  }
  function handleAddComment(postId, text) {
    if (!currentUser || !text.trim()) return;
    setPosts(ps => ps.map(p =>
      p.id === postId
        ? {
            ...p,
            comments: [
              ...p.comments,
              { id: crypto.randomUUID(), user: currentUser, text: text.trim(), ts: Date.now() }
            ]
          }
        : p
    ));
  }
  function handleCreatePost({ image, caption, tags }) {
    if (!currentUser) return;
    const post = {
      id: crypto.randomUUID(),
      author: currentUser,
      image,
      caption: caption||"",
      likes: [],
      saved: [],
      comments: [],
      ts: Date.now(),
      tags
    };
    setPosts(ps => [post, ...ps]);
    setRoute("home");
  }

  function handleAuth(name) {
    if (!name.trim()) return;
    const exists = users.find(u => u.username === name.trim());
    if (!exists)
      setUsers(us => [...us, { id: crypto.randomUUID(), username: name.trim(), followers: 0, following: 0 }]);
    setCurrentUser(name.trim());
  }

  // UI helpers
  const NavItem = ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex gap-3 items-center px-4 py-2 rounded-xl hover:bg-gray-100 transition ${active?"font-semibold": ""}`}
    >
      {icon} <span className="hidden md:block">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <TopBar
        currentUser={currentUser}
        setRoute={setRoute}
        query={query}
        setQuery={setQuery}
        onLogout={() => setCurrentUser("")}
      />

      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-[220px,1fr,340px
