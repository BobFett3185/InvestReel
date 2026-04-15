import { useState } from 'react'
import './InvestModal.css'

function InvestModal({ reel, onClose, onInvest }) {
  const [amount, setAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [result, setResult] = useState(null)

  const presets = [5, 10, 25, 50, 100]

  const handleInvest = async () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    setInvesting(true)
    try {
      const res = await onInvest(value)
      setResult(res)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (e) {
      console.error(e)
    }
    setInvesting(false)
  }

  const changePct = reel.price_history && reel.price_history.length >= 2
    ? (((reel.price_history[reel.price_history.length - 1] - reel.price_history[reel.price_history.length - 2]) / reel.price_history[reel.price_history.length - 2]) * 100).toFixed(2)
    : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invest-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-header">
          <h3>Invest in Reel</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="invest-reel-info">
          <img src={reel.user_avatar} alt={reel.username} className="invest-avatar" />
          <div>
            <span className="invest-username">@{reel.username}</span>
            <p className="invest-caption">{reel.caption?.slice(0, 40)}...</p>
          </div>
        </div>

        <div className="invest-price-section glass-card">
          <div className="invest-price-row">
            <span className="invest-price-label">Current Price</span>
            <span className="invest-price-value">${reel.price?.toFixed(2)}</span>
          </div>
          <div className="invest-price-row">
            <span className="invest-price-label">Change</span>
            <span className={`invest-price-change ${changePct >= 0 ? 'price-up' : 'price-down'}`}>
              {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct)}%
            </span>
          </div>
          <div className="invest-price-row">
            <span className="invest-price-label">Investors</span>
            <span className="invest-price-value">{reel.investments}</span>
          </div>
        </div>

        {result ? (
          <div className="invest-success animate-fade-in">
            <span className="success-icon">✓</span>
            <p>{result.message}</p>
            <p className="new-price">New price: ${result.new_price?.toFixed(2)}</p>
          </div>
        ) : (
          <>
            <div className="invest-amount-section">
              <label className="invest-amount-label">Investment Amount ($)</label>
              <input
                id="invest-amount-input"
                type="number"
                className="invest-amount-input"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1"
              />
              <div className="invest-presets">
                {presets.map((p) => (
                  <button
                    key={p}
                    className={`preset-btn ${parseFloat(amount) === p ? 'active' : ''}`}
                    onClick={() => setAmount(String(p))}
                  >
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="confirm-invest-btn"
              className="invest-confirm-btn"
              onClick={handleInvest}
              disabled={!amount || parseFloat(amount) <= 0 || investing}
            >
              {investing ? (
                <span className="invest-spinner" />
              ) : (
                `Invest $${amount || '0'}`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default InvestModal
