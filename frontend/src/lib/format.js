const dateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso) {
  if (!iso) return '—'
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}

export function relativeTime(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'เมื่อสักครู่'

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'เมื่อสักครู่'
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วันที่แล้ว`

  return formatDate(iso)
}

export function initials(text = '') {
  const clean = text.trim()
  if (!clean) return '?'

  const parts = clean.split(/\s+/)
  const isAscii = /^[\x20-\x7E]/.test(clean)

  if (parts.length > 1 && isAscii) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return clean.slice(0, 2).toUpperCase()
}

export function hashString(text = '') {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}
