// stores/chatStore.ts
'use client'

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { User } from '@clerk/nextjs/server' // only for type hints

export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

interface ChatStore {
  // Session state (user-specific)
  userId: string | null

  sessions: ChatSession[]
  activeSessionId: string | null

  isLoading: boolean
  isStreaming: boolean

  setUserId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void

  createSession: (title?: string) => string
  setActiveSession: (sessionId: string) => void
  getActiveSession: () => ChatSession | null

  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => void
  appendToLastAssistantMessage: (delta: string) => void

  resetSessionMessages: () => void
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  userId: null,

  sessions: [],
  activeSessionId: null,

  isLoading: false,
  isStreaming: false,

  setUserId: (id) => set({ userId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),

  createSession: (title = 'New Chat') => {
    const id = nanoid()
    const newSession: ChatSession = {
      id,
      title,
      createdAt: Date.now(),
      messages: [],
    }
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: id,
    }))
    return id
  },

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  getActiveSession: () => {
    const { sessions, activeSessionId } = get()
    return sessions.find((s) => s.id === activeSessionId) || null
  },

  addMessage: ({ role, content }) => {
    const session = get().getActiveSession()
    if (!session) return

    const newMessage: Message = {
      id: nanoid(),
      role,
      content,
      createdAt: Date.now(),
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === session.id
          ? { ...s, messages: [...s.messages, newMessage] }
          : s
      ),
    }))
  },

  appendToLastAssistantMessage: (delta) => {
    const session = get().getActiveSession()
    if (!session || !delta) return

    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== session.id) return s
        const last = s.messages[s.messages.length - 1]
        if (last?.role === 'assistant') {
          const updated = {
            ...last,
            content: last.content + delta,
          }
          return {
            ...s,
            messages: [...s.messages.slice(0, -1), updated],
          }
        }
        return s
      }),
    }))
  },

  resetSessionMessages: () => {
    const session = get().getActiveSession()
    if (!session) return

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === session.id ? { ...s, messages: [] } : s
      ),
    }))
  },

  deleteSession: (sessionId) => {
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== sessionId)
      const isActive = state.activeSessionId === sessionId
      return {
        sessions: filtered,
        activeSessionId: isActive ? filtered[0]?.id || null : state.activeSessionId,
      }
    })
  },

  clearAllSessions: () => set({ sessions: [], activeSessionId: null }),
}))
