import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Smile, Search, Download, X } from 'lucide-react';
import type { ChatMessage, Role } from '../types/party';
import { wsService } from '../services/websocket';
import { AVATAR_OPTIONS } from './AvatarCustomizer';

const getSenderAvatar = (senderName: string, isSelf: boolean) => {
  if (isSelf && typeof window !== 'undefined') {
    return localStorage.getItem('watchparty_avatar') || '🦊';
  }
  let hash = 0;
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_OPTIONS[Math.abs(hash) % AVATAR_OPTIONS.length].emoji;
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      wsService.sendTyping(false);
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleExportChat = (format: 'txt' | 'json' = 'txt') => {
    if (messages.length === 0) return;
    let content = '';
    let mime = 'text/plain';
    const filename = `watchparty_chat_${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mime = 'application/json';
    } else {
      const header = `========================================\nSYNCWAVE WATCH PARTY CHAT TRANSCRIPT\nExported: ${new Date().toLocaleString()}\nTotal Messages: ${messages.length}\n========================================\n\n`;
      const body = messages
        .map((m) => {
          const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '';
          const role = m.senderRole ? `[${m.senderRole}] ` : '';
          return `[${time}] ${role}${m.senderName}: ${m.message}`;
        })
        .join('\n');
      content = header + body;
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.message.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const getRoleColor = (role?: Role | 'SYSTEM') => {
    switch (role) {
      case 'HOST':
        return '#fbbf24';
      case 'MODERATOR':
        return '#38bdf8';
      case 'SYSTEM':
        return '#f87171';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* Search & Actions Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="btn-secondary"
            style={{
              padding: '3px 7px',
              fontSize: '0.72rem',
              gap: '4px',
              background: showSearch ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: showSearch ? '#38bdf8' : 'var(--text-dim)',
              borderColor: showSearch ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)',
            }}
            title="Search messages"
          >
            <Search size={12} /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleExportChat('txt')}
          disabled={messages.length === 0}
          className="btn-secondary"
          style={{
            padding: '3px 8px',
            fontSize: '0.72rem',
            gap: '4px',
            color: '#10b981',
            borderColor: 'rgba(16, 185, 129, 0.25)',
          }}
          title="Download chat transcript (.txt)"
        >
          <Download size={12} /> Export Chat
        </button>
      </div>

      {/* Live Search Input Bar */}
      {showSearch && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter messages or user name..."
            style={{ width: '100%', padding: '6px 28px 6px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {searchQuery && (
        <div style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <span>Found {filteredMessages.length} of {messages.length} messages</span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.7rem' }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Emoji Reactions Row */}
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
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 6px',
              minWidth: '34px',
              minHeight: '34px',
              borderRadius: '6px',
              transition: 'transform 0.15s',
              touchAction: 'manipulation',
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
        {filteredMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', margin: 'auto' }}>
            {searchQuery ? `No messages matching "${searchQuery}"` : 'No messages yet. Say hello to the room!'}
          </div>
        )}

        {filteredMessages.map((m) => {
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
                <span style={{ fontSize: '13px', lineHeight: 1 }}>
                  {getSenderAvatar(m.senderName, isSelf)}
                </span>
                <span style={{ fontWeight: 600, color: getRoleColor(m.senderRole) }}>
                  {m.senderName}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div
                style={{
                  background: isSelf ? 'rgba(239, 68, 68, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${isSelf ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-subtle)'}`,
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
          enterKeyHint="send"
          style={{ padding: '10px 14px', fontSize: '16px', borderRadius: '10px' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-primary"
          style={{ padding: '8px 14px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
