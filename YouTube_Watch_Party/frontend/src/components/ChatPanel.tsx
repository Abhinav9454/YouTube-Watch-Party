import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import type { ChatMessage, Role } from '../types/party';
import { wsService } from '../services/websocket';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers?: string[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const EMOJI_LIST = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '💡', '🎉'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  typingUsers = [],
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Broadcast typing event
    wsService.sendTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const getRoleColor = (role?: Role | 'SYSTEM') => {
    switch (role) {
      case 'HOST':
        return '#fbbf24';
      case 'MODERATOR':
        return '#38bdf8';
      case 'SYSTEM':
        return '#a855f7';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          <Smile size={13} /> React:
        </div>
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.15rem',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', margin: 'auto' }}>
            No messages yet. Say hello to the room!
          </div>
        )}

        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-full)',
                  margin: '2px 0',
                }}
              >
                {m.message}
              </div>
            );
          }

          const isSelf = m.senderId === currentUserId;

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                <span style={{ fontWeight: 600, color: getRoleColor(m.senderRole) }}>
                  {m.senderName}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div
                style={{
                  background: isSelf ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${isSelf ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                  color: 'var(--text-main)',
                  padding: '8px 12px',
                  borderRadius: isSelf ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '0.88rem',
                  maxWidth: '85%',
                  wordBreak: 'break-word',
                }}
              >
                {m.message}
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: '#38bdf8',
              fontStyle: 'italic',
              padding: '2px 6px',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <span>💬</span>
            <span>
              {typingUsers.slice(0, 2).join(', ')}
              {typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          style={{ padding: '8px 12px', fontSize: '0.88rem' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-primary"
          style={{ padding: '8px 12px', minWidth: '42px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
