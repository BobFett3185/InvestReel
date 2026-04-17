import { useState, useEffect } from 'react'
import { fetchUserBalance, executeInvestment } from '../api'
import './InvestModal.css'

function InvestModal({ session, reel, onClose, onInvest }) {
  const [amount, setAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [result, setResult] = useState(null)
  const [balance, setBalance] = useState(0)

  const presets = [5, 10, 25, 50, 100]

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserBalance(session.user.id).then(setBalance).catch(console.error)
    }
  }, [session])

  const handleInvest = async () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    if (value > balance) {
      alert("Insufficient funds! Your balance is $" + balance.toFixed(2))
      return
    }

    setInvesting(true)
    
    try {
      const res = await executeInvestment(session.user.id, reel.id, value)
      setResult({ message: `Successfully invested $${value}!`, new_price: res.new_price })
      setTimeout(() => onClose(), 2000)
    } catch (e) {
      console.error(e)
      alert(e.message)
    } finally {
      setInvesting(false)
    }
  }

  const currentPrice = reel.price || 10.00
  let changePct = 0
  if (reel.price_history && reel.price_history.length >= 2) {
    const latest = reel.price_history[reel.price_history.length - 1].price
    const prev = reel.price_history[reel.price_history.length - 2].price
    changePct = prev ? (((latest - prev) / prev) * 100) : 0
  }

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
            <span className="invest-price-value">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="invest-price-row">
            <span className="invest-price-label">Change</span>
            <span className={`invest-price-change ${changePct >= 0 ? 'price-up' : 'price-down'}`}>
              {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          </div>
          <div className="invest-price-row">
            <span className="invest-price-label">Investors</span>
            <span className="invest-price-value">{reel.investments_count || 0}</span>
          </div>
        </div>

        <div className="invest-price-row" style={{ marginTop: 12, padding: '0 8px', justifyContent: 'center' }}>
           <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Available Balance: <strong style={{color:'white'}}>${balance.toFixed(2)}</strong></span>
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
