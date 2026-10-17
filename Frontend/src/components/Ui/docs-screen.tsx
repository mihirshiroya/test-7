import { ArrowLeft, BookOpen, Check, Copy, FileText, Menu, Pencil, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DocsChromeProps {
  title: string
  folderId: string
  editable?: boolean
  onSearch: () => void
}

function DocsIdentity({ title, editable }: Pick<DocsChromeProps, 'title' | 'editable'>) {
  return <div className="handbook-identity">
    <span className="handbook-mark" aria-hidden="true"><BookOpen size={19} strokeWidth={1.7} /></span>
    <div className="min-w-0"><p className="truncate font-semibold" title={title}>{title}</p><p className="handbook-caption">{editable ? 'Docs workspace' : 'Handbook'}</p></div>
  </div>
}

export function DocsSidebarHeader({ title, editable, onSearch, onClose }: Omit<DocsChromeProps, 'folderId'> & { onClose: () => void }) {
  return <div className="handbook-sidebar-header">
    <div className="flex min-w-0 items-center justify-between gap-2">
      <DocsIdentity title={title} editable={editable} />
      <button type="button" className="handbook-icon md:hidden" onClick={onClose} aria-label="Close navigation"><X size={16} /></button>
    </div>
    <button type="button" className="handbook-search" onClick={onSearch} aria-label="Search documentation">
      <Search size={14} /><span>Search the docs</span><kbd>⌘ K</kbd>
    </button>
  </div>
}

export function DocsSidebarFooter({ folderId, editable }: Pick<DocsChromeProps, 'folderId' | 'editable'>) {
  return <footer className="handbook-sidebar-footer">
    <Link to="/notes" className="handbook-back"><ArrowLeft size={13} /> All notes</Link>
    <Link to={`/notes/${folderId}${editable ? '' : '/edit'}`} className="handbook-mode-link">
      {editable ? <FileText size={13} /> : <Pencil size={13} />}{editable ? 'View docs' : 'Edit docs'}
    </Link>
  </footer>
}

export function DocsMobileHeader({ title, editable, onSearch, onOpen, open }: Omit<DocsChromeProps, 'folderId'> & { onOpen: () => void; open: boolean }) {
  return <header className="handbook-mobile-header">
    <button type="button" className="handbook-icon" onClick={onOpen} aria-label="Open navigation" aria-expanded={open} aria-controls="handbook-navigation"><Menu size={19} /></button>
    <DocsIdentity title={title} editable={editable} />
    <button type="button" className="handbook-icon" onClick={onSearch} aria-label="Search documentation"><Search size={18} /></button>
  </header>
}

export function DocsCodeBlock({ label, content, copied, onCopy }: { label: string; content: string; copied: boolean; onCopy: () => void }) {
  return <div className="handbook-code">
    <div className="handbook-code-toolbar">
      <span className="truncate font-mono" title={label}>{label}</span>
      <button type="button" onClick={onCopy} aria-label={`Copy ${label}`}>
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>{copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
    <pre tabIndex={0} aria-label={`${label} code`}><code>{content}</code></pre>
  </div>
}
