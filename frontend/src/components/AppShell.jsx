import { useCallback, useEffect, useRef, useState } from 'react'
import BookCollection from './BookCollection'
import BookModal from './BookModal'
import ConfirmDialog from './ConfirmDialog'
import Icon from './Icon'
import Toast from './Toast'
import Dashboard from '../pages/Dashboard'
import Activity from '../pages/Activity'
import { useAuth } from '../context/AuthContext'
import { useBooks } from '../hooks/useBooks'
import { initials } from '../lib/format'
import { load, save } from '../lib/storage'

const NAV = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: 'grid' },
  { id: 'library', label: 'ชั้นหนังสือของฉัน', icon: 'book' },
  { id: 'wishlist', label: 'รายการที่อยากได้', icon: 'heart' },
  { id: 'activity', label: 'ประวัติการเข้าใช้งาน', icon: 'history' },
]

const PAGE_META = {
  dashboard: {
    title: 'แดชบอร์ด',
    sub: 'ภาพรวมชั้นหนังสือและการเข้าใช้งานของคุณ',
  },
  library: {
    title: 'ชั้นหนังสือของฉัน',
    sub: 'หนังสือที่คุณมีอยู่แล้วบนชั้น',
  },
  wishlist: {
    title: 'รายการที่อยากได้',
    sub: 'หนังสือที่ตั้งใจจะเก็บเพิ่ม',
  },
  activity: {
    title: 'ประวัติการเข้าใช้งาน',
    sub: 'บันทึกการล็อกอินและกิจกรรมบัญชี',
  },
}

export default function AppShell() {
  const { user, activity, logout } = useAuth()
  const { books, addBook, updateBook, deleteBook, toggleStatus } = useBooks(
    user.id,
  )

  const [page, setPage] = useState('dashboard')
  const [modal, setModal] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const [theme, setTheme] = useState(() => load('theme', 'light'))
  const toastTimer = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    save('theme', theme)
  }, [theme])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const notify = useCallback((message, tone = 'success') => {
    window.clearTimeout(toastTimer.current)
    setToast({ message, tone, id: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const goTo = (next) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const owned = books.filter((book) => book.status === 'owned')
  const wishlist = books.filter((book) => book.status === 'wishlist')
  const counts = { library: owned.length, wishlist: wishlist.length }

  const openCreate = (status = 'owned') => setModal({ mode: 'create', status })
  const openEdit = (book) => setModal({ mode: 'edit', book })
  const closeModal = useCallback(() => setModal(null), [])

  const handleSubmit = (data) => {
    if (modal?.mode === 'edit') {
      updateBook(modal.book.id, data)
      notify('บันทึกการแก้ไขแล้ว')
    } else {
      addBook(data)
      notify(
        data.status === 'wishlist'
          ? 'เพิ่มเข้าสู่รายการที่อยากได้แล้ว'
          : 'เพิ่มหนังสือเข้าชั้นแล้ว',
      )
      goTo(data.status === 'wishlist' ? 'wishlist' : 'library')
    }
    setModal(null)
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    deleteBook(pendingDelete.id)
    setPendingDelete(null)
    notify('ลบหนังสือออกจากชั้นแล้ว')
  }

  const handleToggle = (book) => {
    toggleStatus(book.id)
    notify(
      book.status === 'owned'
        ? 'ย้ายไปรายการที่อยากได้แล้ว'
        : 'ย้ายเข้าชั้นหนังสือแล้ว',
    )
  }

  const meta = PAGE_META[page]

  let content
  if (page === 'library') {
    content = (
      <BookCollection
        books={owned}
        onAdd={() => openCreate('owned')}
        addLabel="เพิ่มหนังสือ"
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onToggle={handleToggle}
        emptyTitle="ชั้นหนังสือยังว่างอยู่"
        emptyText="เริ่มต้นด้วยการเพิ่มหนังสือที่คุณมีอยู่แล้ว แล้วค่อย ๆ เติมชั้นนี้ให้เต็ม"
        emptyIcon="book"
      />
    )
  } else if (page === 'wishlist') {
    content = (
      <BookCollection
        books={wishlist}
        onAdd={() => openCreate('wishlist')}
        addLabel="เพิ่มสิ่งที่อยากได้"
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onToggle={handleToggle}
        emptyTitle="ยังไม่มีหนังสือที่อยากได้"
        emptyText="จดเล่มที่คุณตั้งใจจะซื้อหรืออ่านไว้ที่นี่ แล้วกลับมาดูเมื่อพร้อม"
        emptyIcon="heart"
        searchPlaceholder="ค้นหาในรายการที่อยากได้..."
      />
    )
  } else if (page === 'activity') {
    content = <Activity user={user} activity={activity} />
  } else {
    content = (
      <Dashboard
        user={user}
        books={books}
        onAdd={openCreate}
        onNavigate={goTo}
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onToggle={handleToggle}
      />
    )
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="book" size={21} />
          </span>
          <span>
            <strong>My Library</strong>
            <small>ชั้นหนังสือส่วนตัว</small>
          </span>
        </div>

        <nav className="nav" aria-label="เมนูหลัก">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'active' : ''}
              onClick={() => goTo(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {counts[item.id] ? (
                <span className="nav-badge">{counts[item.id]}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{initials(user.displayName)}</div>
            <div className="user-info">
              <strong>{user.displayName}</strong>
              <span>@{user.username}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              onClick={logout}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
            }
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <span className="mobile-brand">
              <span className="brand-mark">
                <Icon name="book" size={18} />
              </span>
              My Library
            </span>
            <div className="topbar-copy">
              <h2>{meta.title}</h2>
              <p>{meta.sub}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn only-mobile"
              onClick={() =>
                setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
              }
              aria-label="สลับโหมดสี"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openCreate('owned')}
            >
              <Icon name="plus" size={16} />
              <span className="btn-label">เพิ่มหนังสือ</span>
            </button>
          </div>
        </header>

        <div className="content">{content}</div>
      </main>

      <nav className="bottom-nav" aria-label="เมนูหลัก (มือถือ)">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={page === item.id ? 'active' : ''}
            onClick={() => goTo(item.id)}
          >
            <span className="bottom-nav-icon">
              <Icon name={item.icon} size={20} />
              {counts[item.id] ? (
                <span className="bottom-badge">{counts[item.id]}</span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {modal ? (
        <BookModal
          mode={modal.mode}
          initial={modal.book}
          defaultStatus={modal.status}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmDialog
        book={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      <Toast toast={toast} />
    </div>
  )
}
