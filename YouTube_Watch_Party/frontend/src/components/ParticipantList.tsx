import React from 'react';
import { Crown, Shield, User, ShieldAlert, ShieldCheck, UserX, ArrowRightLeft, Hand } from 'lucide-react';
import type { Participant, Role } from '../types/party';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  currentUserRole: Role;
  onAssignRole: (userId: string, role: Role) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
  onToggleRaiseHand?: (raised: boolean) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
  onToggleRaiseHand,
}) => {
  const isHost = currentUserRole === 'HOST';
  const currentUser = participants.find((p) => p.id === currentUserId);
  const isSelfHandRaised = currentUser?.handRaised ?? false;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'HOST':
        return (
          <span className="badge-role badge-host">
            <Crown size={12} /> Host
          </span>
        );
      case 'MODERATOR':
        return (
          <span className="badge-role badge-moderator">
            <Shield size={12} /> Moderator
          </span>
        );
      case 'PARTICIPANT':
      default:
        return (
          <span className="badge-role badge-participant">
            <User size={12} /> Participant
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Active In Room ({participants.length})
        </span>

        {onToggleRaiseHand && (
          <button
            onClick={() => onToggleRaiseHand(!isSelfHandRaised)}
            className="btn-secondary"
            style={{
              padding: '3px 8px',
              fontSize: '0.74rem',
              gap: '4px',
              background: isSelfHandRaised ? 'rgba(245, 158, 11, 0.2)' : undefined,
              borderColor: isSelfHandRaised ? '#f59e0b' : undefined,
              color: isSelfHandRaised ? '#fbbf24' : undefined,
            }}
            title={isSelfHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand size={12} /> {isSelfHandRaised ? 'Hand Raised' : 'Raise Hand'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
        {participants.map((p) => {
          const isSelf = p.id === currentUserId;

          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                background: isSelf ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isSelf ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: p.role === 'HOST' ? '#f59e0b' : p.role === 'MODERATOR' ? '#38bdf8' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.username}</span>
                      {isSelf && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>(You)</span>
                      )}
                      {p.handRaised && (
                        <span
                          title="Hand raised"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'rgba(245, 158, 11, 0.2)',
                            borderRadius: '4px',
                            padding: '1px 4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          ✋
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {getRoleBadge(p.role)}
              </div>

              {/* Host Administrative Controls */}
              {isHost && !isSelf && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    justifyContent: 'flex-end',
                  }}
                >
                  {p.role === 'PARTICIPANT' ? (
                    <button
                      onClick={() => onAssignRole(p.id, 'MODERATOR')}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                      title="Promote to Moderator"
                    >
                      <ShieldCheck size={13} color="#38bdf8" /> Promote
                    </button>
                  ) : (
                    <button
                      onClick={() => onAssignRole(p.id, 'PARTICIPANT')}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                      title="Demote to Participant"
                    >
                      <ShieldAlert size={13} color="#f59e0b" /> Demote
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm(`Transfer host privileges to ${p.username}?`)) {
                        onTransferHost(p.id);
                      }
                    }}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                    title="Make Room Host"
                  >
                    <ArrowRightLeft size={13} color="#fbbf24" /> Transfer
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${p.username} from room?`)) {
                        onRemoveParticipant(p.id);
                      }
                    }}
                    className="btn-danger"
                    style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px', display: 'flex', alignItems: 'center' }}
                    title="Kick user from room"
                  >
                    <UserX size={13} /> Kick
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
