export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('WebSocket Client Connected:', socket.id);

    socket.emit('welcome', { message: 'Connected to Arbitrage Webhook Server' });

    socket.on('disconnect', () => {
      console.log('WebSocket Client Disconnected:', socket.id);
    });
  });
};