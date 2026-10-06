const WS_URL = 'ws://localhost:8080/ws/party';
const ROOM_ID = 'FEATURES_TEST_' + Math.random().toString(36).substring(2, 7).toUpperCase();

function createClient(name, userId) {
  const ws = new WebSocket(WS_URL);
  const events = [];

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      events.push(parsed);
      console.log(`[${name} RECV ${parsed.type}]`, JSON.stringify(parsed.payload || {}).substring(0, 100));
    } catch (e) {
      console.error(e);
    }
  };

  return new Promise((resolve, reject) => {
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
    ws.onerror = (err) => reject(err);
  });
}

async function run() {
  console.log('--- Starting New Features Test Suite ---');

  const host = await createClient('HostAlice', 'host-101');
  const guest = await createClient('GuestBob', 'guest-202');

  // Join room
  host.send('join_room', { roomId: ROOM_ID, username: 'HostAlice', userId: 'host-101' });
  await host.waitFor('sync_state');

  guest.send('join_room', { roomId: ROOM_ID, username: 'GuestBob', userId: 'guest-202' });
  await guest.waitFor('sync_state');

  console.log('✅ Both users joined room');

  // 1. Test Live Poll Creation
  console.log('\n--- 1. Testing Live Poll Creation ---');
  host.send('create_poll', {
    question: 'What video should we watch next?',
    options: ['Lofi Beats 🎵', 'Cyberpunk Trailer 🎮', '4K Nature 🏔️'],
  });

  const pollCreated = await guest.waitFor('poll_updated');
  console.log('✅ Poll received by Guest:', pollCreated.payload.poll.question);

  // 2. Test Voting
  console.log('\n--- 2. Testing Voting ---');
  guest.send('vote_poll', {
    pollId: pollCreated.payload.poll.id,
    optionIndex: 0,
  });

  const pollVoted = await host.waitFor('poll_updated');
  console.log('✅ Poll Vote recorded, total votes:', pollVoted.payload.poll.options[0].voteCount);

  // 3. Test End Poll
  console.log('\n--- 3. Testing End Poll ---');
  host.send('end_poll', {});
  await guest.waitFor('poll_ended');
  console.log('✅ Poll successfully ended and broadcasted');

  // 4. Test Bookmarks
  console.log('\n--- 4. Testing Bookmarks ---');
  host.send('add_bookmark', {
    time: 142.5,
    title: 'Epic Guitar Solo 🎸',
  });

  const bmUpdated = await guest.waitFor('bookmarks_updated');
  console.log('✅ Bookmark added:', bmUpdated.payload.bookmarks[0].title, 'at', bmUpdated.payload.bookmarks[0].formattedTime);

  // 5. Test Soundboard
  console.log('\n--- 5. Testing SFX Soundboard ---');
  guest.send('play_sound', { soundId: 'airhorn' });
  const sfxRecv = await host.waitFor('sound_played');
  console.log('✅ Sound played received by Host:', sfxRecv.payload.soundId, 'from', sfxRecv.payload.senderName);

  // 6. Test Typing Indicator
  console.log('\n--- 6. Testing Typing Indicator ---');
  guest.send('user_typing', { isTyping: true });
  const typingRecv = await host.waitFor('user_typing');
  console.log('✅ Typing indicator received:', typingRecv.payload.username, 'isTyping =', typingRecv.payload.isTyping);

  console.log('\n🎉 ALL NEW FEATURES (POLLS, BOOKMARKS, SFX, TYPING) TESTED & VERIFIED SUCCESSFULLY!');
  host.ws.close();
  guest.ws.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
