export type DocType = 'file' | 'folder'
export type DocCategory = 'Process' | 'Product' | 'Other'

export interface DocumentLink {
  id: string
  name: string
  label: string
  url: string
  type: DocType
  category: DocCategory
}

export type DocumentInput = Omit<DocumentLink, 'id'> & { id?: string }
