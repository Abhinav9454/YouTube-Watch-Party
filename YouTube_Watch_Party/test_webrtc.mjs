const WS_URL = 'ws://localhost:8080/ws/party';
const ROOM_ID = 'WEBRTC_TEST_' + Math.random().toString(36).substring(2, 7).toUpperCase();

function createClient(name, userId) {
  const ws = new WebSocket(WS_URL);
  const events = [];

  return new Promise((resolve) => {
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        events.push(parsed);
        console.log(`[${name} RECV ${parsed.type}]`, JSON.stringify(parsed.payload || {}).substring(0, 100));
      } catch (e) {
        console.error(e);
      }
    };

    ws.onopen = () => {
      resolve({
        ws,
        events,
        send: (type, payload = {}) => ws.send(JSON.stringify({ type, payload })),
        waitFor: (type, timeout = 3000) => {
          return new Promise((res, rej) => {
            const start = Date.now();
            const check = () => {
              const found = events.find((e) => e.type === type);
              if (found) return res(found);
              if (Date.now() - start > timeout) return rej(new Error(`Timeout waiting for ${type}`));
              setTimeout(check, 50);
            };
            check();
          });
        },
      });
    };
  });
}

async function run() {
  console.log('--- Starting WebRTC Voice & Video Test Suite ---');

  const alice = await createClient('Alice', 'alice-1');
  const bob = await createClient('Bob', 'bob-2');

  // Join Room
  alice.send('join_room', { roomId: ROOM_ID, username: 'Alice', userId: 'alice-1' });
  await alice.waitFor('sync_state');

  bob.send('join_room', { roomId: ROOM_ID, username: 'Bob', userId: 'bob-2' });
  await bob.waitFor('sync_state');

  console.log('✅ Both peers connected to room');

  // 1. Alice sends WebRTC Offer to Bob
  console.log('\n--- 1. Testing WebRTC Offer Signaling ---');
  alice.send('webrtc_signal', {
    targetUserId: 'bob-2',
    signal: { type: 'offer', sdp: 'v=0\r\no=alice 12345' },
  });

  const bobOffer = await bob.waitFor('webrtc_signal');
  console.log('✅ Bob received WebRTC signal from:', bobOffer.payload.senderUserId, 'type:', bobOffer.payload.signal.type);

  // 2. Bob sends WebRTC Answer back to Alice
  console.log('\n--- 2. Testing WebRTC Answer Signaling ---');
  bob.send('webrtc_signal', {
    targetUserId: 'alice-1',
    signal: { type: 'answer', sdp: 'v=0\r\no=bob 67890' },
  });

  const aliceAnswer = await alice.waitFor('webrtc_signal');
  console.log('✅ Alice received WebRTC signal from:', aliceAnswer.payload.senderUserId, 'type:', aliceAnswer.payload.signal.type);

  // 3. Media State Broadcast (Mic / Camera toggle)
  console.log('\n--- 3. Testing Media State Broadcast ---');
  alice.send('webrtc_media_state', {
    isAudioMuted: false,
    isVideoEnabled: true,
    isSpeaking: true,
  });

  const bobMediaState = await bob.waitFor('webrtc_media_state');
  console.log('✅ Bob received Alice media state: isVideoEnabled =', bobMediaState.payload.isVideoEnabled, 'isSpeaking =', bobMediaState.payload.isSpeaking);

  console.log('\n🎉 WEBRTC VOICE & VIDEO SIGNALING TEST PASSED PERFECTLY!');
  alice.ws.close();
  bob.ws.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
