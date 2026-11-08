import BookCard from '../components/BookCard'
import Icon from '../components/Icon'

export default function Dashboard({
  user,
  books,
  onAdd,
  onNavigate,
  onEdit,
  onDelete,
  onToggle,
}) {
  const owned = books.filter((book) => book.status === 'owned')
  const wishlist = books.filter((book) => book.status === 'wishlist')
  const rated = owned.filter((book) => book.rating > 0)
  const average = rated.length
    ? (rated.reduce((sum, book) => sum + book.rating, 0) / rated.length).toFixed(1)
    : '—'

  const now = new Date()
  const addedThisMonth = books.filter((book) => {
    const date = new Date(book.addedAt)
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    )
  }).length

  const recent = [...books]
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, 4)

  const wishPreview = [...wishlist]
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, 4)

  const firstName = user.displayName.split(/\s+/)[0]

  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">ชั้นหนังสือส่วนตัว</p>
          <h1>สวัสดี {firstName} 👋</h1>
          <p>
            เก็บทุกเล่มที่คุณมี และจดทุกเล่มที่อยากได้ไว้ในที่เดียว
            เริ่มจากหนังสือหนึ่งเล่มวันนี้ก็พอ
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => onAdd('owned')}
            >
              <Icon name="plus" size={16} /> เพิ่มหนังสือที่มี
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => onAdd('wishlist')}
            >
              <Icon name="heart" size={16} /> เพิ่มสิ่งที่อยากได้
            </button>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <span className="stat-icon">
            <Icon name="book" size={20} />
          </span>
          <div>
            <strong>{owned.length}</strong>
            <span>หนังสือในชั้น</span>
          </div>
        </div>

        <div className="stat gold">
          <span className="stat-icon">
            <Icon name="heart" size={20} />
          </span>
          <div>
            <strong>{wishlist.length}</strong>
            <span>เล่มที่อยากได้</span>
          </div>
        </div>

        <div className="stat rose">
          <span className="stat-icon">
            <Icon name="star" size={20} />
          </span>
          <div>
            <strong>{average}</strong>
            <span>คะแนนเฉลี่ย</span>
          </div>
        </div>

        <div className="stat blue">
          <span className="stat-icon">
            <Icon name="sparkles" size={20} />
          </span>
          <div>
            <strong>{addedThisMonth}</strong>
            <span>เพิ่มเดือนนี้</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>เพิ่มล่าสุด</h2>
            <p>หนังสือที่เพิ่งบันทึกเข้าชั้นของคุณ</p>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={() => onNavigate('library')}
          >
            ดูทั้งหมด <Icon name="arrowRight" size={15} />
          </button>
        </div>

        {recent.length ? (
          <div className="book-grid">
            {recent.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
                showNotes={false}
              />
            ))}
          </div>
        ) : (
          <div className="empty empty-sm">
            <div className="empty-icon">
              <Icon name="book" size={26} />
            </div>
            <h3>ชั้นหนังสือยังว่างอยู่</h3>
            <p>เพิ่มหนังสือเล่มแรกที่คุณมี แล้วชั้นนี้จะเริ่มมีชีวิต</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAdd('owned')}
            >
              <Icon name="plus" size={16} /> เพิ่มหนังสือ
            </button>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>รายการที่อยากได้</h2>
            <p>เป้าหมายต่อไปสำหรับชั้นหนังสือ</p>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={() => onNavigate('wishlist')}
          >
            ดูทั้งหมด <Icon name="arrowRight" size={15} />
          </button>
        </div>

        {wishPreview.length ? (
          <div className="wish-list">
            {wishPreview.map((book) => (
              <div className="wish-row" key={book.id}>
                <span className="wish-dot" aria-hidden="true" />
                <div className="wish-main">
                  <strong>{book.title}</strong>
                  <span>
                    {book.author || 'ไม่ระบุผู้แต่ง'} · {book.category || 'ทั่วไป'}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  title="ย้ายเข้าชั้นหนังสือ"
                  aria-label={`ย้าย ${book.title} เข้าชั้นหนังสือ`}
                  onClick={() => onToggle(book)}
                >
                  <Icon name="arrowRight" size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="wish-empty">
            <Icon name="heart" size={18} />
            <p>ยังไม่มีรายการที่อยากได้ — เพิ่มเล่มต่อไปที่คุณตั้งใจจะอ่าน</p>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => onAdd('wishlist')}
            >
              <Icon name="plus" size={14} /> เพิ่มรายการ
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
