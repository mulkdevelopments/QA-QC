export type DocType = 'file' | 'folder'

export interface Category {
  id: string
  name: string
  sortOrder: number
}

export interface DocumentLink {
  id: string
  name: string
  label: string
  url: string
  type: DocType
  category: string
}

export type DocumentInput = Omit<DocumentLink, 'id'> & { id?: string }
