import Icon from './Icon'
import { Stars } from './Stars'
import { hashString, initials } from '../lib/format'

const PALETTE = [
  ['#2f6b52', '#183f30'],
  ['#a2542f', '#6b3317'],
  ['#3f5a8a', '#243a60'],
  ['#8a4f6b', '#5a2c43'],
  ['#6b6330', '#423c18'],
  ['#3d6f73', '#21474b'],
  ['#7a5a2e', '#4b3416'],
  ['#4f5d3a', '#2d381f'],
]

export default function BookCard({
  book,
  onEdit,
  onDelete,
  onToggle,
  showNotes = true,
}) {
  const [from, to] = PALETTE[hashString(book.title) % PALETTE.length]
  const detail = [book.pages ? `${book.pages} หน้า` : null, book.year || null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="book-card">
      <div
        className="book-cover"
        style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
      >
        <span className="cover-initials" aria-hidden="true">
          {initials(book.title)}
        </span>
        {book.cover ? (
          <img
            className="cover-image"
            src={book.cover}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
        <span className="cover-title">{book.title}</span>
        <span className="cover-spine" aria-hidden="true" />
      </div>

      <div className="book-body">
        <div className="book-meta">
          <span className="chip">{book.category || 'ทั่วไป'}</span>
          {book.status === 'wishlist' ? (
            <span className="chip chip-wish">อยากได้</span>
          ) : null}
        </div>

        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-author">{book.author || 'ไม่ระบุผู้แต่ง'}</p>

        {book.status === 'owned' && book.rating > 0 ? (
          <Stars value={book.rating} />
        ) : null}

        {detail ? <p className="book-detail">{detail}</p> : null}

        {showNotes && book.notes ? (
          <p className="book-notes">{book.notes}</p>
        ) : null}

        <div className="book-actions">
          <button
            type="button"
            className={`btn btn-sm ${book.status === 'wishlist' ? 'btn-soft' : 'btn-ghost'} move-btn`}
            onClick={() => onToggle(book)}
            title={
              book.status === 'wishlist'
                ? 'ย้ายเข้าชั้นหนังสือ'
                : 'ย้ายไปรายการที่อยากได้'
            }
          >
            <Icon
              name={book.status === 'wishlist' ? 'book' : 'heart'}
              size={14}
            />
            <span className="move-label">
              {book.status === 'wishlist' ? 'ย้ายเข้าชั้น' : 'ย้ายไปอยากได้'}
            </span>
          </button>

          <div className="book-icon-actions">
            <button
              type="button"
              className="icon-btn"
              title="แก้ไข"
              aria-label={`แก้ไข ${book.title}`}
              onClick={() => onEdit(book)}
            >
              <Icon name="edit" size={15} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              title="ลบ"
              aria-label={`ลบ ${book.title}`}
              onClick={() => onDelete(book)}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
