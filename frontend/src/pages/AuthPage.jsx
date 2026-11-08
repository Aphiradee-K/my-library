import { useState } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register, loginDemo } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setForm((current) => ({ ...current, password: '', confirm: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้')
      return
    }
    if (form.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (mode === 'register' && form.password !== form.confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setBusy(true)
    try {
      const result =
        mode === 'login'
          ? await login({ username: form.username, password: form.password })
          : await register({
              username: form.username,
              displayName: form.displayName,
              password: form.password,
            })

      if (!result.ok) setError(result.error)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  async function handleDemo() {
    setError('')
    setBusy(true)
    try {
      await loginDemo()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="brand brand-lg">
          <span className="brand-mark">
            <Icon name="book" size={24} />
          </span>
          <span>
            <strong>My Library</strong>
            <small>ชั้นหนังสือส่วนตัว</small>
          </span>
        </div>

        <div className="auth-brand-copy">
          <h1>
            ทุกเล่มที่คุณรัก
            <br />
            <em>อยู่ในที่เดียว</em>
          </h1>
          <p>
            จัดชั้นหนังสือที่มี บันทึกเล่มที่อยากได้
            และเก็บประวัติการเข้าใช้งานไว้อย่างเป็นระเบียบ
          </p>
        </div>

        <div className="spine-row" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <blockquote className="auth-quote">
          “หนังสือคือเพื่อนที่ไม่เคยจากไปไหน”
        </blockquote>
      </section>

      <section className="auth-panel">
        <div className="auth-mini-brand">
          <span className="brand-mark">
            <Icon name="book" size={20} />
          </span>
          <div>
            <strong>My Library</strong>
            <small>ชั้นหนังสือส่วนตัว</small>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-head">
            <p className="eyebrow">
              {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นที่นี่'}
            </p>
            <h2>
              {mode === 'login'
                ? 'เข้าสู่ชั้นหนังสือของคุณ'
                : 'สร้างชั้นหนังสือของคุณ'}
            </h2>
            <p>
              {mode === 'login'
                ? 'ล็อกอินเพื่อบันทึกการเข้าใช้งานและจัดการหนังสือของคุณ'
                : 'สมัครฟรี ใช้งานได้ทันที ข้อมูลเก็บไว้ในเครื่องนี้'}
            </p>
          </div>

          <div className="seg-tabs" role="tablist" aria-label="เลือกโหมด">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              สมัครสมาชิก
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>ชื่อผู้ใช้</span>
              <div className="input-wrap">
                <Icon name="user" size={17} />
                <input
                  value={form.username}
                  onChange={setField('username')}
                  placeholder="เช่น booklover"
                  autoComplete="username"
                  maxLength={20}
                />
              </div>
            </label>

            {mode === 'register' ? (
              <label className="field">
                <span>ชื่อที่แสดง</span>
                <div className="input-wrap">
                  <Icon name="sparkles" size={17} />
                  <input
                    value={form.displayName}
                    onChange={setField('displayName')}
                    placeholder="เช่น นักอ่านหน้าใหม่"
                    autoComplete="nickname"
                    maxLength={40}
                  />
                </div>
              </label>
            ) : null}

            <label className="field">
              <span>รหัสผ่าน</span>
              <div className="input-wrap">
                <Icon name="lock" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  maxLength={64}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  <Icon name={showPassword ? 'eye' : 'eyeOff'} size={16} />
                </button>
              </div>
            </label>

            {mode === 'register' ? (
              <label className="field">
                <span>ยืนยันรหัสผ่าน</span>
                <div className="input-wrap">
                  <Icon name="check" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={setField('confirm')}
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    autoComplete="new-password"
                    maxLength={64}
                  />
                </div>
              </label>
            ) : null}

            {error ? (
              <p className="form-error" role="alert">
                <Icon name="x" size={14} /> {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
            >
              {busy
                ? 'กำลังดำเนินการ...'
                : mode === 'login'
                  ? 'เข้าสู่ระบบ'
                  : 'สร้างบัญชี'}
            </button>
          </form>

          <div className="auth-divider">
            <span>หรือ</span>
          </div>

          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={handleDemo}
            disabled={busy}
          >
            <Icon name="sparkles" size={16} /> ลองใช้งานด้วยบัญชีตัวอย่าง
          </button>

          <p className="auth-note">
            บัญชีตัวอย่าง: <code>demo</code> / <code>demo1234</code>
            <br />
            ข้อมูลทั้งหมดถูกเก็บใน localStorage ของเบราว์เซอร์นี้
          </p>
        </div>
      </section>
    </div>
  )
}
