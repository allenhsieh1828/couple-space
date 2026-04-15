'use client'

import { useState, useEffect, useRef } from 'react'
import { sendMessage, deleteMessage } from '@/lib/actions/messages'
import { createClient } from '@/lib/supabase/client'
import type { MessageWithSender, Profile } from '@/types/database'

export function BoardClient({
  coupleId,
  userId,
  initialMessages,
}: {
  coupleId: string
  userId: string
  initialMessages: MessageWithSender[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          if (!payload.new.is_deleted) {
            const newMsg: MessageWithSender = {
              ...(payload.new as MessageWithSender),
              sender: (sender as Profile) ?? { id: payload.new.sender_id, display_name: '?', avatar_url: null, invite_code: null, created_at: '', updated_at: '' } as Profile,
            }
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.new.is_deleted) {
            setMessages((prev) => prev.filter((m) => m.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId])

  async function handleSend() {
    const trimmed = body.trim()
    if (!trimmed) return

    setLoading(true)
    const fd = new FormData()
    fd.set('coupleId', coupleId)
    fd.set('body', trimmed)
    await sendMessage(fd)
    setBody('')
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await deleteMessage(id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped: { date: string; msgs: MessageWithSender[] }[] = []
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString('zh-TW', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date, msgs: [msg] })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-zinc-800 mb-4 flex-shrink-0">留言板</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-zinc-400 text-sm">還沒有訊息，說點什麼吧！</p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="text-center my-3">
              <span className="text-xs bg-zinc-100 text-zinc-400 px-3 py-1 rounded-full">{date}</span>
            </div>
            <div className="space-y-2">
              {msgs.map((msg) => {
                const isMe = msg.sender_id === userId
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full bg-rose-200 flex items-center justify-center text-xs font-bold text-rose-600 flex-shrink-0"
                    >
                      {msg.sender.display_name.charAt(0)}
                    </div>

                    {/* Bubble */}
                    <div className={`group relative max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-rose-500 text-white rounded-br-sm'
                            : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-300">
                          {new Date(msg.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-[10px] text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="說點什麼… (Enter 送出)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
        />
        <button
          onClick={handleSend}
          disabled={loading || !body.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
        >
          ▶
        </button>
      </div>
    </div>
  )
}
