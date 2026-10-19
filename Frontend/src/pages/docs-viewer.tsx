import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DocsCodeBlock, DocsMobileHeader, DocsSidebarFooter, DocsSidebarHeader } from '../components/Ui/docs-screen'
import { INITIAL_DOCS, type Doc, type Topic, type Subtopic } from '../lib/docs-data'
import { fetchDoc, selectDoc, selectDocStatus, selectFolders } from '../store/slices/notesSlice'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Home,
  Pencil,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

/* -----------------------------------------------------------------------------
 * Shared Tailwind class strings (palette: light / dark)
 * paper  #ffffff / #1b1a20     ink    #28262e / #eeeaf4
 * muted  #716d79 / #aaa4b5     line   #eeecf2 / #302c38
 * soft   #f7f6f9 / #24212b     active #f0ecf8 / #30283f
 * accent #6950a8 / #c1a5ef
 *
 * NOTE: for `dark:` to follow your `.dark` class in Tailwind v4, add once to CSS:
 *   @custom-variant dark (&:where(.dark, .dark *));
 * -------------------------------------------------------------------------- */

const LINE = 'border-[#eeecf2] dark:border-[#302c38]'
const MUTED = 'text-[#716d79] dark:text-[#aaa4b5]'
const INK = 'text-[#28262e] dark:text-[#eeeaf4]'
const HOVER_SOFT = 'hover:bg-[#f7f6f9] dark:hover:bg-[#24212b]'
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6950a8] dark:focus-visible:outline-[#c1a5ef]'

export default function DocsViewer() {
  const { folderId } = useParams<{ folderId: string }>()

  if (!folderId) {
    return <Navigate to="/notes" replace />
  }

  return <DocsViewerContent folderId={folderId} />
}

function DocsViewerContent({ folderId }: { folderId: string }) {
  const dispatch = useDispatch()

  const reduxDoc = useSelector(selectDoc(folderId))
  const docStatus = useSelector(selectDocStatus(folderId))
  const folders = useSelector(selectFolders)

  const folder = useMemo(
    () => folders.find((item) => item.id === folderId),
    [folders, folderId],
  )

  const folderName = folder?.title ?? 'Documentation'

  useEffect(() => {
    if (docStatus === 'idle') {
      dispatch(fetchDoc(folderId))
    }
  }, [dispatch, folderId, docStatus])

  // ---------------------------------------------------------------------------
  // REFS
  // ---------------------------------------------------------------------------

  const mainScrollRef = useRef<HTMLElement | null>(null)

  // ---------------------------------------------------------------------------
  // DOCUMENT
  // ---------------------------------------------------------------------------

  const initialDoc = useMemo<Doc>(() => {
    return (
      INITIAL_DOCS[folderId] ?? {
        id: folderId,
        title: `${folderId.charAt(0).toUpperCase()}${folderId.slice(1)} Documentation`,
        description: 'This documentation has not been published yet.',
        topics: [],
      }
    )
  }, [folderId])

  const doc = useMemo<Doc>(() => reduxDoc ?? initialDoc, [reduxDoc, initialDoc])

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [topicId, setTopicId] = useState(doc.topics[0]?.id ?? '')
  const [subtopicId, setSubtopicId] = useState(doc.topics[0]?.subtopics[0]?.id ?? '')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(doc.topics.map((topic) => [topic.id, true])),
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)

  // ---------------------------------------------------------------------------
  // KEEP SELECTION IN SYNC WITH DOCUMENT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const firstTopic = doc.topics[0]
    const firstSubtopic = firstTopic?.subtopics[0]
    const currentTopic = doc.topics.find((topic) => topic.id === topicId)
    const topicExists = Boolean(currentTopic)
    const subtopicExists = Boolean(
      currentTopic?.subtopics.some((subtopic) => subtopic.id === subtopicId),
    )

    if (!topicExists) {
      const nextTopicId = firstTopic?.id ?? ''
      const nextSubtopicId = firstSubtopic?.id ?? ''
      setTopicId((previous) => (previous === nextTopicId ? previous : nextTopicId))
      setSubtopicId((previous) => (previous === nextSubtopicId ? previous : nextSubtopicId))
    } else if (!subtopicExists) {
      const nextSubtopicId = currentTopic?.subtopics[0]?.id ?? ''
      setSubtopicId((previous) => (previous === nextSubtopicId ? previous : nextSubtopicId))
    }

    setExpanded((previous) => {
      let changed = false
      const next = { ...previous }
      for (const topic of doc.topics) {
        if (next[topic.id] === undefined) {
          next[topic.id] = true
          changed = true
        }
      }
      return changed ? next : previous
    })
  }, [doc])

  // ---------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((previous) => !previous)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ---------------------------------------------------------------------------
  // CURRENT TOPIC / SUBTOPIC
  // ---------------------------------------------------------------------------

  const topic = doc.topics.find((item) => item.id === topicId) ?? doc.topics[0]
  const subtopic = topic?.subtopics.find((item) => item.id === subtopicId) ?? topic?.subtopics[0]
  const toc = subtopic?.content ?? []

  // ---------------------------------------------------------------------------
  // ACTIVE TOC
  // ---------------------------------------------------------------------------

  const [activeTocId, setActiveTocId] = useState<string | null>(toc[0]?.id ?? null)

  useEffect(() => {
    setActiveTocId(toc[0]?.id ?? null)
  }, [subtopic?.id])

  // ---------------------------------------------------------------------------
  // INTERSECTION OBSERVER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const scrollContainer = mainScrollRef.current
    if (!scrollContainer || !toc.length) return

    const sections = toc
      .map((item) => document.getElementById(`content-${item.id}`))
      .filter((element): element is HTMLElement => Boolean(element))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visibleEntries.length > 0) {
          const activeId = visibleEntries[0].target.id.replace('content-', '')
          setActiveTocId((previous) => (previous === activeId ? previous : activeId))
        }
      },
      { root: scrollContainer, rootMargin: '-40px 0px -60% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [subtopic?.id])

  // ---------------------------------------------------------------------------
  // ALL SUBTOPICS + PREVIOUS / NEXT
  // ---------------------------------------------------------------------------

  const allSubtopics = useMemo(() => {
    const list: { topic: Topic; subtopic: Subtopic }[] = []
    doc.topics.forEach((currentTopic) => {
      currentTopic.subtopics.forEach((currentSubtopic) => {
        list.push({ topic: currentTopic, subtopic: currentSubtopic })
      })
    })
    return list
  }, [doc])

  const currentIndex = allSubtopics.findIndex(
    (item) => item.topic.id === topic?.id && item.subtopic.id === subtopic?.id,
  )

  const prevSubtopic = currentIndex > 0 ? allSubtopics[currentIndex - 1] : null
  const nextSubtopic =
    currentIndex >= 0 && currentIndex < allSubtopics.length - 1
      ? allSubtopics[currentIndex + 1]
      : null

  // ---------------------------------------------------------------------------
  // SELECT
  // ---------------------------------------------------------------------------

  const select = (nextTopic: Topic, nextSubtopicArg?: Subtopic) => {
    const targetSubtopic = nextSubtopicArg ?? nextTopic.subtopics[0]

    setTopicId(nextTopic.id)
    setSubtopicId(targetSubtopic?.id ?? '')
    setExpanded((old) => ({ ...old, [nextTopic.id]: true }))
    setMobileOpen(false)
    setActiveTocId(targetSubtopic?.content?.[0]?.id ?? null)

    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    window.history.replaceState(null, '', `#${targetSubtopic?.id ?? nextTopic.id}`)
  }

  // ---------------------------------------------------------------------------
  // SCROLL TO TOC SECTION
  // ---------------------------------------------------------------------------

  const scrollTo = (id: string) => {
    const container = mainScrollRef.current
    const element = document.getElementById(`content-${id}`)
    if (!container || !element) return

    setActiveTocId(id)

    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const targetTop = container.scrollTop + (elementRect.top - containerRect.top) - 24

    container.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
    window.history.replaceState(null, '', `#content-${id}`)
  }

  // ---------------------------------------------------------------------------
  // COPY / SHARE
  // ---------------------------------------------------------------------------

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedUrl(true)
    window.setTimeout(() => setCopiedUrl(false), 2000)
  }
  void handleShare
  void copiedUrl

  // ---------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const q = searchQuery.toLowerCase()
    const results: {
      topic: Topic
      subtopic: Subtopic
      contentItem?: (typeof toc)[number]
    }[] = []

    doc.topics.forEach((currentTopic) => {
      currentTopic.subtopics.forEach((currentSubtopic) => {
        const matchesSubtopic =
          currentSubtopic.title.toLowerCase().includes(q) ||
          currentSubtopic.description?.toLowerCase().includes(q)

        if (matchesSubtopic) {
          results.push({ topic: currentTopic, subtopic: currentSubtopic })
        }

        currentSubtopic.content.forEach((contentItem) => {
          const matchesContent =
            contentItem.title.toLowerCase().includes(q) ||
            contentItem.content.toLowerCase().includes(q)

          if (matchesContent) {
            results.push({ topic: currentTopic, subtopic: currentSubtopic, contentItem })
          }
        })
      })
    })

    return results
  }, [searchQuery, doc])

  // ---------------------------------------------------------------------------
  // SIDEBAR
  // ---------------------------------------------------------------------------

  const sidebar = (
    <aside
      id="handbook-navigation"
      aria-label="Documentation navigation"
      className={`min-h-0 shrink-0 flex-col border-r bg-canvas ${LINE} ${
        mobileOpen
          ? 'fixed inset-y-0 left-0 z-40 flex w-[min(300px,85vw)] shadow-[12px_0_40px_rgba(0,0,0,0.15)] md:static md:z-auto md:w-56 md:shadow-none min-[1100px]:w-[232px]'
          : 'hidden md:flex md:w-56 min-[1100px]:w-[232px]'
      }`}
    >
      <DocsSidebarHeader
        title={folderName}
        onSearch={() => setSearchOpen(true)}
        onClose={() => setMobileOpen(false)}
      />

      <div className={`shrink-0 px-[22px] pb-2.5 text-[11px] font-medium ${MUTED}`}>
        Documentation
      </div>

      <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5 pt-2">
        {doc.topics.map((item) => {
          const isExpanded = Boolean(expanded[item.id])
          const isCurrentTopic = topic?.id === item.id
          const hasSubtopics = item.subtopics.length > 0

          return (
            <div key={item.id} className="group">
              <div
                className={`relative flex items-center rounded-md ${
                  isCurrentTopic
                    ? 'bg-[#28262e]/[0.045] dark:bg-white/[0.06]'
                    : HOVER_SOFT
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    hasSubtopics ? select(item, item.subtopics[0]) : select(item)
                  }
                  className={`flex min-w-0 flex-1 items-center gap-[9px] rounded-md px-2.5 py-[9px] text-left transition-colors ${FOCUS}`}
                >
                  <FileText size={14} aria-hidden="true" className={`shrink-0 ${MUTED}`} />
                  <span
                    className={`min-w-0 flex-1 truncate text-[12px] ${INK} ${
                      isCurrentTopic ? 'font-semibold' : 'font-medium opacity-80'
                    }`}
                  >
                    {item.title}
                  </span>
                </button>

                {hasSubtopics && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.title}`}
                    aria-expanded={isExpanded}
                    className={`mr-2 flex size-7 shrink-0 items-center justify-center rounded transition-colors hover:bg-[#f0ecf8] dark:hover:bg-[#30283f] ${MUTED} ${FOCUS}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                )}
              </div>

              {isExpanded && hasSubtopics && (
                <div
                  className={`relative mb-1 ml-6 mt-1 border-l border-dotted ${LINE}`}
                >
                  <div className="space-y-0.5">
                    {item.subtopics.map((child) => {
                      const isSelected = subtopic?.id === child.id

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => select(item, child)}
                          aria-current={isSelected ? 'page' : undefined}
                          className={`relative flex w-full items-center rounded-[5px] px-2.5 py-2 text-left text-[12.5px] transition-colors ${FOCUS} ${
                            isSelected
                              ? 'bg-[#f0ecf8] font-medium text-[#6950a8] dark:bg-[#30283f] dark:text-[#c1a5ef]'
                              : `${MUTED} ${HOVER_SOFT} hover:text-[#28262e] dark:hover:text-[#eeeaf4]`
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -left-px top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#6950a8] dark:bg-[#c1a5ef]" />
                          )}
                          <span className="truncate">{child.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {doc.topics.length === 0 && (
          <p className={`px-2.5 py-4 text-xs ${MUTED}`}>
            No topics have been published for {folderName} yet.
          </p>
        )}
      </nav>

      <DocsSidebarFooter folderId={folderId} />
    </aside>
  )

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col overflow-hidden border bg-white font-sans md:rounded-[10px] dark:bg-[#1b1a20] max-md:border-0 ${LINE} ${INK} shadow-[0_16px_60px_-24px_rgba(73,55,117,0.33),0_2px_8px_rgba(73,55,117,0.04)] selection:bg-[#f0ecf8] dark:selection:bg-[#30283f]`}
    >
      {/* MOBILE HEADER (visible only below md inside the component) */}
      <DocsMobileHeader
        title={folderName}
        open={mobileOpen}
        onOpen={() => setMobileOpen(true)}
        onSearch={() => setSearchOpen(true)}
      />

      {/* BODY */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {sidebar}

        {/* DOCUMENT SCROLL CONTAINER */}
        <main
          ref={mainScrollRef}
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-[#1b1a20]"
        >
          <div className="mx-auto w-full max-w-[800px] px-6 pb-12 pt-6 md:px-12 md:pb-16 md:pt-8 min-[1100px]:px-16 min-[1100px]:pt-9">
            {/* BREADCRUMB */}
            <div className={`mb-6 flex flex-wrap items-center gap-2 text-[11px] font-medium md:mb-7 ${MUTED}`}>
              <Link to="/notes" className={`transition-colors hover:text-[#28262e] dark:hover:text-[#eeeaf4] ${FOCUS}`}>
                <Home className="size-3.5" />
              </Link>
              <ChevronRight className="size-3.5" />
              <span>{folderName}</span>
              <ChevronRight className="size-3.5" />
              <span>{topic?.title ?? 'General'}</span>
              <ChevronRight className="size-3.5" />
              <span className={`font-semibold ${INK}`}>{subtopic?.title ?? 'Overview'}</span>
            </div>

            {/* PAGE HEADER */}
            <div className="mb-8">
              <h1 className={`text-[clamp(26px,2.5vw,34px)] font-semibold leading-tight tracking-[-0.04em] [overflow-wrap:anywhere] ${INK}`}>
                {subtopic?.title ?? 'Select a subtopic'}
              </h1>

              {subtopic?.description && (
                <p className={`mt-3 text-[13px] leading-[1.8] ${MUTED}`}>
                  {subtopic.description}
                </p>
              )}
            </div>

            {/* CONTENT */}
            {subtopic?.content && subtopic.content.length > 0 ? (
              <div className="flex flex-col gap-8">
                {subtopic.content.map((item) => (
                  <section id={`content-${item.id}`} key={item.id} className="scroll-mt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className={`text-[18px] font-semibold leading-normal tracking-[-0.025em] [overflow-wrap:anywhere] ${INK}`}>
                        {item.title}
                      </h2>
                    </div>

                    {item.type === 'code' ? (
                      <DocsCodeBlock
                        label={item.language || 'text'}
                        content={item.content}
                        copied={copiedId === item.id}
                        onCopy={() => void handleCopy(item.content, item.id)}
                      />
                    ) : (
                      <div className={`text-[14px] leading-[1.9] [overflow-wrap:anywhere] ${MUTED}`}>
                        <p className="whitespace-pre-wrap">{item.content}</p>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-lg bg-[#f0ecf8] text-[#6950a8] dark:bg-[#30283f] dark:text-[#c1a5ef]">
                  <FileText className="size-7" />
                </div>

                <h3 className={`text-lg font-bold ${INK}`}>No content in this section</h3>

                <p className={`mt-1 max-w-sm text-sm ${MUTED}`}>
                  This section is empty. Open the editor to add content.
                </p>

                <Link
                  to={`/notes/${folderId}/edit`}
                  className={`mt-5 inline-flex items-center gap-2 rounded-md bg-[#6950a8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7a60bf] ${FOCUS}`}
                >
                  <Pencil className="size-4" />
                  Open Editor
                </Link>
              </div>
            )}

            {/* PREVIOUS / NEXT */}
            {allSubtopics.length > 0 && (
              <div className={`mt-10 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2 ${LINE}`}>
                {prevSubtopic ? (
                  <button
                    type="button"
                    onClick={() => select(prevSubtopic.topic, prevSubtopic.subtopic)}
                    className={`flex min-w-0 flex-col items-start rounded-lg border bg-white p-4 text-left transition-colors hover:border-[#6950a8] hover:bg-[#f7f6f9] dark:bg-[#1b1a20] dark:hover:border-[#c1a5ef] dark:hover:bg-[#24212b] ${LINE} ${FOCUS}`}
                  >
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium tracking-wide ${MUTED}`}>
                      <ArrowLeft className="size-3.5" />
                      Previous
                    </div>
                    <div className={`mt-1 max-w-full truncate text-sm ${MUTED}`}>
                      {prevSubtopic.subtopic.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextSubtopic ? (
                  <button
                    type="button"
                    onClick={() => select(nextSubtopic.topic, nextSubtopic.subtopic)}
                    className={`flex min-w-0 flex-col items-end rounded-lg border bg-white p-4 text-right transition-colors hover:border-[#6950a8] hover:bg-[#f7f6f9] dark:bg-[#1b1a20] dark:hover:border-[#c1a5ef] dark:hover:bg-[#24212b] ${LINE} ${FOCUS}`}
                  >
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium tracking-wide ${MUTED}`}>
                      Next
                      <ArrowRight className="size-3.5" />
                    </div>
                    <div className={`mt-1 max-w-full truncate text-sm ${MUTED}`}>
                      {nextSubtopic.subtopic.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT TOC */}
        <aside
          aria-label="On this page"
          className="hidden w-[200px] shrink-0 overflow-y-auto py-9 pl-0 pr-6 min-[1100px]:block"
        >
          <div>
            <h2 className={`mb-[18px] flex items-center gap-[7px] text-[11px] font-normal ${MUTED}`}>
              <FileText size={13} /> On this page
            </h2>

            {toc.length > 0 ? (
              <nav className={`border-l ${LINE}`}>
                {toc.map((item) => {
                  const isActive = activeTocId === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollTo(item.id)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`relative flex w-full items-center bg-transparent px-3 py-2 text-left text-[11px] leading-relaxed transition-colors hover:text-[#28262e] dark:hover:text-[#eeeaf4] ${FOCUS} ${
                        isActive ? `font-medium ${INK}` : MUTED
                      }`}
                    >
                      {isActive && (
                        <span className="absolute -left-px top-0 h-full w-px bg-[#6950a8] dark:bg-[#c1a5ef]" />
                      )}
                      <span className="[overflow-wrap:anywhere]">{item.title}</span>
                    </button>
                  )
                })}
              </nav>
            ) : (
              <p className={`px-2.5 py-3 text-xs ${MUTED}`}>No sections in this subtopic.</p>
            )}
          </div>
        </aside>
      </div>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#171020]/40 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SEARCH */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl overflow-hidden rounded-[10px] border bg-white shadow-2xl dark:bg-[#1b1a20] ${LINE}`}
          >
            <div className={`flex items-center border-b bg-[#f7f6f9]/60 px-4 py-3 dark:bg-[#24212b]/60 ${LINE}`}>
              <Search className={`mr-3 size-5 ${MUTED}`} />

              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${folderName} docs...`}
                className={`flex-1 bg-transparent text-sm outline-none placeholder:text-[#716d79] dark:placeholder:text-[#aaa4b5] ${INK}`}
              />

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className={`rounded p-1 transition-colors hover:bg-[#f0ecf8] dark:hover:bg-[#30283f] ${MUTED} ${FOCUS}`}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.topic.id}-${result.subtopic.id}-${result.contentItem?.id ?? index}`}
                      type="button"
                      onClick={() => {
                        select(result.topic, result.subtopic)

                        if (result.contentItem) {
                          window.setTimeout(() => scrollTo(result.contentItem!.id), 150)
                        }

                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className={`flex w-full items-center justify-between rounded-md p-3 text-left transition-colors hover:bg-[#f0ecf8] dark:hover:bg-[#30283f] ${FOCUS}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#6950a8] dark:text-[#c1a5ef]">
                            {result.topic.title}
                          </span>
                          <span className={MUTED}>/</span>
                          <span className={`text-xs font-medium ${INK}`}>
                            {result.subtopic.title}
                          </span>
                        </div>

                        {result.contentItem && (
                          <div className={`mt-1 truncate text-xs ${MUTED}`}>
                            {result.contentItem.title}
                          </div>
                        )}
                      </div>

                      <ChevronRight className={`size-4 shrink-0 ${MUTED}`} />
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className={`py-8 text-center text-sm ${MUTED}`}>
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className={`py-6 text-center text-xs ${MUTED}`}>
                  Type to search through {folderName} documentation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}