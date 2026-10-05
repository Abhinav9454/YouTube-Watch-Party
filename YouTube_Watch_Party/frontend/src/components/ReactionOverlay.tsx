import React from 'react';
import type { ReactionItem } from '../types/party';

interface ReactionOverlayProps {
  reactions: ReactionItem[];
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ reactions }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 30 }}>
      {reactions.map((r) => (
        <div
          key={r.id}
          className="reaction-bubble"
          style={{
            left: `${r.leftPercent}%`,
          }}
        >
          <span className="reaction-emoji">{r.emoji}</span>
          <span className="reaction-author">{r.senderName}</span>
        </div>
      ))}
    </div>
  );
};
