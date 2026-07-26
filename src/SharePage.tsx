import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, FileText, FolderOpen } from 'lucide-react'
import { getShare } from './api'
import BrandMark from './BrandMark'
import LoadingState from './LoadingState'
import type { DocumentLink } from './types'
import './App.css'

export default function SharePage() {
  const { token } = useParams()
  const [items, setItems] = useState<DocumentLink[]>([])
  const [title, setTitle] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getShare(token)
        if (cancelled) return
        setItems(data.share.items)
        setTitle(data.share.title)
        setCreatedAt(data.share.createdAt)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Share not found')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />

      <header className="top">
        <BrandMark size="md" />
        <p className="tagline">{title || 'Shared documents'}</p>
        {createdAt && (
          <p className="share-date">Shared {new Date(createdAt).toLocaleString()}</p>
        )}
      </header>

      {loading && <LoadingState />}
      {error && <p className="empty">{error}</p>}

      {!loading && !error && (
        <ul className="doc-list">
          {items.map((doc) => (
            <li key={doc.id} className="doc-row share-item">
              <div className="doc-main static">
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
              </div>
              <div className="doc-actions">
                <a className="btn secondary small" href={doc.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
