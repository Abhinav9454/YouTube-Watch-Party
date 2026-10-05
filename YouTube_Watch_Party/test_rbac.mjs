// Test RBAC enforcement, role promotion, and participant removal
const wsHost = new WebSocket('ws://localhost:8080/ws/party');
const wsParticipant = new WebSocket('ws://localhost:8080/ws/party');

let hostReady = false;
let participantReady = false;

wsHost.onopen = () => {
  wsHost.send(JSON.stringify({
    type: 'join_room',
    payload: { roomId: 'RBAC_TEST_ROOM', username: 'HostUser', userId: 'host-1' }
  }));
};

wsHost.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('[HOST RECV]', data.type, data.payload?.message || '');
  if (data.type === 'sync_state' && !hostReady) {
    hostReady = true;
    checkStartParticipant();
  }
};

function checkStartParticipant() {
  if (hostReady && participantReady) {
    runRbacChecks();
  }
}

wsParticipant.onopen = () => {
  // Join after host
  setTimeout(() => {
    wsParticipant.send(JSON.stringify({
      type: 'join_room',
      payload: { roomId: 'RBAC_TEST_ROOM', username: 'GuestUser', userId: 'guest-2' }
    }));
  }, 200);
};

let step = 0;

wsParticipant.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('[PARTICIPANT RECV]', data.type, JSON.stringify(data.payload));

  if (data.type === 'sync_state' && step === 0) {
    step = 1;
    console.log('\n--- Step 1: Participant attempts unauthorized PLAY ---');
    wsParticipant.send(JSON.stringify({
      type: 'play',
      payload: { currentTime: 10 }
    }));
  } else if (data.type === 'error_message' && step === 1) {
    console.log('✅ Correctly received Permission Denied for Participant!');
    step = 2;
    console.log('\n--- Step 2: Host promotes Participant to MODERATOR ---');
    wsHost.send(JSON.stringify({
      type: 'assign_role',
      payload: { userId: 'guest-2', role: 'MODERATOR' }
    }));
  } else if (data.type === 'role_assigned' && step === 2) {
    console.log('✅ Participant successfully promoted to:', data.payload.role);
    step = 3;
    console.log('\n--- Step 3: Now Moderator attempts PLAY ---');
    wsParticipant.send(JSON.stringify({
      type: 'play',
      payload: { currentTime: 20 }
    }));
  } else if (data.type === 'sync_state' && step === 3) {
    console.log('✅ Moderator PLAY successfully authorized and broadcasted!');
    step = 4;
    console.log('\n--- Step 4: Host kicks Participant/Moderator ---');
    wsHost.send(JSON.stringify({
      type: 'remove_participant',
      payload: { userId: 'guest-2' }
    }));
  } else if (data.type === 'participant_removed' && step === 4) {
    console.log('✅ Kick event received by target user:', data.payload);
    console.log('\n🎉 ALL RBAC AND PERMISSION TESTS PASSED PERFECTLY!\n');
    wsHost.close();
    wsParticipant.close();
    process.exit(0);
  }
};

setTimeout(() => {
  console.error('RBAC test timed out');
  process.exit(1);
}, 10000);
