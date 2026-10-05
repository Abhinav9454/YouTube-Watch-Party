import React, { useState } from 'react';
import type { GiftItem } from '../types/party';
import { wsService } from '../services/websocket';

interface GiftsOverlayProps {
  gifts: GiftItem[];
  showControls?: boolean;
}

const SNACK_LIST = [
  { type: 'popcorn', name: 'Popcorn', icon: '🍿', color: '#f59e0b' },
  { type: 'pizza', name: 'Pizza', icon: '🍕', color: '#ef4444' },
  { type: 'soda', name: 'Cold Soda', icon: '🥤', color: '#06b6d4' },
  { type: 'icecream', name: 'Ice Cream', icon: '🍦', color: '#ec4899' },
  { type: 'donut', name: 'Glazed Donut', icon: '🍩', color: '#d946ef' },
  { type: 'confetti', name: 'Party Cannon', icon: '🎉', color: '#8b5cf6' },
];

export const GiftsOverlay: React.FC<GiftsOverlayProps> = ({ gifts, showControls = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sentSnack, setSentSnack] = useState<string | null>(null);

  const handleSendGift = (snack: typeof SNACK_LIST[0]) => {
    wsService.sendGift(snack.type, snack.icon, snack.name);
    setSentSnack(snack.icon);
    setTimeout(() => setSentSnack(null), 1500);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Gifts Screen Animation */}
      <div
        className="gifts-screen-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 40,
        }}
      >
        {gifts.map((gift) => (
          <div
            key={gift.id}
            className="animate-gift-float"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: `${gift.leftPercent}%`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: '44px',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))',
                animation: 'bounce 0.8s infinite alternate',
              }}
            >
              {gift.giftIcon}
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '2px 8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                marginTop: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              {gift.senderName} sent {gift.giftName}!
            </div>
          </div>
        ))}
      </div>

      {/* Trigger Button & Popup */}
      {showControls && (
        <div style={{ position: 'relative' }}>
          <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isOpen ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: isOpen ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Send Virtual Snacks & Gifts"
        >
          <span>🍿</span>
          <span>Snacks</span>
          {sentSnack && (
            <span
              style={{
                background: '#f59e0b',
                color: '#000',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {sentSnack}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className="snacks-dropdown glass-card animate-fade-in"
            style={{
              position: 'absolute',
              bottom: '44px',
              left: 0,
              width: '260px',
              background: 'rgba(22, 24, 38, 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              padding: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>🍿</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Party Snacks</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a0aec0',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {SNACK_LIST.map((snack) => (
                <button
                  key={snack.type}
                  type="button"
                  onClick={() => handleSendGift(snack)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '8px 4px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'scale(1.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{snack.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e0' }}>{snack.name}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: '10px',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
              }}
            >
              Gift snacks float across the screen for everyone!
            </div>
          </div>
        )}
      </div>
    )}
  </>
);
};
