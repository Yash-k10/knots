import { Message } from './messaging'

export type MessageHandler = (message: Message) => void
export type TypingHandler = (data: { conversation_id: number; user_id: number; is_typing: boolean }) => void
export type ReadHandler = (data: { conversation_id: number; reader_id: number; count: number }) => void
export type ConnectionHandler = (status: boolean) => void

export class MessagingWebSocket {
  private socket: WebSocket | null = null
  private pingInterval: any = null
  private reconnectTimeout: any = null
  private token: string | null = null
  private isConnected = false

  private messageCallbacks: Set<MessageHandler> = new Set()
  private typingCallbacks: Set<TypingHandler> = new Set()
  private readCallbacks: Set<ReadHandler> = new Set()
  private connectionCallbacks: Set<ConnectionHandler> = new Set()

  constructor() {
    this.token = localStorage.getItem('knots_token')
  }

  public connect() {
    this.token = localStorage.getItem('knots_token')
    if (!this.token) {
      console.warn('Cannot connect WebSocket: Missing auth token')
      return
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_API_HOST || 'localhost:8000'
    const wsUrl = `${wsProtocol}//${host}/api/v1/ws/chat?token=${encodeURIComponent(this.token)}`

    try {
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        this.isConnected = true
        this.notifyConnection(true)
        this.startHeartbeat()
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleEvent(data)
        } catch (e) {
          console.error('Failed to parse WS message frame:', e)
        }
      }

      this.socket.onerror = (err) => {
        console.error('WebSocket error:', err)
      }

      this.socket.onclose = () => {
        this.isConnected = false
        this.notifyConnection(false)
        this.stopHeartbeat()
        this.scheduleReconnect()
      }
    } catch (e) {
      console.error('Failed to instantiate WebSocket:', e)
      this.scheduleReconnect()
    }
  }

  private handleEvent(data: any) {
    switch (data.type) {
      case 'new_message':
        if (data.message) {
          this.messageCallbacks.forEach((cb) => cb(data.message))
        }
        break
      case 'user_typing':
        this.typingCallbacks.forEach((cb) =>
          cb({
            conversation_id: data.conversation_id,
            user_id: data.user_id,
            is_typing: data.is_typing,
          })
        )
        break
      case 'messages_read':
        this.readCallbacks.forEach((cb) =>
          cb({
            conversation_id: data.conversation_id,
            reader_id: data.reader_id,
            count: data.count,
          })
        )
        break
      case 'pong':
        break
      default:
        break
    }
  }

  public sendChatMessage(content: string, conversationId?: number, receiverId?: number) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false
    this.socket.send(
      JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        receiver_id: receiverId,
        content,
      })
    )
    return true
  }

  public sendTyping(conversationId: number, isTyping: boolean) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
    this.socket.send(
      JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping,
      })
    )
  }

  public markRead(conversationId: number) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
    this.socket.send(
      JSON.stringify({
        type: 'mark_read',
        conversation_id: conversationId,
      })
    )
  }

  public onMessage(cb: MessageHandler) {
    this.messageCallbacks.add(cb)
    return () => this.messageCallbacks.delete(cb)
  }

  public onTyping(cb: TypingHandler) {
    this.typingCallbacks.add(cb)
    return () => this.typingCallbacks.delete(cb)
  }

  public onRead(cb: ReadHandler) {
    this.readCallbacks.add(cb)
    return () => this.readCallbacks.delete(cb)
  }

  public onConnection(cb: ConnectionHandler) {
    this.connectionCallbacks.add(cb)
    cb(this.isConnected)
    return () => this.connectionCallbacks.delete(cb)
  }

  private notifyConnection(status: boolean) {
    this.connectionCallbacks.forEach((cb) => cb(status))
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, 4000)
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.isConnected = false
  }
}

export const wsClient = new MessagingWebSocket()
