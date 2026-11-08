import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { StarInput } from './Stars'

const EMPTY = {
  title: '',
  author: '',
  category: '',
  status: 'owned',
  rating: 0,
  pages: '',
  year: '',
  notes: '',
  cover: '',
}

const CATEGORIES = [
  'นิยาย',
  'แฟนตาซี',
  'พัฒนาตนเอง',
  'จิตวิทยา',
  'การเงิน',
  'ธุรกิจ',
  'ประวัติศาสตร์',
  'วิทยาศาสตร์',
  'คอมพิวเตอร์',
  'การออกแบบ',
  'กวี',
  'การ์ตูน',
  'ทั่วไป',
]

function buildForm(mode, initial, defaultStatus) {
  if (mode === 'edit' && initial) {
    return {
      ...EMPTY,
      ...initial,
      pages: initial.pages ?? '',
      year: initial.year ?? '',
    }
  }
  return { ...EMPTY, status: defaultStatus || 'owned' }
}

export default function BookModal({
  mode,
  initial,
  defaultStatus,
  onClose,
  onSubmit,
  busy = false,
}) {
  const [form, setForm] = useState(() => buildForm(mode, initial, defaultStatus))
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => titleRef.current?.focus(), 80)

    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('กรุณากรอกชื่อหนังสือ')
      return
    }

    onSubmit({
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || 'ทั่วไป',
      status: form.status,
      rating: Number(form.rating) || 0,
      pages: form.pages === '' ? null : Math.max(0, Number(form.pages) || 0),
      year: form.year === '' ? null : Number(form.year),
      notes: form.notes.trim(),
      cover: form.cover.trim(),
    })
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="book-modal-title">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{mode === 'edit' ? 'แก้ไขหนังสือ' : 'เพิ่มเข้าชั้น'}</p>
            <h2 id="book-modal-title">
              {mode === 'edit' ? form.title || 'รายละเอียดหนังสือ' : 'หนังสือเล่มใหม่'}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด">
            <Icon name="x" size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <label className="field span-2">
                <span>ชื่อหนังสือ *</span>
                <input
                  ref={titleRef}
                  className="input"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="เช่น Atomic Habits"
                  maxLength={160}
                />
              </label>

              <label className="field">
                <span>ผู้แต่ง</span>
                <input
                  className="input"
                  value={form.author}
                  onChange={(event) => set('author', event.target.value)}
                  placeholder="ชื่อผู้เขียน"
                  maxLength={120}
                />
              </label>

              <label className="field">
                <span>หมวดหมู่</span>
                <input
                  className="input"
                  list="library-categories"
                  value={form.category}
                  onChange={(event) => set('category', event.target.value)}
                  placeholder="เช่น นิยาย"
                  maxLength={60}
                />
                <datalist id="library-categories">
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              <div className="field span-2">
                <span>สถานะ</span>
                <div className="status-toggle">
                  <button
                    type="button"
                    className={form.status === 'owned' ? 'active' : ''}
                    onClick={() => set('status', 'owned')}
                  >
                    <Icon name="book" size={15} /> มีอยู่แล้ว
                  </button>
                  <button
                    type="button"
                    className={form.status === 'wishlist' ? 'active' : ''}
                    onClick={() => set('status', 'wishlist')}
                  >
                    <Icon name="heart" size={15} /> อยากได้
                  </button>
                </div>
              </div>

              <div className="field span-2">
                <span>คะแนน</span>
                <StarInput
                  value={Number(form.rating) || 0}
                  onChange={(value) => set('rating', value)}
                />
              </div>

              <label className="field">
                <span>จำนวนหน้า</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.pages}
                  onChange={(event) => set('pages', event.target.value)}
                  placeholder="เช่น 320"
                />
              </label>

              <label className="field">
                <span>ปีที่พิมพ์</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="3000"
                  value={form.year}
                  onChange={(event) => set('year', event.target.value)}
                  placeholder="เช่น 2020"
                />
              </label>

              <label className="field span-2">
                <span>ลิงก์รูปปก (ไม่บังคับ)</span>
                <input
                  className="input"
                  type="url"
                  value={form.cover}
                  onChange={(event) => set('cover', event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="field span-2">
                <span>บันทึกส่วนตัว</span>
                <textarea
                  className="input"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  placeholder="ความรู้สึกหลังอ่าน เหตุผลที่อยากได้ หรือข้อคิดที่ชอบ..."
                  maxLength={500}
                />
              </label>
            </div>

            {error ? (
              <p className="form-error">
                <Icon name="x" size={14} /> {error}
              </p>
            ) : null}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <Icon name={busy ? 'clock' : 'check'} size={16} />
              {busy
                ? 'กำลังบันทึก...'
                : mode === 'edit'
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มหนังสือ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
