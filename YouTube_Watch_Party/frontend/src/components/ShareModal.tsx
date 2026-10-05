import React, { useState, useMemo, useEffect } from 'react';
import { Share2, Copy, Check, QrCode, Lock, Globe, MessageCircle, Wifi, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const isLocalHostOrLan = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname)
  );

  // 'wifi' for same-router mobile/tablet scanning, 'cloud' for global Render link
  const [networkMode, setNetworkMode] = useState<'wifi' | 'cloud'>(() => {
    return isLocalHostOrLan ? 'wifi' : 'cloud';
  });

  const inviteUrl = useMemo(() => {
    const cleanId = (roomId || '').trim().toUpperCase();
    if (networkMode === 'cloud') {
      return `https://youtube-watch-party-r2gl.onrender.com/?room=${encodeURIComponent(cleanId)}`;
    }
    // Local Wi-Fi network mode
    const port = window.location.port ? `:${window.location.port}` : ':5173';
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '10.106.39.147'
      : window.location.hostname;
    return `http://${host}${port}/?room=${encodeURIComponent(cleanId)}`;
  }, [roomId, networkMode]);

  useEffect(() => {
    if (!roomId) return;
    QRCode.toDataURL(inviteUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0a0d14',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate standard QR code:', err));
  }, [inviteUrl, roomId]);

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

  const shareText = `🍿 Join my YouTube Watch Party "${roomName}"! Real-time synchronized playback, live chat & video:`;

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
    const discordCard = `>>> **🎬 YOU'RE INVITED TO A YOUTUBE WATCH PARTY!**\n**Room:** ${roomName}\n**Room Code:** \`${roomId}\`\n**Join Link:** ${inviteUrl}\n*Real-time video sync, live chat, snacks & trivia!*`;
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
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
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
          background: 'rgba(14, 18, 28, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 25px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
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
                background: 'linear-gradient(135deg, #ff2a2a, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                Invite to Watch Party
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Scan QR or share link for instant synchronized entry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '16px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
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
              {isLocked ? 'Passcode' : 'Public'}
            </span>

            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: copiedCode ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.15)',
                border: copiedCode ? '1px solid #22c55e' : '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                color: copiedCode ? '#4ade80' : '#fca5a5',
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

        {/* Network Target Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setNetworkMode('wifi')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderRadius: '7px',
              background: networkMode === 'wifi' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
              color: networkMode === 'wifi' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Wifi size={13} />
            <span>Wi-Fi / LAN Phone</span>
          </button>

          <button
            type="button"
            onClick={() => setNetworkMode('cloud')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderRadius: '7px',
              background: networkMode === 'cloud' ? 'linear-gradient(135deg, #ff2a2a, #dc2626)' : 'transparent',
              color: networkMode === 'cloud' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Globe size={13} />
            <span>Public Cloud Link</span>
          </button>
        </div>

        {/* QR Code Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '8px',
              background: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Scan QR Code to join room ${roomId}`}
                style={{ width: '150px', height: '150px', display: 'block', borderRadius: '6px' }}
              />
            ) : (
              <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <QrCode size={44} />
              </div>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            {networkMode === 'wifi'
              ? '📱 Scan with phone camera on same Wi-Fi / hotspot'
              : '🌐 Scan or share for global internet access'}
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
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#cbd5e0',
              fontSize: '12px',
              outline: 'none',
              textOverflow: 'ellipsis',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px', gap: '6px', whiteSpace: 'nowrap' }}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Social Share Buttons */}
        <div>
          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.5px' }}>
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
              <MessageCircle size={15} />
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
              <ExternalLink size={15} />
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
              <span style={{ fontSize: '14px', fontWeight: 800 }}>𝕏</span>
              <span>Twitter</span>
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
                background: copiedDiscord ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.12)',
                border: copiedDiscord ? '1px solid #22c55e' : '1px solid rgba(239, 68, 68, 0.28)',
                borderRadius: '8px',
                color: copiedDiscord ? '#4ade80' : '#fca5a5',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copiedDiscord ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedDiscord ? 'Copied!' : 'Discord'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
