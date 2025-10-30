import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface ChatHistory {
  id: number
  title: string
  date: string
  messages: Message[]
}

interface User {
  email: string
  name: string
  picture?: string
  token: string
  id?: string
}

interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void

  // Page navigation
  currentPage: 'home' | 'chat'
  setCurrentPage: (page: 'home' | 'chat') => void

  // Chat state
  currentChatId: number | null
  messages: Message[]
  chatHistory: ChatHistory[]
  
  // Chat actions
  addMessage: (text: string, sender: 'user' | 'ai') => void
  setCurrentChat: (chatId: number) => void
  createNewChat: () => void
  clearMessages: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial user state
      user: { email: 'gjhghg', name: 'jhgjhg', token: 'jhgjhg' },
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        messages: [],
        currentChatId: null
      }),

      // Initial page state
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Initial chat state
      currentChatId: null,
      messages: [],
      chatHistory: [
        { 
          id: 1, 
          title: 'Previous Chat 1', 
          date: 'Oct 29',
          messages: [
            { id: 1, text: 'Hello from previous chat', sender: 'user', timestamp: new Date() }
          ]
        },
        { 
          id: 2, 
          title: 'Previous Chat 2', 
          date: 'Oct 28',
          messages: []
        },
        { 
          id: 3, 
          title: 'Previous Chat 3', 
          date: 'Oct 27',
          messages: []
        },
      ],

      // Chat actions
      addMessage: (text, sender) => {
        const newMessage: Message = {
          id: Date.now(),
          text,
          sender,
          timestamp: new Date()
        }
        set((state) => ({
          messages: [...state.messages, newMessage]
        }))
      },

      setCurrentChat: (chatId) => {
        const chat = get().chatHistory.find(c => c.id === chatId)
        if (chat) {
          set({
            currentChatId: chatId,
            messages: chat.messages
          })
        }
      },

      createNewChat: () => {
        set({
          currentChatId: null,
          messages: []
        })
      },

      clearMessages: () => set({ messages: [] })
    }),
    {
      name: 'doc-ai-storage', // Name for localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        chatHistory: state.chatHistory,
      })
    }
  )
)
