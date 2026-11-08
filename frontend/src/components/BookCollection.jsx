import { useMemo, useState } from 'react'
import BookCard from './BookCard'
import Icon from './Icon'

const SORTS = [
  { id: 'new', label: 'เพิ่มล่าสุด' },
  { id: 'old', label: 'เพิ่มก่อนสุด' },
  { id: 'title', label: 'ชื่อ ก–ฮ' },
  { id: 'rating', label: 'คะแนนสูงสุด' },
]

export default function BookCollection({
  books,
  onAdd,
  addLabel,
  onEdit,
  onDelete,
  onToggle,
  emptyTitle,
  emptyText,
  emptyIcon = 'book',
  searchPlaceholder = 'ค้นหาชื่อหนังสือหรือผู้แต่ง...',
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('new')

  const categories = useMemo(
    () =>
      Array.from(new Set(books.map((book) => book.category).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'th'),
      ),
    [books],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.author || '').toLowerCase().includes(q) ||
        (book.notes || '').toLowerCase().includes(q)
      const matchesCategory = category === 'all' || book.category === category
      return matchesQuery && matchesCategory
    })

    const sorted = [...list]
    if (sort === 'new') {
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    } else if (sort === 'old') {
      sorted.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    } else if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'th'))
    } else if (sort === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
    return sorted
  }, [books, query, category, sort])

  if (books.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty-icon">
            <Icon name={emptyIcon} size={28} />
          </div>
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={16} /> {addLabel}
          </button>
        </div>
      </div>
    )
  }

  const resetFilters = () => {
    setQuery('')
    setCategory('all')
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="input-wrap search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="ค้นหาหนังสือ"
          />
          {query ? (
            <button
              type="button"
              className="clear-search"
              onClick={() => setQuery('')}
              aria-label="ล้างคำค้น"
            >
              <Icon name="x" size={13} />
            </button>
          ) : null}
        </div>

        <div className="select-wrap">
          <select
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="กรองตามหมวดหมู่"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={14} />
        </div>

        <div className="select-wrap">
          <select
            className="select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="เรียงลำดับ"
          >
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={14} />
        </div>

        <span className="toolbar-count">
          {visible.length} / {books.length} เล่ม
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="empty empty-sm">
          <div className="empty-icon">
            <Icon name="search" size={26} />
          </div>
          <h3>ไม่พบหนังสือที่ค้นหา</h3>
          <p>ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่นดูอีกครั้ง</p>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="book-grid">
          {visible.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
