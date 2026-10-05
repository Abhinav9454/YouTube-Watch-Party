import type { RoomEntityDto, RoomState, ChatMessage } from '../types/party';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function createRoomApi(
  name?: string,
  creatorUsername?: string,
  initialVideoId?: string,
  passcode?: string
): Promise<RoomState> {
  const response = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, creatorUsername, initialVideoId, passcode }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.statusText}`);
  }
  return response.json();
}

export async function listRecentRoomsApi(): Promise<RoomEntityDto[]> {
  try {
    const response = await fetch(`${API_BASE}/rooms`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function getRoomApi(roomId: string): Promise<RoomState | null> {
  try {
    const response = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getChatHistoryApi(roomId: string): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}/chat`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      senderId: item.senderId,
      senderName: item.senderName,
      senderRole: item.senderRole,
      message: item.message,
      timestamp: item.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}
