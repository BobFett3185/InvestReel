import { useState, useEffect } from 'react'
import { fetchMarket, investInReel } from '../api'
import InvestModal from '../components/InvestModal'
import './Market.css'

function Market({ session }) {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('trending')
  const [investReel, setInvestReel] = useState(null)

  useEffect(() => {
    loadMarket()
  }, [])

  const loadMarket = async () => {
    try {
      const data = await fetchMarket()
      setMarketData(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleInvest = async (reelId, amount) => {
    const res = await investInReel(reelId, 'guest_user', amount)
    loadMarket()
    return res
  }

  const sortedReels = () => {
    if (!marketData?.reels) return []
    const reels = [...marketData.reels]
    switch (sortBy) {
      case 'price':
        return reels.sort((a, b) => b.price - a.price)
      case 'gainers':
        return reels.sort((a, b) => b.change_pct - a.change_pct)
      case 'trending':
      default:
        return reels
    }
  }

  const Sparkline = ({ data, isPositive }) => {
    if (!data || data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const width = 80
    const height = 32
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? 'var(--success)' : 'var(--danger)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="market-loading">
        <div className="feed-loading-spinner" />
        <p>Loading market...</p>
      </div>
    )
  }

  return (
    <div className="market-container" id="market-container">
      {/* Header */}
      <div className="market-header">
        <h1 className="market-title">
          <span className="gradient-text">Market</span>
        </h1>
        <p className="market-subtitle">Invest in trending content</p>
      </div>

      {/* Stats */}
      {marketData?.stats && (
        <div className="market-stats">
          <div className="stat-card glass-card">
            <span className="stat-value">${marketData.stats.total_market_cap.toFixed(2)}</span>
            <span className="stat-label">Market Cap</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{marketData.stats.total_volume}</span>
            <span className="stat-label">Investments</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">{marketData.stats.total_reels}</span>
            <span className="stat-label">Reels</span>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div className="market-sort-tabs">
        {['trending', 'price', 'gainers'].map((tab) => (
          <button
            key={tab}
            className={`sort-tab ${sortBy === tab ? 'active' : ''}`}
            onClick={() => setSortBy(tab)}
          >
            {tab === 'trending' && '🔥 '}
            {tab === 'price' && '💎 '}
            {tab === 'gainers' && '📈 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Reel list */}
      <div className="market-list">
        {sortedReels().map((reel, index) => (
          <div
            key={reel.id}
            className="market-card glass-card"
            id={`market-card-${reel.id}`}
            onClick={() => setInvestReel(reel)}
          >
            <div className="market-rank">#{index + 1}</div>
            <div className="market-thumb" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px' }}>▶</span>
            </div>
            <div className="market-card-info">
              <div className="market-card-header">
                <img src={reel.user_avatar} alt="" className="market-card-avatar" />
                <span className="market-card-username">@{reel.username}</span>
              </div>
              <p className="market-card-caption">{reel.caption?.slice(0, 35)}...</p>
              <div className="market-card-metrics">
                <span className="metric">❤️ {(reel.likes / 1000).toFixed(1)}K</span>
                <span className="metric">👁 {(reel.views / 1000).toFixed(1)}K</span>
              </div>
            </div>
            <div className="market-card-right">
              <Sparkline data={reel.price_history} isPositive={reel.change_pct >= 0} />
              <span className="market-card-price">${reel.price.toFixed(2)}</span>
              <span className={`market-card-change ${reel.change_pct >= 0 ? 'price-up' : 'price-down'}`}>
                {reel.change_pct >= 0 ? '▲' : '▼'} {Math.abs(reel.change_pct).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {investReel && (
        <InvestModal
          session={session}
          reel={investReel}
          onClose={() => setInvestReel(null)}
          onInvest={loadMarket}
        />
      )}
    </div>
  )
}

export default Market
