import Icon from '../components/Icon'
import { formatDate, formatDateTime, relativeTime } from '../lib/format'

const LABELS = {
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ',
  register: 'สร้างบัญชีใหม่',
}

const ICONS = {
  login: 'arrowRight',
  logout: 'logout',
  register: 'sparkles',
}

const TONES = {
  login: 'ok',
  logout: 'muted',
  register: 'gold',
}

export default function Activity({ user, activity }) {
  const sessions = activity.filter(
    (item) => item.type === 'login' || item.type === 'register',
  )
  const lastSession = sessions[0]

  return (
    <div className="page">
      <div className="stats stats-3">
        <div className="stat">
          <span className="stat-icon">
            <Icon name="history" size={20} />
          </span>
          <div>
            <strong>{sessions.length}</strong>
            <span>ครั้งที่เข้าใช้งาน</span>
          </div>
        </div>

        <div className="stat gold">
          <span className="stat-icon">
            <Icon name="clock" size={20} />
          </span>
          <div>
            <strong className="stat-text">
              {lastSession ? relativeTime(lastSession.at) : '—'}
            </strong>
            <span>เข้าใช้งานล่าสุด</span>
          </div>
        </div>

        <div className="stat blue">
          <span className="stat-icon">
            <Icon name="calendar" size={20} />
          </span>
          <div>
            <strong className="stat-text">{formatDate(user.createdAt)}</strong>
            <span>สมาชิกตั้งแต่</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>บันทึกการเข้าใช้งาน</h2>
            <p>เรียงจากกิจกรรมล่าสุด (เก็บสูงสุด 100 รายการ)</p>
          </div>
          <span className="toolbar-count">{activity.length} รายการ</span>
        </div>

        {activity.length ? (
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className={`activity-icon ${TONES[item.type] || 'muted'}`}>
                  <Icon name={ICONS[item.type] || 'clock'} size={17} />
                </span>
                <div className="activity-main">
                  <strong>{LABELS[item.type] || 'กิจกรรม'}</strong>
                  <span>
                    <Icon name="monitor" size={12} /> {item.device || 'อุปกรณ์นี้'}
                  </span>
                </div>
                <div className="activity-time">
                  <span>{relativeTime(item.at)}</span>
                  <small>{formatDateTime(item.at)}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty empty-sm">
            <div className="empty-icon">
              <Icon name="history" size={26} />
            </div>
            <h3>ยังไม่มีประวัติการเข้าใช้งาน</h3>
            <p>เมื่อคุณเข้าสู่ระบบครั้งถัดไป รายการจะแสดงที่นี่</p>
          </div>
        )}
      </section>

      <p className="storage-note">
        <Icon name="monitor" size={15} />
        ข้อมูลบัญชี หนังสือ และประวัติการเข้าใช้งานถูกเก็บไว้ใน localStorage
        ของเบราว์เซอร์นี้เท่านั้น — หากล้างข้อมูลเบราว์เซอร์ ข้อมูลจะหายไป
      </p>
    </div>
  )
}
