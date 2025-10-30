import { useState } from 'react'
import './Chat.css'
import { useStore } from './store/useStore'

function Chat() {
  const { 
    messages, 
    chatHistory, 
    addMessage, 
    setCurrentChat, 
    createNewChat,
    user,
    logout 
  } = useStore()
  
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<'history' | 'reports'>('history')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Sample reports data (replace with actual data from your store/API)
  const myReports = [
    { id: 1, title: 'Report 1.pdf', date: 'Oct 29', size: '2.5 MB' },
    { id: 2, title: 'Report 2.pdf', date: 'Oct 28', size: '1.8 MB' },
    { id: 3, title: 'Report 3.pdf', date: 'Oct 27', size: '3.2 MB' },
  ]

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      addMessage(inputValue, 'user')
      setInputValue('')
      
      // Simulate AI response (you can replace this with actual AI API call)
      setTimeout(() => {
        addMessage('This is a simulated AI response.', 'ai')
      }, 1000)
    }
  }

  const handleNewChat = () => {
    createNewChat()
  }

  const handleChatSelect = (chatId: number) => {
    setCurrentChat(chatId)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      addMessage(`Uploaded file: ${file.name}`, 'user')
      // Here you can add logic to process the PDF file
      // For example, send it to your backend API
    } else if (file) {
      alert('Please upload a PDF file only')
    }
  }

  return (
    <div className="chat-container">
      {/* Left Sidebar - Chat History */}
      <div className="left-panel">
        <div className="sidebar-header">
          <h2>Doc AI</h2>
          {user && (
            <div className="user-info">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="user-name">{user.name || user.email}</span>
            </div>
          )}
          <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
          {user && (
            <button className="logout-btn" onClick={logout}>Logout</button>
          )}
        </div>
        
        <div className="tab-container">
          <button 
            className={``}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        {activeTab === 'history' ? (
          <div className="chat-history">
            {chatHistory.map((chat) => (
              <div 
                key={chat.id} 
                className="chat-history-item"
                onClick={() => handleChatSelect(chat.id)}
              >
                <div className="chat-title">{chat.title}</div>
                <div className="chat-date">{chat.date}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="reports-list">
            {myReports.map((report) => (
              <div 
                key={report.id} 
                className="report-item"
              >
                <div className="report-title">{report.title}</div>
                <div className="report-info">
                  <span className="report-date">{report.date}</span>
                  <span className="report-size">{report.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Main Chat Area */}
      <div className="right-panel">
        <div className="chat-header">
          <h2>Chat with Doc AI</h2>
        </div>
        
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Start a conversation with Doc AI</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-content">{message.text}</div>
              </div>
            ))
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="file"
              id="file-upload"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-btn" title="Upload PDF">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="message-input"
            />
            <button className="voice-btn" title="Voice input">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
          </div>
          <button onClick={handleSendMessage} className="send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
