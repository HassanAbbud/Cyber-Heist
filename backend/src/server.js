const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getUserFromToken } = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);

// Socket.io for real-time multiplayer (bonus feature)
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('player_joined', { playerId: socket.id });
  });

  socket.on('game_action', ({ roomId, action }) => {
    socket.to(roomId).emit('opponent_action', action);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

async function startServer() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create Apollo Server
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(bodyParser.json());

  // GraphQL endpoint with auth context
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.split('Bearer ')[1] || '';
        const user = getUserFromToken(token);
        return { user };
      }
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
