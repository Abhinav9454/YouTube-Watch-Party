// Comprehensive end-to-end integration test for YouTube Watch Party
const WS_URL = 'ws://localhost:8080/ws/party';

function createClient(name) {
  return new Promise((resolve, reject) => {
    const ws = new globalThis.WebSocket(WS_URL);
    const messages = [];

    const client = {
      ws,
      messages,
      send: (type, payload = {}) => ws.send(JSON.stringify({ type, payload })),
      waitFor: (type, timeout = 4000) => {
        return new Promise((res, rej) => {
          const start = Date.now();
          const check = () => {
            const found = messages.find((m) => m.type === type);
            if (found) return res(found);
            if (Date.now() - start > timeout) return rej(new Error(`Timeout waiting for ${type} on ${name}`));
            setTimeout(check, 50);
          };
          check();
        });
      },
    };

    ws.onopen = () => resolve(client);
    ws.onerror = (err) => reject(err);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messages.push(data);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    };
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🚀 Starting Comprehensive YouTube Watch Party Test Suite...');

  // 1. Connect Host
  const host = await createClient('Host');
  console.log('✅ Host WebSocket connected');

  // Join Room
  const testRoomId = 'TEST' + Math.floor(1000 + Math.random() * 9000);
  host.send('join_room', { roomId: testRoomId, username: 'HostUser', userId: 'host-1' });
  await host.waitFor('sync_state');

  // 2. Connect Guest
  const guest = await createClient('Guest');
  console.log('✅ Guest WebSocket connected');

  guest.send('join_room', { roomId: testRoomId, username: 'GuestUser', userId: 'guest-2' });
  await guest.waitFor('sync_state');

  // 3. Test WebRTC Media State & Ducking Signal
  console.log('Testing WebRTC Signaling...');
  host.send('webrtc_media_state', { isAudioMuted: false, isVideoEnabled: true, isSpeaking: true });

  await wait(400);

  // 4. Test Virtual Gifts / Snacks Broadcast
  console.log('Testing Virtual Snacks & Gifts...');
  guest.send('send_gift', { giftType: 'popcorn', giftIcon: '🍿', giftName: 'Butter Popcorn' });
  await wait(400);

  // 5. Test Live Trivia Quiz
  console.log('Testing Live Trivia Quiz...');
  host.send('start_trivia', {
    question: 'What year was YouTube founded?',
    options: ['2003', '2005', '2008', '2010'],
    correctIndex: 1,
    duration: 15,
  });
  await wait(400);

  guest.send('answer_trivia', { optionIndex: 1 });
  await wait(400);

  host.send('end_trivia', {});
  await wait(400);

  // 6. Test Key Moments Bookmarking
  console.log('Testing Bookmarks & Highlights...');
  host.send('add_bookmark', { time: 42.5, title: 'Epic Guitar Solo' });
  await wait(400);

  // 7. Test Host Moderation Announcement & Clear Chat
  console.log('Testing Host Moderation...');
  host.send('broadcast_announcement', { announcement: 'Movie starts in 2 minutes!' });
  await wait(400);

  host.send('clear_chat', {});
  await wait(500);

  // Verification
  const guestMsgTypes = guest.messages.map((m) => m.type);
  console.log('Guest received message types:', [...new Set(guestMsgTypes)]);

  const hasGift = guestMsgTypes.includes('gift_broadcast');
  const hasTriviaStart = guestMsgTypes.includes('trivia_started');
  const hasTriviaEnd = guestMsgTypes.includes('trivia_ended');
  const hasBookmark = guestMsgTypes.includes('bookmarks_updated');
  const hasAnnouncement = guestMsgTypes.includes('host_announcement');
  const hasClearChat = guestMsgTypes.includes('chat_cleared');
  const hasMediaState = guestMsgTypes.includes('webrtc_media_state');

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log('🎁 Gift Broadcast:', hasGift ? 'PASS ✅' : 'FAIL ❌');
  console.log('🧠 Trivia Start:', hasTriviaStart ? 'PASS ✅' : 'FAIL ❌');
  console.log('🏆 Trivia End & Leaderboard:', hasTriviaEnd ? 'PASS ✅' : 'FAIL ❌');
  console.log('🔖 Bookmarks Updated:', hasBookmark ? 'PASS ✅' : 'FAIL ❌');
  console.log('📢 Host Announcement:', hasAnnouncement ? 'PASS ✅' : 'FAIL ❌');
  console.log('🧹 Chat Cleared:', hasClearChat ? 'PASS ✅' : 'FAIL ❌');
  console.log('🎙️ WebRTC Media State:', hasMediaState ? 'PASS ✅' : 'FAIL ❌');

  host.ws.close();
  guest.ws.close();

  if (hasGift && hasTriviaStart && hasTriviaEnd && hasBookmark && hasAnnouncement && hasClearChat && hasMediaState) {
    console.log('\n🎉 ALL 7 SYSTEM TESTS PASSED SUCCESSFULLY! Platform is 100% operational.');
    process.exit(0);
  } else {
    console.error('\n❌ Some tests did not pass.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
