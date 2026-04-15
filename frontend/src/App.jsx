import { useState } from 'react'
import './App.css'
import Feed from './pages/Feed'
import Market from './pages/Market'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Feed />
      case 'market':
        return <Market />
      case 'profile':
        return <Profile />
      default:
        return <Feed />
    }
  }

  return (
    <div className="app-container">
      <div className="page-content">
        {renderPage()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
