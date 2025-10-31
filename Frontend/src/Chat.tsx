import { useState, useEffect } from 'react'
import axios from 'axios'
import './Chat.css'
import { useStore } from './store/useStore'

function Chat() {
  const { 
    messages, 
    chatHistory, 
    addMessage, 
    setCurrentChat, 
    user,
    logout,
    clearMessages
  } = useStore()
  
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<'history' | 'reports'>('history')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationCompleted, setConversationCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [typingText, setTypingText] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // Sample reports data (replace with actual data from your store/API)
  const myReports = [
    { id: 1, title: 'Report 1.pdf', date: 'Oct 29', size: '2.5 MB' },
    { id: 2, title: 'Report 2.pdf', date: 'Oct 28', size: '1.8 MB' },
    { id: 3, title: 'Report 3.pdf', date: 'Oct 27', size: '3.2 MB' },
  ]

  // Format message text with markdown-like formatting
  const formatMessage = (text: string): string => {
    // Convert newlines to <br> tags
    let formatted = text.replace(/\n/g, '<br>')
    
    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert - list items to styled bullets
    formatted = formatted.replace(/^- (.*?)(<br>|$)/gm, '<div class="bullet-item">• $1</div>')
    
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\. (.*?)(<br>|$)/gm, '<div class="numbered-item">$1. $2</div>')
    
    // Make links clickable (if any)
    formatted = formatted.replace(
      /(https?:\/\/[^\s<]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    
    return formatted
  }

  // Add AI message with typing effect
  const addAIMessageWithTyping = async (text: string) => {
    setIsTyping(true)
    setTypingText('')
    
    // Type the message word by word
    const words = text.split(' ')
    let currentText = ''
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i]
      setTypingText(currentText)
      
      // Wait between words for typing effect (30ms per word)
      await new Promise(resolve => setTimeout(resolve, 30))
    }
    
    // Typing complete - add to store and clear typing state
    setIsTyping(false)
    setTypingText('')
    addMessage(text, 'ai')
  }

  // Initialize new chat session when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.id) {
        console.error('User ID not found')
        return
      }

      try {
        setIsLoading(true)
        clearMessages() // Clear previous messages

        const response = await axios.post(`${backendUrl}/api/chats/new`, {
          userId: user.id
        })

        if (response.data.status === 'success') {
          const { sessionId: newSessionId, welcomeMessage } = response.data.data
          setSessionId(newSessionId)
          
          // Add welcome message to chat with typing effect
          await addAIMessageWithTyping(welcomeMessage)
          setProgress(0)
          setConversationCompleted(false)
        }
      } catch (error: any) {
        console.error('Failed to initialize chat:', error)
        addMessage('Failed to connect to the server. Please try again.', 'ai')
      } finally {
        setIsLoading(false)
      }
    }

    initializeChat()
  }, []) // Run once on mount

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || !user?.id) return

    const userMessage = inputValue.trim()

    try {
      setIsLoading(true)
      
      // Add user message to UI immediately
      addMessage(userMessage, 'user')
      setInputValue('')

      // Send message to backend
      const response = await axios.post(`${backendUrl}/api/chats/message`, {
        message: userMessage,
        sessionId: sessionId,
        userId: user.id,
      })

      if (response.data.status === 'success') {
        const { aiResponse, progress: newProgress, completed } = response.data.data
        
        // Add AI response to chat with typing effect
        await addAIMessageWithTyping(aiResponse.text)
        setProgress(newProgress)
        
        // Check if conversation is completed
        if (completed) {
          setConversationCompleted(true)
          // Fetch summary
          await fetchSummary()
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      addMessage('Sorry, I encountered an error. Please try again.', 'ai')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSummary = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)
      
      const response = await axios.post(`${backendUrl}/api/chats/summary`, {
        sessionId: sessionId
      })

      if (response.data.status === 'success') {
        const { summary } = response.data.data
        
        // Add summary as AI message with typing effect
        await addAIMessageWithTyping('\n📋 **CLINICAL SUMMARY**\n\n' + summary)
      }
    } catch (error: any) {
      console.error('Failed to fetch summary:', error)
      if (error.response?.data?.message === 'Conversation not yet completed') {
        console.log('Conversation not completed yet, skipping summary')
      } else {
        addMessage('Failed to generate summary. Please try again.', 'ai')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      clearMessages()
      setConversationCompleted(false)
      setProgress(0)

      const response = await axios.post(`${backendUrl}/api/chats/new`, {
        userId: user.id
      })

      if (response.data.status === 'success') {
        const { sessionId: newSessionId, welcomeMessage } = response.data.data
        setSessionId(newSessionId)
        await addAIMessageWithTyping(welcomeMessage)
      }
    } catch (error: any) {
      console.error('Failed to create new chat:', error)
      addMessage('Failed to start a new chat. Please try again.', 'ai')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatSelect = (chatId: number) => {
    setCurrentChat(chatId)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return
    
    if (!(file.type === 'application/pdf' || file.type === 'application/json')) {
      alert('Please upload a PDF or JSON file only')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    
    // Automatically analyze the file
    try {
      setIsLoading(true)
      
      // Show upload message in chat
      addMessage(`📎 Uploading file: ${file.name}...`, 'user')

      const formData = new FormData()
      formData.append('file', file)
      if (user?.id) {
        formData.append('userId', user.id)
      }

      const response = await axios.post(`${backendUrl}/api/reports/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.status === 'success') {
        const { filename, extractedData, preFilledSections, summary } = response.data.data
        
        // Show success message
        await addAIMessageWithTyping(`✅ File "${filename}" analyzed successfully!`)
        
        // Display pre-filled sections
        if (preFilledSections && preFilledSections.length > 0) {
          await addAIMessageWithTyping(
            `📋 **Pre-filled Sections:**\n${preFilledSections.map((s: string) => `- ${s}`).join('\n')}`
          )
        }
        
        // Display extracted data summary
        if (extractedData) {
          let dataText = '**Extracted Information:**\n\n'
          Object.entries(extractedData).forEach(([key, value]) => {
            if (value && value !== 'None reported' && value !== 'Not specified') {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              dataText += `**${formattedKey}:**\n${value}\n\n`
            }
          })
          await addAIMessageWithTyping(dataText)
        }
        
        // Display the clinical summary
        if (summary) {
          await addAIMessageWithTyping(`\n📋 **CLINICAL SUMMARY FROM FILE**\n\n${summary}`)
        }
        
        // Clear the selected file after successful analysis
        setSelectedFile(null)
      }
    } catch (error: any) {
      console.error('Failed to analyze file:', error)
      const errorMessage = error.response?.data?.message || 'Failed to analyze file. Please try again.'
      addMessage(`❌ Error: ${errorMessage}`, 'ai')
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
    
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
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
          {progress > 0 && progress < 100 && (
            <div className="progress-indicator">
              <span>Progress: {progress}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          {conversationCompleted && (
            <div className="completion-badge">✅ Completed</div>
          )}
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
                <div className="message-content">
                  {message.file && (
                    <div className="message-file-preview">
                      <span className="file-icon">
                        {message.file.type === 'application/pdf' ? '📄' : '📋'}
                      </span>
                      <span className="file-preview-name">{message.file.name}</span>
                    </div>
                  )}
                  <div className="message-text" dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.text) 
                  }} />
                </div>
              </div>
            ))
          )}
          {isTyping && typingText && (
            <div className="message ai-message typing-message">
              <div className="message-content">
                <div className="message-text" dangerouslySetInnerHTML={{ 
                  __html: formatMessage(typingText) 
                }} />
                <span className="typing-cursor">▋</span>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          {selectedFile && (
            <div className="file-preview">
              <span className="file-name">Analyzing: {selectedFile.name}</span>
              <button className="remove-file-btn" onClick={handleRemoveFile} title="Cancel" disabled={isLoading}>
                ×
              </button>
            </div>
          )}
          <div className="input-wrapper">
            <input
              type="file"
              id="file-upload"
              accept="application/pdf,application/json"
              onChange={handleFileUpload}
              className="file-input-hidden"
            />
            <label htmlFor="file-upload" className="upload-btn" title="Upload PDF or JSON">
              +
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && !conversationCompleted) {
                  handleSendMessage()
                }
              }}
              placeholder={conversationCompleted ? "Conversation completed" : "Type your message..."}
              className="message-input"
              disabled={isLoading || conversationCompleted}
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
          <button 
            onClick={handleSendMessage} 
            className="send-btn"
            disabled={isLoading || conversationCompleted || !inputValue.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
