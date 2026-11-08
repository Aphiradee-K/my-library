const NS = 'mylibrary.v1'

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(`${NS}.${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(`${NS}.${key}`, JSON.stringify(value))
  } catch {
    /* storage full or unavailable */
  }
}

export function remove(key) {
  try {
    window.localStorage.removeItem(`${NS}.${key}`)
  } catch {
    /* ignore */
  }
}

export function deviceLabel() {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'เบราว์เซอร์'

  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'อุปกรณ์นี้'

  return `${browser} · ${os}`
}
