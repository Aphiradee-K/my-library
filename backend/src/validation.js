const { ApiError } = require('./errors')

const LIMITS = {
  title: 160,
  author: 120,
  category: 60,
  notes: 500,
  cover: 500,
}

function toText(value, label, { required = false, max } = {}) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (required && !text) {
    throw new ApiError(400, `กรุณากรอก${label}`)
  }
  if (max && text.length > max) {
    throw new ApiError(400, `${label}ยาวเกินไป (สูงสุด ${max} ตัวอักษร)`)
  }
  return text
}

function toIntOrNull(value, label, { min = 0, max = 100000 } = {}) {
  if (value === null || value === undefined || value === '') return null

  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ApiError(400, `${label}ไม่ถูกต้อง`)
  }
  return number
}

function validateBook(body = {}, { partial = false } = {}) {
  const out = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key)

  if (!partial || has('title')) {
    out.title = toText(body.title, 'ชื่อหนังสือ', {
      required: true,
      max: LIMITS.title,
    })
  }

  if (!partial || has('author')) {
    out.author = toText(body.author, 'ชื่อผู้แต่ง', { max: LIMITS.author })
  }

  if (!partial || has('category')) {
    out.category =
      toText(body.category, 'หมวดหมู่', { max: LIMITS.category }) || 'ทั่วไป'
  }

  if (!partial || has('status')) {
    const status = has('status') ? body.status : 'owned'
    if (status !== 'owned' && status !== 'wishlist') {
      throw new ApiError(400, 'สถานะหนังสือไม่ถูกต้อง')
    }
    out.status = status
  }

  if (!partial || has('rating')) {
    const rating = has('rating') ? Number(body.rating) : 0
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new ApiError(400, 'คะแนนต้องอยู่ระหว่าง 0–5 ดาว')
    }
    out.rating = rating
  }

  if (!partial || has('pages')) {
    out.pages = toIntOrNull(body.pages, 'จำนวนหน้า')
  }

  if (!partial || has('year')) {
    out.year = toIntOrNull(body.year, 'ปีที่พิมพ์', { min: 0, max: 3000 })
  }

  if (!partial || has('notes')) {
    out.notes = toText(body.notes, 'บันทึก', { max: LIMITS.notes })
  }

  if (!partial || has('cover')) {
    out.cover = toText(body.cover, 'ลิงก์รูปปก', { max: LIMITS.cover })
  }

  return out
}

module.exports = { validateBook }
