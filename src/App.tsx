import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Copy,
  FolderOpen,
  FileText,
  Link2,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react'
import type { DocCategory, DocType, DocumentInput, DocumentLink } from './types'
import {
  createDocument,
  createShare,
  deleteDocument,
  formatClipboardText,
  formatEmailBody,
  listDocuments,
  logout,
  me,
  updateDocument,
} from './api'
import BrandMark from './BrandMark'
import LoadingState from './LoadingState'
import './App.css'

type Toast = { message: string; tone: 'ok' | 'err' } | null

const CATEGORIES: Array<DocCategory | 'All'> = ['All', 'Process', 'Product', 'Other']

export default function App() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [docs, setDocs] = useState<DocumentLink[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DocCategory | 'All'>('All')
  const [toast, setToast] = useState<Toast>(null)
  const [editing, setEditing] = useState<DocumentLink | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [busyShare, setBusyShare] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)

  const refreshDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const data = await listDocuments()
      setDocs(data.documents)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to load documents',
        tone: 'err',
      })
    } finally {
      setLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await me()
        if (cancelled) return
        setReady(true)
        await refreshDocs()
      } catch {
        if (!cancelled) navigate('/login', { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshDocs])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((d) => {
      if (category !== 'All' && d.category !== category) return false
      if (!q) return true
      return (
        d.name.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        d.url.toLowerCase().includes(q)
      )
    })
  }, [docs, query, category])

  const selectedDocs = useMemo(
    () => docs.filter((d) => selected.has(d.id)),
    [docs, selected],
  )

  function showToast(message: string, tone: 'ok' | 'err' = 'ok') {
    setToast({ message, tone })
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev)
      filtered.forEach((d) => next.add(d.id))
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function copyLinks() {
    if (!selectedDocs.length) return
    try {
      await navigator.clipboard.writeText(formatClipboardText(selectedDocs))
      showToast(`Copied ${selectedDocs.length} link${selectedDocs.length > 1 ? 's' : ''} — paste into Outlook`)
    } catch {
      showToast('Could not copy to clipboard', 'err')
    }
  }

  function openOutlook() {
    if (!selectedDocs.length) return
    const subject = encodeURIComponent(
      selectedDocs.length === 1
        ? `Document: ${selectedDocs[0].name}`
        : `Requested documents (${selectedDocs.length})`,
    )
    const body = encodeURIComponent(formatEmailBody(selectedDocs))
    const href = `mailto:?subject=${subject}&body=${body}`
    if (href.length > 1800) {
      void copyLinks()
      showToast('Too many links for mailto — copied instead. Paste in Outlook.')
      return
    }
    window.location.href = href
  }

  async function generateShareLink() {
    if (!selectedDocs.length) return
    setBusyShare(true)
    try {
      const { share } = await createShare([...selected])
      const absolute = `${window.location.origin}${share.path}`
      setShareUrl(absolute)
      await navigator.clipboard.writeText(absolute)
      showToast('Share link created and copied')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create share link', 'err')
    } finally {
      setBusyShare(false)
    }
  }

  async function upsert(input: DocumentInput) {
    try {
      if (input.id) {
        await updateDocument(input.id, input)
        showToast('Document updated')
      } else {
        await createDocument(input)
        showToast('Document added')
      }
      setEditing(null)
      setAdding(false)
      await refreshDocs()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'err')
    }
  }

  async function remove(id: string) {
    try {
      await deleteDocument(id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setConfirmDelete(null)
      showToast('Document deleted')
      await refreshDocs()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'err')
    }
  }

  async function handleLogout() {
    await logout().catch(() => undefined)
    navigate('/login', { replace: true })
  }

  if (!ready) {
    return (
      <div className="app">
        <div className="bg-grid" aria-hidden />
        <LoadingState className="loading-full" />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />

      <div className="top-actions">
        <BrandMark size="sm" />
        <button
          type="button"
          className="icon-btn logout-btn"
          onClick={() => void handleLogout()}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>

      <section className="toolbar">
        <div className="search-wrap">
          <Search size={18} strokeWidth={2} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            aria-label="Search documents"
          />
          {query && (
            <button type="button" className="icon-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filters" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              className={category === c ? 'chip active' : 'chip'}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          <button type="button" className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={18} />
            <span>Add link</span>
          </button>
        </div>
      </section>

      <div className="list-meta">
        <span>
          {loadingDocs ? 'Mulk Ecosystem...' : `${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
          {selected.size > 0 ? ` · ${selected.size} selected` : ''}
        </span>
        <div className="list-meta-actions">
          <button type="button" className="text-btn" onClick={selectAllFiltered}>
            Select visible
          </button>
          {selected.size > 0 && (
            <button type="button" className="text-btn" onClick={clearSelection}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ul className="doc-list">
        {filtered.map((doc, i) => {
          const isOn = selected.has(doc.id)
          return (
            <li
              key={doc.id}
              className={isOn ? 'doc-row selected' : 'doc-row'}
              style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            >
              <button
                type="button"
                className="doc-main"
                onClick={() => toggle(doc.id)}
                aria-pressed={isOn}
              >
                <span className={isOn ? 'check on' : 'check'}>
                  {isOn ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="doc-icon" data-type={doc.type}>
                  {doc.type === 'folder' ? <FolderOpen size={18} /> : <FileText size={18} />}
                </span>
                <span className="doc-text">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-meta">
                    <span className="badge">{doc.category}</span>
                    <span className="sep">·</span>
                    <span>{doc.type}</span>
                  </span>
                </span>
              </button>
              <div className="doc-actions">
                <a
                  className="icon-btn"
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={16} />
                </a>
                <button type="button" className="icon-btn" title="Edit" onClick={() => setEditing(doc)}>
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  title="Delete"
                  onClick={() => setConfirmDelete(doc.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          )
        })}
        {!loadingDocs && filtered.length === 0 && (
          <li className="empty">No documents match your search.</li>
        )}
      </ul>

      {selectedDocs.length > 0 && (
        <div className="share-bar" role="region" aria-label="Share selected">
          <div className="share-info">
            <strong>{selectedDocs.length}</strong> ready to share
          </div>
          <div className="share-actions">
            <button type="button" className="btn ghost" onClick={clearSelection}>
              Cancel
            </button>
            <button type="button" className="btn secondary" onClick={() => void copyLinks()}>
              <Copy size={17} />
              <span>Copy</span>
            </button>
            <button type="button" className="btn secondary" onClick={openOutlook}>
              <Mail size={17} />
              <span>Outlook</span>
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={busyShare}
              onClick={() => void generateShareLink()}
            >
              <Link2 size={17} />
              <span>{busyShare ? 'Mulk Ecosystem...' : 'Share link'}</span>
            </button>
          </div>
        </div>
      )}

      {shareUrl && (
        <div className="modal-backdrop" onClick={() => setShareUrl(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="modal-head">
              <h2>Share link ready</h2>
              <button type="button" className="icon-btn" onClick={() => setShareUrl(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="modal-copy">Anyone with this link can view the selected documents (no login).</p>
            <input className="share-url-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
            <div className="modal-actions">
              <a className="btn ghost" href={shareUrl} target="_blank" rel="noreferrer">
                Open
              </a>
              <button
                type="button"
                className="btn primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl)
                  showToast('Share link copied')
                }}
              >
                <Copy size={16} />
                Copy again
              </button>
            </div>
          </div>
        </div>
      )}

      {(adding || editing) && (
        <DocForm
          initial={editing}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
          onSave={(input) => void upsert(input)}
        />
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>Delete this document?</h2>
            <p>This removes it from Mulk connect. The SharePoint file itself is not deleted.</p>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={() => void remove(confirmDelete)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  )
}

function DocForm({
  initial,
  onClose,
  onSave,
}: {
  initial: DocumentLink | null
  onClose: () => void
  onSave: (input: DocumentInput) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [type, setType] = useState<DocType>(initial?.type ?? 'file')
  const [category, setCategory] = useState<DocCategory>(initial?.category ?? 'Other')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required.')
      return
    }
    try {
      new URL(url.trim())
    } catch {
      setError('Enter a valid URL (https://…).')
      return
    }
    onSave({
      id: initial?.id,
      name: name.trim(),
      label: label.trim() || name.trim(),
      url: url.trim(),
      type,
      category,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h2>{initial ? 'Edit document' : 'Add document'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SASO Certificate" autoFocus />
        </label>

        <label className="field">
          <span>Short label (optional)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Shown in emails if different" />
        </label>

        <label className="field">
          <span>SharePoint / OneDrive link</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
              <option value="Process">Process</option>
              <option value="Product">Product</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as DocType)}>
              <option value="file">File</option>
              <option value="folder">Folder</option>
            </select>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {initial ? 'Save changes' : 'Add document'}
          </button>
        </div>
      </form>
    </div>
  )
}
