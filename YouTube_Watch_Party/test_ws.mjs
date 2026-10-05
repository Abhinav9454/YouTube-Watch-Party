// Quick Node 21+ test script using built-in WebSocket to verify backend WebSocket functionality
const ws = new WebSocket('ws://localhost:8080/ws/party');

ws.onopen = () => {
  console.log('CONNECTED to ws://localhost:8080/ws/party');
  ws.send(JSON.stringify({
    type: 'join_room',
    payload: {
      roomId: 'V4UYPN',
      username: 'TesterAlice',
      userId: 'test-user-1'
    }
  }));
};

let step = 0;

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`[RECV ${data.type}]`, JSON.stringify(data.payload));

  if (data.type === 'sync_state' && step === 0) {
    step = 1;
    console.log('Sending play...');
    ws.send(JSON.stringify({
      type: 'play',
      payload: { currentTime: 15.5 }
    }));
  } else if (data.type === 'sync_state' && step === 1) {
    step = 2;
    console.log('Sending chat_message...');
    ws.send(JSON.stringify({
      type: 'chat_message',
      payload: { message: 'Hello from Node WebSocket test!' }
    }));
  } else if (data.type === 'chat_broadcast' && step === 2) {
    step = 3;
    console.log('Sending reaction...');
    ws.send(JSON.stringify({
      type: 'reaction',
      payload: { emoji: '🔥' }
    }));
  } else if (data.type === 'reaction_broadcast' && step === 3) {
    console.log('ALL WEBSOCKET TESTS PASSED SUCCESSFULLY!');
    ws.close();
    process.exit(0);
  }
};

ws.onerror = (err) => {
  console.error('WebSocket Error:', err);
  process.exit(1);
};

setTimeout(() => {
  console.error('Test timed out');
  process.exit(1);
}, 8000);
