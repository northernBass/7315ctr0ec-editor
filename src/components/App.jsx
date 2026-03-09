"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from "docx";

const _initCharId = Date.now();
const _initCh1Id = _initCharId + 1;
const _initCh2Id = _initCharId + 2;
const INITIAL_CHAPTERS = [
  { id: _initCh1Id, title: "Chapter 1", content: "<p>Begin writing here...</p>" },
  { id: _initCh2Id, title: "Chapter 2", content: "<p></p>" },
];
const INITIAL_CHARACTERS = [
  { id: _initCharId, name: "Character One", age: "", appearance: "", history: "", role: "", arc: "", photo: null },
];

function generateFakeWordCounts() {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const label = date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    const count = i === 0 ? 0 : Math.random() > 0.25 ? Math.floor(Math.random() * 1800 + 100) : 0;
    data.push({ label, count, date: date.toISOString().split("T")[0] });
  }
  return data;
}
const DAILY_GOAL = 1000;

// ─── ICONS ───────────────────────────────────────────────────────────────────
const ChevronRight = ({ size = 12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>;
const ChevronDown = ({ size = 12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>;
const PlusIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const TrashIcon = ({ size = 12 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
const RestoreIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
const HexIcon = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7" /></svg>;
const GripIcon = () => <svg width={10} height={14} viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2.5" r="1.2" /><circle cx="7" cy="2.5" r="1.2" /><circle cx="3" cy="7" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="3" cy="11.5" r="1.2" /><circle cx="7" cy="11.5" r="1.2" /></svg>;
const CameraIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const PersonIcon = () => <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
const DownloadIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

// ─── FORMAT TOOLBAR ICONS ─────────────────────────────────────────────────────
const BoldIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>;
const ItalicIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>;
const StrikeIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.3 12.5c.6.6.7 1.3.7 1.8A3.7 3.7 0 0 1 14 18H8" /><path d="M6.6 11.5C6.2 11 6 10.4 6 9.7A3.7 3.7 0 0 1 10 6h4.5" /><line x1="4" y1="12" x2="20" y2="12" /></svg>;
const CodeIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
const QuoteIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>;
const H1Icon = () => <svg width={15} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h8M4 6v12M12 6v12M17 12l3-3v9" /></svg>;
const H2Icon = () => <svg width={15} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h8M4 6v12M12 6v12M21 18h-4c0-4 4-3 4-6 0-1.5-1-2-2-2s-2 1-2 2" /></svg>;
const H3Icon = () => <svg width={15} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h8M4 6v12M12 6v12M17.5 10c.5-.5 1.5-1 2.5-.5 1 .4 1.5 2 .5 3-.5.5-1 .7-1.5.7M17.5 18c.5.5 1.5 1 2.5.5 1-.4 1.5-2 .5-3-.5-.5-1-.7-1.5-.7" /></svg>;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:ital,wght@0,200;0,300;0,400;1,200&display=swap');

  :root {
    --bg-void: #050810; --bg-deep: #080d1a; --bg-panel: #0a1020;
    --bg-hover: #111c35; --bg-active: #152240;
    --border-dim: #1a2a4a; --border-med: #1e3560; --border-bright: #2a4a80;
    --blue-core: #4fc3f7; --blue-bright: #81d4fa; --blue-dim: #1a4a6a;
    --blue-glow: rgba(79,195,247,0.15); --blue-glow-strong: rgba(79,195,247,0.3);
    --text-primary: #e8f0fe; --text-secondary: #8ab4d4; --text-dim: #3d5a7a;
    --green-ok: #00e5a0; --red-alert: #ff4444; --amber: #ffb74d;
    --sidebar-w: 260px;
    --font-ui: 'Rajdhani', sans-serif;
    --font-mono: 'Share Tech Mono', monospace;
    --font-body: 'Exo 2', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg-void); color: var(--text-primary); font-family: var(--font-ui); overflow: hidden; height: 100vh; }
  body::before {
    content: ''; position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events: none; z-index: 9999;
  }

  .app-shell { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

  /* ── SIDEBAR ── */
  .sidebar { width: var(--sidebar-w); min-width: var(--sidebar-w); background: var(--bg-deep); border-right: 1px solid var(--border-med); display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .sidebar::after { content: ''; position: absolute; top: 0; right: 0; width: 1px; height: 100%; background: linear-gradient(180deg, transparent, var(--blue-core) 30%, var(--blue-core) 70%, transparent); opacity: 0.4; }
  .sidebar-logo { display: flex; align-items: center; gap: 8px; padding: 16px 14px 12px; border-bottom: 1px solid var(--border-dim); }
  .logo-text { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.12em; color: var(--blue-core); }
  .logo-sub { font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em; margin-top: 1px; }
  .sidebar-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0 8px; min-height: 0; }
  .sidebar-scroll::-webkit-scrollbar { width: 2px; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: var(--blue-dim); }

  /* ── GRAPH ── */
  .wc-graph-section { padding: 10px 14px 12px; border-bottom: 1px solid var(--border-dim); }
  .wc-graph-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .wc-today { font-family: var(--font-mono); font-size: 18px; color: var(--blue-core); line-height: 1; }
  .wc-goal { font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); }
  .wc-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim); font-family: var(--font-mono); display: block; margin-bottom: 6px; }
  .bar-chart { display: flex; align-items: flex-end; gap: 2px; height: 48px; position: relative; }
  .bar-chart::before { content: ''; position: absolute; left: 0; right: 0; bottom: calc(var(--goal-pct) * 1%); height: 1px; background: var(--blue-dim); border-top: 1px dashed var(--blue-dim); }
  .bar { flex: 1; min-width: 2px; border-radius: 1px 1px 0 0; cursor: default; position: relative; }
  .bar:hover::after { content: attr(data-count); position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-family: var(--font-mono); font-size: 8px; color: var(--blue-bright); white-space: nowrap; background: var(--bg-panel); border: 1px solid var(--border-bright); padding: 2px 4px; border-radius: 2px; z-index: 10; }
  .bar-empty { background: var(--border-dim); opacity: 0.4; }
  .bar-partial { background: linear-gradient(180deg, #1a4a7a, #0d2a4a); }
  .bar-goal { background: linear-gradient(180deg, var(--blue-core), var(--blue-dim)); box-shadow: 0 0 4px var(--blue-glow); }
  .bar-today { background: linear-gradient(180deg, var(--blue-bright), var(--blue-core)); box-shadow: 0 0 8px var(--blue-glow-strong); animation: pulse-bar 2s ease-in-out infinite; }
  @keyframes pulse-bar { 0%, 100% { box-shadow: 0 0 6px var(--blue-glow-strong); } 50% { box-shadow: 0 0 14px rgba(79,195,247,0.5); } }

  /* ── SECTIONS ── */
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px 4px; cursor: pointer; user-select: none; }
  .section-header-left { display: flex; align-items: center; gap: 5px; }
  .section-title { font-size: 9px; font-family: var(--font-mono); letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); }
  .section-actions { display: flex; gap: 4px; align-items: center; }
  .section-btn { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-dim); border-radius: 2px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; background: transparent; }
  .section-btn:hover { border-color: var(--blue-core); color: var(--blue-core); background: var(--blue-glow); }
  .sep { height: 1px; background: var(--border-dim); margin: 4px 14px; opacity: 0.5; }

  /* ── NAV ITEMS ── */
  .nav-item { display: flex; align-items: center; gap: 6px; padding: 5px 14px 5px 20px; cursor: pointer; font-size: 13px; font-weight: 500; letter-spacing: 0.02em; color: var(--text-secondary); transition: all 0.15s; position: relative; user-select: none; }
  .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-item.active { background: var(--bg-active); color: var(--blue-core); }
  .nav-item.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--blue-core); box-shadow: 0 0 8px var(--blue-core); }
  .nav-item.dragging { opacity: 0.4; }
  .nav-item.drag-over { border-top: 2px solid var(--blue-core); }
  .nav-item.trashed { color: var(--text-dim); font-style: italic; padding-left: 14px; }
  .nav-item-grip { color: var(--text-dim); opacity: 0; cursor: grab; flex-shrink: 0; display: flex; align-items: center; transition: opacity 0.15s; margin-left: -4px; }
  .nav-item:hover .nav-item-grip { opacity: 1; }
  .nav-item-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--border-bright); flex-shrink: 0; }
  .nav-item.active .nav-item-dot { background: var(--blue-core); box-shadow: 0 0 6px var(--blue-core); }
  .nav-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nav-item-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
  .nav-item:hover .nav-item-actions { opacity: 1; }
  .nav-item.trashed .nav-item-actions { opacity: 1; }
  .nav-item-btn { color: var(--text-dim); cursor: pointer; padding: 2px 3px; border-radius: 2px; transition: color 0.15s; display: flex; align-items: center; }
  .nav-item-btn:hover { color: var(--red-alert); }
  .nav-item-btn.restore:hover { color: var(--green-ok); }

  /* ── TRASH DOCK ── */
  .trash-dock { border-top: 1px solid var(--border-dim); background: var(--bg-deep); flex-shrink: 0; }
  .trash-dock-toggle { display: flex; align-items: center; justify-content: space-between; padding: 7px 14px; cursor: pointer; user-select: none; transition: background 0.15s; }
  .trash-dock-toggle:hover { background: var(--bg-hover); }
  .trash-dock-left { display: flex; align-items: center; gap: 6px; color: var(--text-dim); }
  .trash-dock-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim); }
  .trash-dock-label.has-items { color: var(--amber); }
  .trash-badge { background: var(--amber); color: var(--bg-void); font-family: var(--font-mono); font-size: 8px; padding: 1px 5px; border-radius: 8px; line-height: 1.4; }
  .trash-dock-panel { max-height: 220px; overflow-y: auto; border-top: 1px solid rgba(255,183,77,0.12); background: rgba(255,183,77,0.02); }
  .trash-dock-panel::-webkit-scrollbar { width: 2px; }
  .trash-dock-panel::-webkit-scrollbar-thumb { background: rgba(255,183,77,0.2); }
  .trash-type-label { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,183,77,0.4); padding: 6px 14px 2px; }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-void); }

  /* ── TOPBAR ── */
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 44px; border-bottom: 1px solid var(--border-dim); background: var(--bg-deep); flex-shrink: 0; gap: 12px; }
  .topbar-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .topbar-breadcrumb { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); letter-spacing: 0.1em; white-space: nowrap; }
  .topbar-title-input { background: transparent; border: none; outline: none; font-family: var(--font-ui); font-size: 15px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.05em; min-width: 0; flex: 1; }
  .topbar-title-input::placeholder { color: var(--text-dim); }
  .topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .status-chip { display: flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.15em; color: var(--green-ok); text-transform: uppercase; white-space: nowrap; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green-ok); box-shadow: 0 0 6px var(--green-ok); animation: blink 2s ease-in-out infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .topbar-wc { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); white-space: nowrap; }
  .topbar-wc span { color: var(--blue-core); }

  /* ── EXPORT BUTTONS ── */
  .export-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 3px 8px; border: 1px solid var(--border-dim); border-radius: 2px;
    font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em;
    color: var(--text-dim); background: transparent; cursor: pointer;
    transition: all 0.15s; text-transform: uppercase; white-space: nowrap;
  }
  .export-btn:hover { border-color: var(--blue-core); color: var(--blue-core); background: var(--blue-glow); }

  /* ── FORMAT TOOLBAR ── */
  .format-toolbar {
    display: flex; align-items: center; gap: 2px;
    padding: 5px 28px;
    border-bottom: 1px solid var(--border-dim);
    background: var(--bg-deep);
    flex-shrink: 0;
  }

  .fmt-btn {
    width: 28px; height: 26px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid transparent; border-radius: 3px;
    color: var(--text-dim); background: transparent;
    cursor: pointer; transition: all 0.12s;
  }
  .fmt-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-dim); }
  .fmt-btn.active { background: var(--bg-active); color: var(--blue-core); border-color: var(--blue-dim); }

  .fmt-divider { width: 1px; height: 16px; background: var(--border-dim); margin: 0 4px; flex-shrink: 0; }

  .fmt-label {
    font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em;
    color: var(--text-dim); padding: 0 4px; white-space: nowrap;
  }

  /* ── EDITOR ── */
  .editor-wrap { flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 48px 24px; }
  .editor-wrap::-webkit-scrollbar { width: 4px; }
  .editor-wrap::-webkit-scrollbar-thumb { background: var(--border-dim); border-radius: 2px; }
  .editor-column { width: 100%; max-width: 680px; }

  /* TipTap editor styles */
  .tiptap-editor { outline: none; caret-color: var(--blue-core); }
  .tiptap-editor p { font-family: var(--font-body); font-size: 16px; font-weight: 300; line-height: 1.85; color: var(--text-primary); letter-spacing: 0.01em; margin-bottom: 1em; }
  .tiptap-editor p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--text-dim); pointer-events: none; float: left; height: 0; }
  .tiptap-editor h1 { font-family: var(--font-ui); font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.6em; margin-top: 1.4em; border-bottom: 1px solid var(--border-dim); padding-bottom: 8px; }
  .tiptap-editor h2 { font-family: var(--font-ui); font-size: 20px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 0.5em; margin-top: 1.2em; }
  .tiptap-editor h3 { font-family: var(--font-ui); font-size: 16px; font-weight: 600; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.4em; margin-top: 1em; }
  .tiptap-editor strong { color: var(--blue-bright); font-weight: 600; }
  .tiptap-editor em { color: var(--text-primary); font-style: italic; opacity: 0.85; }
  .tiptap-editor s { color: var(--text-dim); text-decoration: line-through; }
  .tiptap-editor code { font-family: var(--font-mono); font-size: 13px; color: var(--blue-core); background: var(--bg-panel); border: 1px solid var(--border-dim); border-radius: 3px; padding: 1px 5px; }
  .tiptap-editor blockquote { border-left: 2px solid var(--blue-dim); padding-left: 16px; margin: 1em 0; color: var(--text-secondary); font-style: italic; }
  .tiptap-editor ::selection { background: var(--blue-glow-strong); }

  /* ── CHARACTER PANEL ── */
  .char-panel { flex: 1; overflow-y: auto; padding: 40px; }
  .char-panel::-webkit-scrollbar { width: 4px; }
  .char-panel::-webkit-scrollbar-thumb { background: var(--border-dim); }
  .char-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid var(--border-dim); }
  .char-header-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .char-name-row { display: flex; align-items: baseline; gap: 12px; }
  .char-name-input { background: transparent; border: none; outline: none; font-family: var(--font-ui); font-size: 26px; font-weight: 700; letter-spacing: 0.08em; color: var(--text-primary); flex: 1; text-transform: uppercase; }
  .char-name-input::placeholder { color: var(--text-dim); }
  .char-id-badge { font-family: var(--font-mono); font-size: 9px; color: var(--blue-core); letter-spacing: 0.15em; border: 1px solid var(--blue-dim); padding: 3px 7px; border-radius: 2px; white-space: nowrap; }
  .char-photo-wrap { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .char-photo { width: 88px; height: 88px; border-radius: 4px; border: 1px solid var(--border-med); object-fit: cover; display: block; }
  .char-photo-placeholder { width: 88px; height: 88px; border-radius: 4px; border: 1px dashed var(--border-med); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; background: var(--bg-panel); }
  .char-photo-placeholder:hover { border-color: var(--blue-core); color: var(--blue-core); background: var(--blue-glow); }
  .char-photo-hint { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.1em; text-transform: uppercase; text-align: center; line-height: 1.3; }
  .char-photo-overlay { position: absolute; inset: 0; border-radius: 4px; background: rgba(5,8,16,0.75); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; opacity: 0; transition: opacity 0.15s; cursor: pointer; }
  .char-photo-wrap:hover .char-photo-overlay { opacity: 1; }
  .char-photo-overlay span { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.1em; color: var(--blue-core); text-transform: uppercase; }
  .char-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .char-field-full { grid-column: 1 / -1; }
  .char-field-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .char-field-label::after { content: ''; flex: 1; height: 1px; background: var(--border-dim); }
  .char-field-input, .char-field-textarea { width: 100%; background: var(--bg-panel); border: 1px solid var(--border-dim); border-radius: 3px; outline: none; font-family: var(--font-body); font-size: 14px; font-weight: 300; color: var(--text-primary); padding: 8px 12px; transition: border-color 0.15s, box-shadow 0.15s; letter-spacing: 0.01em; resize: none; }
  .char-field-input:focus, .char-field-textarea:focus { border-color: var(--blue-core); box-shadow: 0 0 0 1px var(--blue-glow), inset 0 0 12px var(--blue-glow); }
  .char-field-textarea { min-height: 100px; line-height: 1.6; }
  .char-field-textarea.large { min-height: 160px; }

  /* ── EMPTY ── */
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-dim); }
  .empty-hex { opacity: 0.3; animation: float 4s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .empty-text { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }
  .inline-edit { background: transparent; border: none; outline: none; font-family: inherit; font-size: inherit; font-weight: inherit; color: inherit; width: 100%; letter-spacing: inherit; cursor: text; }
  .system-bar { height: 22px; display: flex; align-items: center; padding: 0 14px; border-top: 1px solid var(--border-dim); background: var(--bg-deep); flex-shrink: 0; }
  .sys-text { font-family: var(--font-mono); font-size: 8px; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; }
  .sys-ok { color: var(--green-ok); }
`;

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────
function htmlToMarkdown(html) {
  // Simple but solid HTML→Markdown conversion for our use cases
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<del>(.*?)<\/del>/gi, "~~$1~~")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<blockquote>(.*?)<\/blockquote>/gis, (_, inner) => inner.trim().split("\n").map(l => `> ${l}`).join("\n") + "\n\n")
    .replace(/<p>(.*?)<\/p>/gis, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportMarkdown(chapters) {
  const md = chapters.map(ch => {
    const title = `# ${ch.title}\n\n`;
    const body = htmlToMarkdown(ch.content || "");
    return title + body;
  }).join("\n\n---\n\n");
  downloadFile(md, "manuscript.md", "text/markdown");
}

function htmlToDocxParagraphs(html) {
  // Parse HTML nodes into docx Paragraph objects
  const div = document.createElement("div");
  div.innerHTML = html;
  const paragraphs = [];

  function nodeToRuns(node) {
    const runs = [];
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        // plain text
        if (child.textContent) runs.push(new TextRun({ text: child.textContent }));
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        const inner = child.textContent || "";
        if (tag === "strong" || tag === "b") runs.push(new TextRun({ text: inner, bold: true }));
        else if (tag === "em" || tag === "i") runs.push(new TextRun({ text: inner, italics: true }));
        else if (tag === "s" || tag === "del") runs.push(new TextRun({ text: inner, strike: true }));
        else if (tag === "code") runs.push(new TextRun({ text: inner, font: "Courier New" }));
        else runs.push(...nodeToRuns(child));
      }
    });
    return runs;
  }

  div.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "h1") {
      paragraphs.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_1 }));
    } else if (tag === "h2") {
      paragraphs.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_2 }));
    } else if (tag === "h3") {
      paragraphs.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_3 }));
    } else if (tag === "blockquote") {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: node.textContent, italics: true })], indent: { left: 720 } }));
    } else if (tag === "p") {
      const runs = nodeToRuns(node);
      if (runs.length > 0) paragraphs.push(new Paragraph({ children: runs }));
      else paragraphs.push(new Paragraph({}));
    }
  });

  return paragraphs;
}

async function exportDocx(chapters) {
  try {
    const sections = [];
    chapters.forEach((ch, i) => {
      const paras = htmlToDocxParagraphs(ch.content || "");
      sections.push(
        new Paragraph({ text: ch.title, heading: HeadingLevel.TITLE }),
        ...paras,
      );
      if (i < chapters.length - 1) sections.push(new Paragraph({ children: [new PageBreak()] }));
    });

    const doc = new Document({
      sections: [{ children: sections }],
      styles: {
        default: {
          document: { run: { font: "Georgia", size: 24 } },
        },
      },
    });

    const buffer = await Packer.toBlob(doc);
    const url = URL.createObjectURL(buffer);
    const a = document.createElement("a");
    a.href = url; a.download = "manuscript.docx"; a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("DOCX export failed. Try .md export instead.");
    console.error(err);
  }
}

// ─── WORD COUNT GRAPH ─────────────────────────────────────────────────────────
function WordCountGraph({ data, todayCount, goal }) {
  const maxCount = Math.max(...data.map((d) => d.count), todayCount, goal);
  const goalPct = Math.min((goal / maxCount) * 100, 100);
  return (
    <div className="wc-graph-section">
      <span className="wc-label">30-day output</span>
      <div className="wc-graph-header">
        <div>
          <div className="wc-today">{todayCount.toLocaleString()}</div>
          <div className="wc-goal" style={{ marginTop: 2 }}>words today</div>
        </div>
        <div className="wc-goal" style={{ textAlign: "right" }}>
          <div style={{ color: todayCount >= goal ? "var(--green-ok)" : "var(--text-dim)" }}>
            {todayCount >= goal ? "GOAL MET ✓" : `${goal - todayCount} to go`}
          </div>
          <div>goal: {goal.toLocaleString()}</div>
        </div>
      </div>
      <div className="bar-chart" style={{ "--goal-pct": goalPct }}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const count = isToday ? todayCount : d.count;
          const height = count === 0 ? 4 : Math.max((count / maxCount) * 100, 6);
          const cls = isToday ? "bar bar-today" : count === 0 ? "bar bar-empty" : count >= goal ? "bar bar-goal" : "bar bar-partial";
          return <div key={d.date} className={cls} style={{ height: `${height}%` }} data-count={count} title={`${d.label}: ${count}`} />;
        })}
      </div>
    </div>
  );
}

// ─── FORMAT TOOLBAR ───────────────────────────────────────────────────────────
function FormatToolbar({ editor }) {
  if (!editor) return null;
  const btn = (label, isActive, action, icon, title) => (
    <button
      key={label}
      className={`fmt-btn ${isActive ? "active" : ""}`}
      onClick={action}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  return (
    <div className="format-toolbar">
      {btn("h1", editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <H1Icon />, "Heading 1")}
      {btn("h2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <H2Icon />, "Heading 2")}
      {btn("h3", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <H3Icon />, "Heading 3")}
      <div className="fmt-divider" />
      {btn("bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <BoldIcon />, "Bold (⌘B)")}
      {btn("italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <ItalicIcon />, "Italic (⌘I)")}
      {btn("strike", editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <StrikeIcon />, "Strikethrough")}
      {btn("code", editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <CodeIcon />, "Monospace")}
      <div className="fmt-divider" />
      {btn("blockquote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <QuoteIcon />, "Block quote")}
    </div>
  );
}

// ─── CHAPTER EDITOR ───────────────────────────────────────────────────────────
function ChapterEditor({ chapter, onUpdate, onWordCount }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: chapter.content,
    autofocus: "end",
    onCreate: ({ editor }) => {
      const text = editor.getText();
      onWordCount(text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
      editor.commands.focus("end");
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(chapter.id, html);
      const text = editor.getText();
      const wc = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
      onWordCount(wc);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        "data-placeholder": "Begin writing...",
      },
    },
  }, [chapter.id]); // re-init when chapter changes

  return (
    <>
      <FormatToolbar editor={editor} />
      <div className="editor-wrap" onClick={() => editor && editor.commands.focus("end")}>
        <div className="editor-column">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}

// ─── CHAPTER ITEM ─────────────────────────────────────────────────────────────
function ChapterItem({ ch, isActive, isEditing, onSelect, onStartEdit, onTitleChange, onTitleBlur, onTitleKeyDown, onDelete, onDragStart, onDragOver, onDrop, isDragging, isDragOver }) {
  return (
    <div
      className={`nav-item ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
      onClick={() => onSelect(ch.id)}
      onDoubleClick={() => onStartEdit(ch.id)}
      draggable
      onDragStart={(e) => onDragStart(e, ch.id)}
      onDragOver={(e) => onDragOver(e, ch.id)}
      onDrop={(e) => onDrop(e, ch.id)}
      onDragEnd={() => {}}
    >
      <div className="nav-item-grip"><GripIcon /></div>
      <div className="nav-item-dot" />
      <div className="nav-item-name">
        {isEditing ? (
          <input className="inline-edit" value={ch.title} autoFocus
            onChange={(e) => onTitleChange(ch.id, e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={onTitleKeyDown}
            onClick={(e) => e.stopPropagation()} />
        ) : ch.title}
      </div>
      <div className="nav-item-actions">
        <div className="nav-item-btn" onClick={(e) => { e.stopPropagation(); onDelete(ch.id); }}><TrashIcon /></div>
      </div>
    </div>
  );
}

// ─── PHOTO ────────────────────────────────────────────────────────────────────
function CharPhoto({ photo, onUpload }) {
  const fileRef = useRef();
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div className="char-photo-wrap">
      {photo ? (
        <>
          <img className="char-photo" src={photo} alt="Character" />
          <div className="char-photo-overlay" onClick={() => fileRef.current.click()}>
            <CameraIcon /><span>Replace</span>
          </div>
        </>
      ) : (
        <div className="char-photo-placeholder" onClick={() => fileRef.current.click()}>
          <PersonIcon /><span className="char-photo-hint">Upload<br />photo</span>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ─── TRASH DOCK ───────────────────────────────────────────────────────────────
function TrashDock({ trashedChapters, trashedCharacters, onRestoreChapter, onPermDeleteChapter, onRestoreChar, onPermDeleteChar, onPreview }) {
  const [open, setOpen] = useState(false);
  const total = trashedChapters.length + trashedCharacters.length;
  return (
    <div className="trash-dock">
      <div className="trash-dock-toggle" onClick={() => setOpen((v) => !v)}>
        <div className="trash-dock-left">
          <TrashIcon size={11} />
          <span className={`trash-dock-label ${total > 0 ? "has-items" : ""}`}>Trash</span>
          {total > 0 && <span className="trash-badge">{total}</span>}
        </div>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </div>
      {open && (
        <div className="trash-dock-panel">
          {total === 0 && <div style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>EMPTY</div>}
          {trashedChapters.length > 0 && (
            <><div className="trash-type-label">Chapters</div>
            {trashedChapters.map((ch) => (
              <div key={ch.id} className="nav-item trashed" onClick={() => onPreview("chapter", ch.id)}>
                <div className="nav-item-name">{ch.title}</div>
                <div className="nav-item-actions">
                  <div className="nav-item-btn restore" onClick={(e) => { e.stopPropagation(); onRestoreChapter(ch.id); }}><RestoreIcon /></div>
                  <div className="nav-item-btn" onClick={(e) => { e.stopPropagation(); onPermDeleteChapter(ch.id); }} style={{ color: "var(--red-alert)" }}><TrashIcon /></div>
                </div>
              </div>
            ))}</>
          )}
          {trashedCharacters.length > 0 && (
            <><div className="trash-type-label">Characters</div>
            {trashedCharacters.map((ch) => (
              <div key={ch.id} className="nav-item trashed" onClick={() => onPreview("character", ch.id)}>
                <div className="nav-item-name">{ch.name || "Unnamed"}</div>
                <div className="nav-item-actions">
                  <div className="nav-item-btn restore" onClick={(e) => { e.stopPropagation(); onRestoreChar(ch.id); }}><RestoreIcon /></div>
                  <div className="nav-item-btn" onClick={(e) => { e.stopPropagation(); onPermDeleteChar(ch.id); }} style={{ color: "var(--red-alert)" }}><TrashIcon /></div>
                </div>
              </div>
            ))}</>
          )}
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [trashedChapters, setTrashedChapters] = useState([]);
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);
  const [trashedCharacters, setTrashedCharacters] = useState([]);
  const [activeView, setActiveView] = useState({ type: "chapter", id: _initCh1Id });
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [charsOpen, setCharsOpen] = useState(true);
  const [wordCounts] = useState(generateFakeWordCounts);
  const [todayCount, setTodayCount] = useState(0);
  const [currentChapterWC, setCurrentChapterWC] = useState(0);
  const [editingTitle, setEditingTitle] = useState(null);
  const [saveStatus, setSaveStatus] = useState("SYNCED");
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const saveTimerRef = useRef(null);

  const activeChapter = chapters.find((c) => c.id === activeView?.id);
  const activeCharacter = characters.find((c) => c.id === activeView?.id);
  const totalWords = chapters.reduce((sum, c) => {
    const div = document.createElement("div");
    div.innerHTML = c.content || "";
    const text = div.textContent || "";
    return sum + (text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
  }, 0);

  function triggerSave() {
    setSaveStatus("SAVING...");
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("SYNCED"), 800);
  }

  function updateChapterContent(id, html) {
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, content: html } : c));
    triggerSave();
  }

  function updateChapterTitle(id, title) { setChapters((prev) => prev.map((c) => c.id === id ? { ...c, title } : c)); }

  function addChapter() {
    const newId = Date.now();
    setChapters((prev) => [...prev, { id: newId, title: `Chapter ${prev.length + 1}`, content: "<p></p>" }]);
    setActiveView({ type: "chapter", id: newId });
  }

  function deleteChapter(id) {
    const ch = chapters.find((c) => c.id === id);
    if (!ch) return;
    const updated = chapters.filter((c) => c.id !== id);
    setChapters(updated);
    setTrashedChapters((prev) => [{ ...ch, trashedAt: Date.now() }, ...prev]);
    if (activeView?.id === id) setActiveView(updated.length > 0 ? { type: "chapter", id: updated[0].id } : null);
  }

  function restoreChapter(id) {
    const ch = trashedChapters.find((c) => c.id === id);
    if (!ch) return;
    const { trashedAt, ...restored } = ch;
    setTrashedChapters((prev) => prev.filter((c) => c.id !== id));
    setChapters((prev) => [...prev, restored]);
    setActiveView({ type: "chapter", id: restored.id });
  }

  function permDeleteChapter(id) { setTrashedChapters((prev) => prev.filter((c) => c.id !== id)); }

  function handleDragStart(e, id) { setDragId(id); e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e, id) { e.preventDefault(); if (id !== dragId) setDragOverId(id); }
  function handleDrop(e, targetId) {
    e.preventDefault();
    if (dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const from = chapters.findIndex((c) => c.id === dragId);
    const to = chapters.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;
    const r = [...chapters]; const [m] = r.splice(from, 1); r.splice(to, 0, m);
    setChapters(r); setDragId(null); setDragOverId(null);
  }

  function addCharacter() {
    const newId = Date.now();
    setCharacters((prev) => [...prev, { id: newId, name: "New Character", age: "", appearance: "", history: "", role: "", arc: "", photo: null }]);
    setActiveView({ type: "character", id: newId });
  }

  function deleteCharacter(id) {
    const ch = characters.find((c) => c.id === id);
    if (!ch) return;
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setTrashedCharacters((prev) => [{ ...ch, trashedAt: Date.now() }, ...prev]);
    if (activeView?.id === id) setActiveView(chapters.length > 0 ? { type: "chapter", id: chapters[0].id } : null);
  }

  function restoreCharacter(id) {
    const ch = trashedCharacters.find((c) => c.id === id);
    if (!ch) return;
    const { trashedAt, ...restored } = ch;
    setTrashedCharacters((prev) => prev.filter((c) => c.id !== id));
    setCharacters((prev) => [...prev, restored]);
    setActiveView({ type: "character", id: restored.id });
  }

  function permDeleteCharacter(id) { setTrashedCharacters((prev) => prev.filter((c) => c.id !== id)); }
  function updateCharacter(id, field, value) { setCharacters((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c)); }

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <HexIcon />
            <div>
              <div className="logo-text">7315-CTR0 EC</div>
              <div className="logo-sub">MANUSCRIPT_SYSTEM v0.1</div>
            </div>
          </div>

          <div className="sidebar-scroll">
            <WordCountGraph data={wordCounts} todayCount={totalWords} goal={DAILY_GOAL} />

            <div className="section-header" onClick={() => setChaptersOpen((v) => !v)}>
              <div className="section-header-left">
                {chaptersOpen ? <ChevronDown /> : <ChevronRight />}
                <span className="section-title">Manuscript</span>
              </div>
              <div className="section-actions" onClick={(e) => e.stopPropagation()}>
                <button className="section-btn" onClick={addChapter}><PlusIcon /></button>
              </div>
            </div>

            {chaptersOpen && chapters.map((ch) => (
              <ChapterItem key={ch.id} ch={ch}
                isActive={activeView?.type === "chapter" && activeView.id === ch.id}
                isEditing={editingTitle === ch.id}
                onSelect={(id) => setActiveView({ type: "chapter", id })}
                onStartEdit={(id) => setEditingTitle(id)}
                onTitleChange={updateChapterTitle}
                onTitleBlur={() => setEditingTitle(null)}
                onTitleKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)}
                onDelete={deleteChapter}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                isDragging={dragId === ch.id} isDragOver={dragOverId === ch.id}
              />
            ))}

            <div className="sep" />

            <div className="section-header" onClick={() => setCharsOpen((v) => !v)}>
              <div className="section-header-left">
                {charsOpen ? <ChevronDown /> : <ChevronRight />}
                <span className="section-title">Characters</span>
              </div>
              <div className="section-actions" onClick={(e) => e.stopPropagation()}>
                <button className="section-btn" onClick={addCharacter}><PlusIcon /></button>
              </div>
            </div>

            {charsOpen && characters.map((ch) => (
              <div key={ch.id}
                className={`nav-item ${activeView?.type === "character" && activeView.id === ch.id ? "active" : ""}`}
                onClick={() => setActiveView({ type: "character", id: ch.id })}
              >
                <div className="nav-item-dot" />
                <div className="nav-item-name">{ch.name || "Unnamed"}</div>
                <div className="nav-item-actions">
                  <div className="nav-item-btn" onClick={(e) => { e.stopPropagation(); deleteCharacter(ch.id); }}><TrashIcon /></div>
                </div>
              </div>
            ))}
          </div>

          <TrashDock
            trashedChapters={trashedChapters} trashedCharacters={trashedCharacters}
            onRestoreChapter={restoreChapter} onPermDeleteChapter={permDeleteChapter}
            onRestoreChar={restoreCharacter} onPermDeleteChar={permDeleteCharacter}
            onPreview={(type, id) => setActiveView({ type, id })}
          />

          <div className="system-bar">
            <span className="sys-text">{totalWords.toLocaleString()} words total</span>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <span className="topbar-breadcrumb">{activeView?.type === "chapter" ? "MANUSCRIPT //" : "CHARACTERS //"}</span>
              {activeView?.type === "chapter" && activeChapter && (
                <input className="topbar-title-input" value={activeChapter.title}
                  onChange={(e) => updateChapterTitle(activeChapter.id, e.target.value)} placeholder="Chapter title..." />
              )}
              {activeView?.type === "character" && activeCharacter && (
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                  {activeCharacter.name || "Unnamed Character"}
                </span>
              )}
            </div>
            <div className="topbar-right">
              {activeView?.type === "chapter" && (
                <span className="topbar-wc"><span>{currentChapterWC.toLocaleString()}</span> words</span>
              )}
              <button className="export-btn" onClick={() => exportMarkdown(chapters)} title="Export all chapters as Markdown">
                <DownloadIcon /> .md
              </button>
              <button className="export-btn" onClick={() => exportDocx(chapters)} title="Export all chapters as Word document">
                <DownloadIcon /> .docx
              </button>
              <div className="status-chip"><div className="status-dot" />{saveStatus}</div>
            </div>
          </div>

          {!activeView && (
            <div className="empty-state">
              <div className="empty-hex">
                <svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="0.75"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7" /></svg>
              </div>
              <span className="empty-text">Select or create a chapter</span>
            </div>
          )}

          {activeView?.type === "chapter" && activeChapter && (
            <ChapterEditor
              chapter={activeChapter}
              onUpdate={updateChapterContent}
              onWordCount={setCurrentChapterWC}
            />
          )}

          {activeView?.type === "character" && activeCharacter && (
            <div className="char-panel">
              <div className="char-header">
                <CharPhoto photo={activeCharacter.photo} onUpload={(url) => updateCharacter(activeCharacter.id, "photo", url)} />
                <div className="char-header-info">
                  <div className="char-name-row">
                    <input className="char-name-input" value={activeCharacter.name}
                      onChange={(e) => updateCharacter(activeCharacter.id, "name", e.target.value)}
                      placeholder="CHARACTER NAME" />
                    <div className="char-id-badge">ID_{String(activeCharacter.id).slice(-6)}</div>
                  </div>
                </div>
              </div>
              <div className="char-fields">
                <div>
                  <div className="char-field-label">Age</div>
                  <input className="char-field-input" value={activeCharacter.age}
                    onChange={(e) => updateCharacter(activeCharacter.id, "age", e.target.value)} placeholder="Age or approximate..." />
                </div>
                <div>
                  <div className="char-field-label">Role</div>
                  <input className="char-field-input" value={activeCharacter.role}
                    onChange={(e) => updateCharacter(activeCharacter.id, "role", e.target.value)} placeholder="Protagonist, antagonist..." />
                </div>
                <div className="char-field-full">
                  <div className="char-field-label">Appearance</div>
                  <textarea className="char-field-textarea" value={activeCharacter.appearance}
                    onChange={(e) => updateCharacter(activeCharacter.id, "appearance", e.target.value)} placeholder="Physical description..." rows={3} />
                </div>
                <div className="char-field-full">
                  <div className="char-field-label">History</div>
                  <textarea className="char-field-textarea" value={activeCharacter.history}
                    onChange={(e) => updateCharacter(activeCharacter.id, "history", e.target.value)} placeholder="Background, backstory, relevant history..." rows={4} />
                </div>
                <div className="char-field-full">
                  <div className="char-field-label">Character Arc</div>
                  <textarea className="char-field-textarea large" value={activeCharacter.arc}
                    onChange={(e) => updateCharacter(activeCharacter.id, "arc", e.target.value)} placeholder="Where do they start? Where do they end up? What changes them?" rows={6} />
                </div>
              </div>
            </div>
          )}

          <div className="system-bar">
            <span className="sys-text">7315-CTR0 EC</span>
            <span className="sys-text" style={{ marginLeft: "auto" }}>
              <span className="sys-ok">■</span> LOCAL MODE — no data persisted
            </span>
          </div>
        </main>
      </div>
    </>
  );
}
