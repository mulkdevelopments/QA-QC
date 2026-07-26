import type { DocumentInput, DocumentLink } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  }
  return data as T
}

export function login(email: string, password: string) {
  return request<{ user: { id: string; email: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function me() {
  return request<{ user: { id: string; email: string } }>('/api/auth/me')
}

export function listDocuments() {
  return request<{ documents: DocumentLink[] }>('/api/documents')
}

export function createDocument(input: DocumentInput) {
  return request<{ document: DocumentLink }>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateDocument(id: string, input: DocumentInput) {
  return request<{ document: DocumentLink }>(`/api/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteDocument(id: string) {
  return request<{ ok: boolean }>(`/api/documents/${id}`, { method: 'DELETE' })
}

export function createShare(documentIds: string[], title?: string) {
  return request<{
    share: {
      id: string
      token: string
      title: string | null
      createdAt: string
      itemCount: number
      path: string
      url: string
    }
  }>('/api/shares', {
    method: 'POST',
    body: JSON.stringify({ documentIds, title }),
  })
}

export function getShare(token: string) {
  return request<{
    share: {
      token: string
      title: string | null
      createdAt: string
      items: DocumentLink[]
    }
  }>(`/api/shares/${token}`)
}

export function formatEmailBody(docs: DocumentLink[]): string {
  const lines = [
    'Hi,',
    '',
    'Please find the requested documents below:',
    '',
    ...docs.map((d, i) => `${i + 1}. ${d.name}\n   ${d.url}`),
    '',
    'Regards,',
  ]
  return lines.join('\n')
}

export function formatClipboardText(docs: DocumentLink[]): string {
  return docs.map((d) => `${d.name}\n${d.url}`).join('\n\n')
}
