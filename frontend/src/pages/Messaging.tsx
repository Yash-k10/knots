import React, { useEffect, useState, useRef } from 'react'
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as sendRestMessage,
  createGroupConversation,
  markConversationAsRead,
  Conversation,
  Message,
} from '../services/messaging'
import { wsClient } from '../services/websocket'

export default function Messaging() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputContent, setInputContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({})

  // Modal State for New Group Chat
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [participantIdsStr, setParticipantIdsStr] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>(null)

  // 1. Fetch initial conversations & connect WS
  useEffect(() => {
    loadConversations()
    wsClient.connect()

    const unsubConnection = wsClient.onConnection((status) => {
      setIsWsConnected(status)
    })

    const unsubMessage = wsClient.onMessage((newMsg) => {
      setMessages((prevMsgs) => {
        if (newMsg.conversation_id === activeConvId && !prevMsgs.some((m) => m.id === newMsg.id)) {
          return [...prevMsgs, newMsg]
        }
        return prevMsgs
      })

      // Update sidebar conversation list
      setConversations((prevConvs) =>
        prevConvs.map((conv) => {
          if (conv.id === newMsg.conversation_id) {
            return {
              ...conv,
              last_message: newMsg,
              updated_at: newMsg.created_at,
              unread_count: conv.id === activeConvId ? conv.unread_count : conv.unread_count + 1,
            }
          }
          return conv
        })
      )
    })

    const unsubTyping = wsClient.onTyping(({ conversation_id, is_typing }) => {
      if (conversation_id === activeConvId) {
        setTypingUsers((prev) => ({ ...prev, [conversation_id]: is_typing }))
      }
    })

    return () => {
      unsubConnection()
      unsubMessage()
      unsubTyping()
    }
  }, [activeConvId])

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const loadConversations = async () => {
    try {
      setIsLoadingConvs(true)
      const data = await fetchConversations()
      setConversations(data)
      if (data.length > 0 && activeConvId === null) {
        selectConversation(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setIsLoadingConvs(false)
    }
  }

  const selectConversation = async (convId: number) => {
    setActiveConvId(convId)
    setIsLoadingMsgs(true)
    try {
      const msgs = await fetchConversationMessages(convId)
      setMessages(msgs)
      await markConversationAsRead(convId)
      wsClient.markRead(convId)

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      )
    } catch (err) {
      console.error('Failed to load messages for conversation:', err)
    } finally {
      setIsLoadingMsgs(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputContent.trim() || activeConvId === null) return

    const text = inputContent.trim()
    setInputContent('')

    // Broadcast stop typing
    wsClient.sendTyping(activeConvId, false)

    // Try WebSocket send first, fallback to REST if disconnected
    const sentWs = wsClient.sendChatMessage(text, activeConvId)
    if (!sentWs) {
      try {
        const restMsg = await sendRestMessage(text, activeConvId)
        setMessages((prev) => [...prev, restMsg])
      } catch (err) {
        console.error('Failed to send message via REST fallback:', err)
      }
    }
  }

  const handleInputChange = (val: string) => {
    setInputContent(val)
    if (activeConvId !== null) {
      wsClient.sendTyping(activeConvId, true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        wsClient.sendTyping(activeConvId, false)
      }, 2000)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim() || !participantIdsStr.trim()) return

    const pIds = participantIdsStr
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((num) => !isNaN(num))

    try {
      const newGroup = await createGroupConversation(groupName.trim(), pIds)
      setConversations((prev) => [newGroup, ...prev])
      setIsModalOpen(false)
      setGroupName('')
      setParticipantIdsStr('')
      selectConversation(newGroup.id)
    } catch (err) {
      console.error('Failed to create group conversation:', err)
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId)

  const filteredConversations = conversations.filter((c) => {
    const nameStr = c.name || `Conversation #${c.id}`
    return nameStr.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex h-[650px] shadow-2xl">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Messages</h3>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isWsConnected ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-rose-500'
              }`}
              title={isWsConnected ? 'Real-Time Connected' : 'Disconnected'}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
          >
            + New Chat
          </button>
        </div>

        <div className="p-3 border-b border-slate-800/80">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60">
          {isLoadingConvs ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No conversations found.</div>
          ) : (
            filteredConversations.map((chat) => {
              const isActive = chat.id === activeConvId
              const title = chat.name || (chat.is_group ? `Group #${chat.id}` : `Direct Chat #${chat.id}`)
              return (
                <div
                  key={chat.id}
                  onClick={() => selectConversation(chat.id)}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-all ${
                    isActive ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center font-bold text-xs text-indigo-300">
                    {title.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-xs font-semibold text-white truncate">{title}</h4>
                      {chat.last_message && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(chat.last_message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-400 truncate">
                        {chat.last_message ? chat.last_message.content : 'No messages yet'}
                      </p>
                      {chat.unread_count > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Conversation Thread */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {activeConv ? (
          <>
            <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {activeConv.name || (activeConv.is_group ? `Group #${activeConv.id}` : `Direct Chat #${activeConv.id}`)}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {activeConv.participants?.length || 2} participants
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>

            {/* Message History Window */}
            <div className="flex-1 p-6 space-y-3.5 overflow-y-auto bg-slate-900/30">
              {isLoadingMsgs ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.sender_id === 1 // Current active user mock/context id
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isSentByMe && (
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          U{msg.sender_id}
                        </div>
                      )}
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs ${
                          isSentByMe
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div
                          className={`mt-1 text-[9px] flex justify-end gap-1 ${
                            isSentByMe ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isSentByMe && <span>{msg.is_read ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing Indicator */}
              {activeConvId && typingUsers[activeConvId] && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  Someone is typing...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-3 items-center bg-slate-950">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputContent}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all shadow-md"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* New Group Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create Group Conversation</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Study Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Participant User IDs (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2, 3, 4"
                  value={participantIdsStr}
                  onChange={(e) => setParticipantIdsStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
