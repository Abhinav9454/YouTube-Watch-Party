import React, { useState, useMemo } from 'react';
import { Share2, Copy, Check, QrCode, Lock, Globe, MessageCircle, Send } from 'lucide-react';
import { generateQrMatrix } from '../services/qrGenerator';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  isLocked?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  isLocked = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const inviteUrl = useMemo(() => {
    return `${window.location.origin}?room=${roomId}`;
  }, [roomId]);

  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(inviteUrl);
    } catch {
      return [];
    }
  }, [inviteUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const shareText = `🍿 Join my YouTube Watch Party "${roomName}"! Watch videos in exact millisecond sync with live voice, chat & trivia:`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${inviteUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyDiscordCard = () => {
    const discordCard = `>>> **🎬 YOU'RE INVITED TO A YOUTUBE WATCH PARTY!**\n**Room:** ${roomName}\n**Room Code:** \`${roomId}\`\n**Join Link:** ${inviteUrl}\n*Synchronized video, WebRTC voice/video, live trivia & snacks!*`;
    navigator.clipboard.writeText(discordCard).then(() => {
      setCopiedDiscord(true);
      setTimeout(() => setCopiedDiscord(false), 2500);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(16, 20, 36, 0.98)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                Invite to Watch Party
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Share with friends to watch in real-time sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Room Code Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ROOM CODE
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '2px', fontFamily: 'monospace' }}>
              {roomId}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                background: isLocked ? 'rgba(244, 63, 94, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: isLocked ? '#f87171' : '#4ade80',
                border: isLocked ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              {isLocked ? <Lock size={11} /> : <Globe size={11} />}
              {isLocked ? 'Passcode Locked' : 'Public Room'}
            </span>

            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: copiedCode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                border: copiedCode ? '1px solid #22c55e' : '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '8px',
                color: copiedCode ? '#4ade80' : '#818cf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedCode ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '10px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrMatrix.length > 0 ? (
              <svg width="140" height="140" viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                {qrMatrix.map((row, y) =>
                  row.map((cell, x) =>
                    cell ? (
                      <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width="1"
                        height="1"
                        fill="#090d16"
                      />
                    ) : null
                  )
                )}
              </svg>
            ) : (
              <div style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <QrCode size={48} />
              </div>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            📱 Scan with camera on phone or tablet to join instantly
          </span>
        </div>

        {/* Copy Invite Link */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            readOnly
            value={inviteUrl}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#cbd5e0',
              fontSize: '12px',
              outline: 'none',
              textOverflow: 'ellipsis',
            }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px', gap: '6px', whiteSpace: 'nowrap' }}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
            SHARE TO SOCIAL APPS:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '8px',
                color: '#4ade80',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareTelegram}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Send size={16} />
              <span>Telegram</span>
            </button>

            <button
              type="button"
              onClick={handleShareTwitter}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 800 }}>𝕏</span>
              <span>X / Twitter</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDiscordCard}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                background: copiedDiscord ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                border: copiedDiscord ? '1px solid #22c55e' : '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                color: copiedDiscord ? '#4ade80' : '#818cf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedDiscord ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedDiscord ? 'Copied!' : 'Discord'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
