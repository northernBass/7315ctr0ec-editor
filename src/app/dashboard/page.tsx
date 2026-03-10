"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from "docx";

const STATUSES = ["Draft", "Revising", "Complete", "On Hold"];

const STATUS_COLORS = {
  "Draft":     { color: "#4fc3f7", bg: "rgba(79,195,247,0.08)",  border: "rgba(79,195,247,0.25)" },
  "Revising":  { color: "#ffb74d", bg: "rgba(255,183,77,0.08)",  border: "rgba(255,183,77,0.25)" },
  "Complete":  { color: "#00e5a0", bg: "rgba(0,229,160,0.08)",   border: "rgba(0,229,160,0.25)" },
  "On Hold":   { color: "#3d5a7a", bg: "rgba(61,90,122,0.08)",   border: "rgba(61,90,122,0.25)" },
};

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
    --font-ui: 'Rajdhani', sans-serif;
    --font-mono: 'Share Tech Mono', monospace;
    --font-body: 'Exo 2', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg-void); color: var(--text-primary); font-family: var(--font-ui); min-height: 100vh; }
  body::before {
    content: ''; position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events: none; z-index: 9999;
  }

  .dash-shell { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── TOPBAR ── */
  .dash-topbar {
    height: 52px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; border-bottom: 1px solid var(--border-dim);
    background: var(--bg-deep); flex-shrink: 0; position: sticky; top: 0; z-index: 100;
  }
  .dash-topbar-left { display: flex; align-items: center; gap: 10px; }
  .dash-logo-text { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.15em; color: var(--blue-core); }
  .dash-logo-sub { font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em; }
  .dash-topbar-right { display: flex; align-items: center; gap: 10px; }

  /* ── TABS ── */
  .dash-tabs { display: flex; gap: 2px; padding: 0 32px; border-bottom: 1px solid var(--border-dim); background: var(--bg-deep); }
  .dash-tab {
    font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-dim); padding: 10px 14px; cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.15s; user-select: none;
  }
  .dash-tab:hover { color: var(--text-secondary); }
  .dash-tab.active { color: var(--blue-core); border-bottom-color: var(--blue-core); }
  .dash-tab-badge { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: var(--amber); color: var(--bg-void); font-size: 8px; margin-left: 6px; }

  /* ── CONTENT ── */
  .dash-content { flex: 1; padding: 32px; }
  .dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

  /* ── NEW BUTTON ── */
  .dash-new-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 16px; border: 1px solid var(--blue-core); border-radius: 3px;
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--blue-core); background: transparent; cursor: pointer; transition: all 0.15s;
  }
  .dash-new-btn:hover { background: var(--blue-glow); box-shadow: 0 0 12px var(--blue-glow); }

  /* ── CARD ── */
  .ms-card {
    background: var(--bg-deep); border: 1px solid var(--border-dim); border-radius: 4px;
    overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s; display: flex; flex-direction: column;
    cursor: pointer; position: relative;
  }
  .ms-card:hover { border-color: var(--border-bright); box-shadow: 0 0 20px rgba(79,195,247,0.08); }
  .ms-card.trashed { opacity: 0.6; }
  .ms-card.trashed:hover { opacity: 0.8; }

  .ms-cover {
    width: 100%; aspect-ratio: 2/3; max-height: 180px; object-fit: cover;
    background: var(--bg-panel); display: flex; align-items: center; justify-content: center;
    border-bottom: 1px solid var(--border-dim); flex-shrink: 0; overflow: hidden;
  }
  .ms-cover img { width: 100%; height: 100%; object-fit: cover; }
  .ms-cover-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; color: var(--text-dim); }
  .ms-cover-placeholder-text { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; }

  .ms-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .ms-title { font-family: var(--font-ui); font-size: 16px; font-weight: 700; letter-spacing: 0.05em; color: var(--text-primary); line-height: 1.2; }
  .ms-author { font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; }
  .ms-series { font-family: var(--font-mono); font-size: 9px; color: var(--blue-core); letter-spacing: 0.08em; }
  .ms-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .ms-wc { font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); }
  .ms-wc span { color: var(--blue-core); }
  .ms-updated { font-family: var(--font-mono); font-size: 8px; color: var(--text-dim); letter-spacing: 0.05em; }

  .ms-status-badge {
    display: inline-flex; align-items: center;
    font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 2px; border: 1px solid; width: fit-content;
  }

  .ms-actions { display: flex; gap: 4px; padding: 10px 16px 12px; border-top: 1px solid var(--border-dim); }
  .ms-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border: 1px solid var(--border-dim); border-radius: 2px;
    font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-dim); background: transparent; cursor: pointer; transition: all 0.15s;
  }
  .ms-btn:hover { border-color: var(--blue-core); color: var(--blue-core); background: var(--blue-glow); }
  .ms-btn.danger:hover { border-color: var(--red-alert); color: var(--red-alert); background: rgba(255,68,68,0.08); }
  .ms-btn.restore:hover { border-color: var(--green-ok); color: var(--green-ok); background: rgba(0,229,160,0.08); }
  .ms-btn-spacer { flex: 1; }

  /* ── NEW CARD (create) ── */
  .ms-new-card {
    background: transparent; border: 1px dashed var(--border-dim); border-radius: 4px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; cursor: pointer; transition: all 0.15s; min-height: 240px; padding: 24px;
    color: var(--text-dim);
  }
  .ms-new-card:hover { border-color: var(--blue-core); color: var(--blue-core); background: var(--blue-glow); }
  .ms-new-card-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(5,8,16,0.85); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .modal {
    background: var(--bg-deep); border: 1px solid var(--border-med); border-radius: 6px;
    width: 100%; max-width: 480px; padding: 28px; display: flex; flex-direction: column; gap: 20px;
    box-shadow: 0 0 40px rgba(79,195,247,0.1);
  }
  .modal-title { font-family: var(--font-ui); font-size: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-primary); }
  .modal-fields { display: flex; flex-direction: column; gap: 14px; }
  .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .modal-field-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 5px; }
  .modal-input, .modal-select {
    width: 100%; background: var(--bg-panel); border: 1px solid var(--border-dim); border-radius: 3px;
    outline: none; font-family: var(--font-body); font-size: 14px; font-weight: 300; color: var(--text-primary);
    padding: 8px 12px; transition: border-color 0.15s; letter-spacing: 0.01em;
  }
  .modal-select { cursor: pointer; }
  .modal-input:focus, .modal-select:focus { border-color: var(--blue-core); }
  .modal-select option { background: var(--bg-panel); }
  .modal-cover-row { display: flex; align-items: center; gap: 14px; }
  .modal-cover-preview { width: 64px; height: 88px; object-fit: cover; border-radius: 3px; border: 1px solid var(--border-dim); flex-shrink: 0; }
  .modal-cover-placeholder { width: 64px; height: 88px; border-radius: 3px; border: 1px dashed var(--border-dim); display: flex; align-items: center; justify-content: center; color: var(--text-dim); flex-shrink: 0; background: var(--bg-panel); cursor: pointer; transition: all 0.15s; }
  .modal-cover-placeholder:hover { border-color: var(--blue-core); color: var(--blue-core); }
  .modal-cover-info { display: flex; flex-direction: column; gap: 6px; }
  .modal-cover-btn { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border: 1px solid var(--border-dim); border-radius: 2px; font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); background: transparent; cursor: pointer; transition: all 0.15s; width: fit-content; }
  .modal-cover-btn:hover { border-color: var(--blue-core); color: var(--blue-core); }
  .modal-cover-hint { font-family: var(--font-mono); font-size: 8px; color: var(--text-dim); letter-spacing: 0.05em; line-height: 1.6; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .modal-btn {
    padding: 8px 20px; border-radius: 3px; font-family: var(--font-mono); font-size: 10px;
    letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.15s;
  }
  .modal-btn.primary { background: var(--blue-core); color: var(--bg-void); border: 1px solid var(--blue-core); font-weight: 600; }
  .modal-btn.primary:hover { background: var(--blue-bright); border-color: var(--blue-bright); }
  .modal-btn.secondary { background: transparent; color: var(--text-dim); border: 1px solid var(--border-dim); }
  .modal-btn.secondary:hover { border-color: var(--text-dim); color: var(--text-primary); }

  /* ── LOADING ── */
  .dash-loading { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; }
  .dash-loading-text { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

  .empty-dash { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--text-dim); }
  .empty-dash-text { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function countWords(chapters) {
  return chapters.reduce((sum, c) => {
    const div = document.createElement("div");
    div.innerHTML = c.content || "";
    const text = div.textContent || "";
    return sum + (text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
  }, 0);
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function htmlToMarkdown(html) {
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n").replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n").replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**").replace(/<em>(.*?)<\/em>/gi, "*$1*").replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`").replace(/<p>(.*?)<\/p>/gi, "$1\n\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\n{3,}/g, "\n\n").trim();
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function doExportMd(ms, chapters) {
  const md = chapters.map(ch => `# ${ch.title}\n\n${htmlToMarkdown(ch.content || "")}`).join("\n\n---\n\n");
  downloadFile(md, `${ms.title}.md`, "text/markdown");
}

async function doExportDocx(ms, chapters) {
  try {
    const sections = [];
    chapters.forEach((ch, i) => {
      sections.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_1 }));
      const div = document.createElement("div"); div.innerHTML = ch.content || "";
      div.childNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === "p") sections.push(new Paragraph({ children: [new TextRun({ text: el.textContent || "" })] }));
      });
      if (i < chapters.length - 1) sections.push(new Paragraph({ children: [new PageBreak()] }));
    });
    const doc = new Document({ sections: [{ children: sections }], styles: { default: { document: { run: { font: "Georgia", size: 24 } } } } });
    const buffer = await Packer.toBlob(doc);
    const url = URL.createObjectURL(buffer);
    const a = document.createElement("a"); a.href = url; a.download = `${ms.title}.docx`; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { alert("DOCX export failed."); }
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const PlusIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon = () => <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const RestoreIcon = () => <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const EditIcon = () => <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DownloadIcon = () => <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const CameraIcon = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const BookIcon = () => <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;

// ─── MANUSCRIPT MODAL ─────────────────────────────────────────────────────────
function ManuscriptModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [series, setSeries] = useState(initial?.series || "");
  const [seriesNumber, setSeriesNumber] = useState(initial?.series_number || "");
  const [status, setStatus] = useState(initial?.status || "Draft");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const isEdit = !!initial;

  async function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), series: series.trim() || null, series_number: seriesNumber ? Number(seriesNumber) : null, status, cover_url: coverUrl });
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? "Edit Manuscript" : "New Manuscript"}</div>
        <div className="modal-fields">
          <div className="modal-cover-row">
            {coverUrl
              ? <img className="modal-cover-preview" src={coverUrl} alt="Cover" onClick={() => fileRef.current.click()} style={{ cursor: "pointer" }} />
              : <div className="modal-cover-placeholder" onClick={() => fileRef.current.click()}><CameraIcon /></div>}
            <div className="modal-cover-info">
              <button className="modal-cover-btn" onClick={() => fileRef.current.click()}>
                <CameraIcon /> {uploading ? "Uploading..." : coverUrl ? "Replace cover" : "Upload cover"}
              </button>
              <div className="modal-cover-hint">Recommended: portrait<br />aspect ratio (e.g. 2:3)</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
          </div>
          <div>
            <div className="modal-field-label">Title *</div>
            <input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Manuscript title..." autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <div>
            <div className="modal-field-label">Author</div>
            <input className="modal-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name..." />
          </div>
          <div className="modal-row">
            <div>
              <div className="modal-field-label">Series</div>
              <input className="modal-input" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Series name..." />
            </div>
            <div>
              <div className="modal-field-label">Series #</div>
              <input className="modal-input" type="number" min="1" value={seriesNumber} onChange={(e) => setSeriesNumber(e.target.value)} placeholder="1" />
            </div>
          </div>
          <div>
            <div className="modal-field-label">Status</div>
            <select className="modal-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave} disabled={!title.trim()}>{isEdit ? "Save changes" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MANUSCRIPT CARD ─────────────────────────────────────────────────────────
function ManuscriptCard({ ms, wordCount, onOpen, onEdit, onDelete, onRestore, onPermDelete, onExportMd, onExportDocx, isTrashed }) {
  const sc = STATUS_COLORS[ms.status] || STATUS_COLORS["Draft"];
  return (
    <div className={`ms-card ${isTrashed ? "trashed" : ""}`} onClick={!isTrashed ? onOpen : undefined}>
      <div className="ms-cover" style={{ height: 180 }}>
        {ms.cover_url
          ? <img src={ms.cover_url} alt={ms.title} />
          : <div className="ms-cover-placeholder"><BookIcon /><span className="ms-cover-placeholder-text">No cover</span></div>}
      </div>
      <div className="ms-body">
        <div className="ms-title">{ms.title}</div>
        {ms.author && <div className="ms-author">by {ms.author}</div>}
        {ms.series && <div className="ms-series">{ms.series}{ms.series_number ? ` #${ms.series_number}` : ""}</div>}
        <div className="ms-meta">
          <div className="ms-wc"><span>{wordCount.toLocaleString()}</span> words</div>
          <div className="ms-updated">{formatDate(ms.updated_at)}</div>
        </div>
        {!isTrashed && (
          <div className="ms-status-badge" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
            {ms.status}
          </div>
        )}
      </div>
      <div className="ms-actions" onClick={(e) => e.stopPropagation()}>
        {isTrashed ? (
          <>
            <button className="ms-btn restore" onClick={onRestore}><RestoreIcon /> Restore</button>
            <span className="ms-btn-spacer" />
            <button className="ms-btn danger" onClick={onPermDelete}><TrashIcon /> Delete forever</button>
          </>
        ) : (
          <>
            <button className="ms-btn" onClick={onEdit}><EditIcon /> Edit</button>
            <button className="ms-btn" onClick={onExportMd}><DownloadIcon /> .md</button>
            <button className="ms-btn" onClick={onExportDocx}><DownloadIcon /> .docx</button>
            <span className="ms-btn-spacer" />
            <button className="ms-btn danger" onClick={onDelete}><TrashIcon /></button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [manuscripts, setManuscripts] = useState([]);
  const [wordCounts, setWordCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const [editingMs, setEditingMs] = useState(null);

  useEffect(() => {
    loadManuscripts();
  }, []);

  async function loadManuscripts() {
    const { data: mss } = await supabase.from("manuscripts").select("*").order("updated_at", { ascending: false });
    setManuscripts(mss || []);

    // Load word counts for all manuscripts
    if (mss && mss.length > 0) {
      const counts = {};
      await Promise.all(mss.map(async (ms) => {
        const { data: chapters } = await supabase.from("chapters").select("content").eq("manuscript_id", ms.id).is("deleted_at", null);
        counts[ms.id] = countWords(chapters || []);
      }));
      setWordCounts(counts);
    }
    setLoading(false);
  }

  async function handleCreate(fields) {
    const { data, error } = await supabase.from("manuscripts").insert(fields).select().single();
    if (error || !data) return;
    setManuscripts((prev) => [data, ...prev]);
    setShowModal(false);
    router.push(`/editor/${data.id}`);
  }

  async function handleEdit(fields) {
    const { data, error } = await supabase.from("manuscripts").update(fields).eq("id", editingMs.id).select().single();
    if (error || !data) return;
    setManuscripts((prev) => prev.map((m) => m.id === data.id ? data : m));
    setEditingMs(null);
  }

  async function handleDelete(id) {
    const deleted_at = new Date().toISOString();
    await supabase.from("manuscripts").update({ deleted_at }).eq("id", id);
    setManuscripts((prev) => prev.map((m) => m.id === id ? { ...m, deleted_at } : m));
  }

  async function handleRestore(id) {
    await supabase.from("manuscripts").update({ deleted_at: null }).eq("id", id);
    setManuscripts((prev) => prev.map((m) => m.id === id ? { ...m, deleted_at: null } : m));
  }

  async function handlePermDelete(id) {
    await supabase.from("manuscripts").delete().eq("id", id);
    setManuscripts((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleExport(ms, format) {
    const { data: chapters } = await supabase.from("chapters").select("*").eq("manuscript_id", ms.id).is("deleted_at", null).order("position");
    if (!chapters) return;
    if (format === "md") await doExportMd(ms, chapters);
    else await doExportDocx(ms, chapters);
  }

  const active = manuscripts.filter((m) => !m.deleted_at);
  const trashed = manuscripts.filter((m) => m.deleted_at);

  return (
    <>
      <style>{css}</style>
      <div className="dash-shell">
        <div className="dash-topbar">
          <div className="dash-topbar-left">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7"/></svg>
            <div>
              <div className="dash-logo-text">7315-CTR0 EC</div>
              <div className="dash-logo-sub">MANUSCRIPT SYSTEM</div>
            </div>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-new-btn" onClick={() => setShowModal(true)}><PlusIcon /> New Manuscript</button>
          </div>
        </div>

        <div className="dash-tabs">
          <div className={`dash-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
            Manuscripts {active.length > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", marginLeft: 6 }}>({active.length})</span>}
          </div>
          <div className={`dash-tab ${tab === "trash" ? "active" : ""}`} onClick={() => setTab("trash")}>
            Trash {trashed.length > 0 && <span className="dash-tab-badge">{trashed.length}</span>}
          </div>
        </div>

        <div className="dash-content">
          {loading ? (
            <div className="dash-loading">
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="0.75" style={{ animation: "float 2s ease-in-out infinite" }}><polygon points="12 2 22 7 22 17 12 22 2 17 2 7"/></svg>
              <span className="dash-loading-text">Loading manuscripts...</span>
            </div>
          ) : (
            <div className="dash-grid">
              {tab === "active" && (
                <>
                  {active.length === 0 && (
                    <div className="empty-dash">
                      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="0.75" style={{ opacity: 0.3 }}><polygon points="12 2 22 7 22 17 12 22 2 17 2 7"/></svg>
                      <span className="empty-dash-text">No manuscripts yet</span>
                    </div>
                  )}
                  {active.map((ms) => (
                    <ManuscriptCard key={ms.id} ms={ms} wordCount={wordCounts[ms.id] || 0}
                      onOpen={() => router.push(`/editor/${ms.id}`)}
                      onEdit={(e) => { setEditingMs(ms); }}
                      onDelete={() => handleDelete(ms.id)}
                      onExportMd={() => handleExport(ms, "md")}
                      onExportDocx={() => handleExport(ms, "docx")}
                      isTrashed={false}
                    />
                  ))}
                  <div className="ms-new-card" onClick={() => setShowModal(true)}>
                    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span className="ms-new-card-label">New Manuscript</span>
                  </div>
                </>
              )}
              {tab === "trash" && (
                <>
                  {trashed.length === 0 && (
                    <div className="empty-dash">
                      <span className="empty-dash-text">Trash is empty</span>
                    </div>
                  )}
                  {trashed.map((ms) => (
                    <ManuscriptCard key={ms.id} ms={ms} wordCount={wordCounts[ms.id] || 0}
                      onRestore={() => handleRestore(ms.id)}
                      onPermDelete={() => handlePermDelete(ms.id)}
                      isTrashed={true}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {(showModal || editingMs) && (
        <ManuscriptModal
          initial={editingMs}
          onSave={editingMs ? handleEdit : handleCreate}
          onClose={() => { setShowModal(false); setEditingMs(null); }}
        />
      )}
    </>
  );
}
