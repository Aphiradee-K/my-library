import Icon from './Icon'

export function Stars({ value = 0, size = 13 }) {
  return (
    <span className="stars" aria-label={`คะแนน ${value} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          filled={n <= value}
          className={n <= value ? 'star on' : 'star'}
        />
      ))}
    </span>
  )
}

export function StarInput({ value = 0, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="ให้คะแนนหนังสือ">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ดาว`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          <Icon name="star" size={24} filled={n <= value} />
        </button>
      ))}
      <span className="star-input-label">
        {value > 0 ? `${value}/5` : 'ยังไม่ให้คะแนน'}
      </span>
    </div>
  )
}
