import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { redisSubClient } from '../../db/redis.js';
import { IncomingMessage } from 'http';

/**
 * WebSocket Handler
 * Manages WebSocket connections and real-time event broadcasting
 */

interface WSClient {
  socket: SocketStream;
  topics: Set<string>;
  userId?: string;
}

const clients = new Map<string, WSClient>();
let isSubscribed = false;

/**
 * Setup WebSocket handler
 */
export function setupWebSocketHandler(fastify: FastifyInstance) {
  // Subscribe to Redis Pub/Sub channel
  if (!isSubscribed) {
    redisSubClient.subscribe('stockmaster:events', (err) => {
      if (err) {
        fastify.log.error('Failed to subscribe to Redis channel:', err);
      } else {
        fastify.log.info('Subscribed to stockmaster:events channel');
        isSubscribed = true;
      }
    });

    // Handle messages from Redis
    redisSubClient.on('message', (channel, message) => {
      if (channel === 'stockmaster:events') {
        try {
          const event = JSON.parse(message);
          broadcastEvent(event);
        } catch (error) {
          fastify.log.error('Failed to parse Redis message:', error);
        }
      }
    });
  }

  // WebSocket route
  fastify.get('/ws', { websocket: true }, (socket: SocketStream, req: IncomingMessage) => {
    const clientId = generateClientId();
    
    // Extract token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    let userId: string | undefined;

    // Verify token (optional - for authenticated connections)
    if (token) {
      try {
        const decoded = fastify.jwt.decode(token) as { id?: string };
        userId = decoded?.id;
      } catch (error) {
        fastify.log.warn('Invalid WebSocket token:', error);
      }
    }

    // Store client connection
    const client: WSClient = {
      socket,
      topics: new Set(['all']), // Subscribe to 'all' by default
      userId,
    };
    clients.set(clientId, client);

    fastify.log.info(`WebSocket client connected: ${clientId}${userId ? ` (user: ${userId})` : ''}`);

    // Send welcome message
    socket.send(
      JSON.stringify({
        type: 'connected',
        payload: {
          clientId,
          message: 'Connected to StockMaster WebSocket',
        },
      })
    );

    // Handle incoming messages
    socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(clientId, message, fastify);
      } catch (error) {
        fastify.log.error('Failed to parse WebSocket message:', error);
      }
    });

    // Handle disconnection
    socket.on('close', () => {
      clients.delete(clientId);
      fastify.log.info(`WebSocket client disconnected: ${clientId}`);
    });

    socket.on('error', (error) => {
      fastify.log.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.ping();
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30 seconds

    socket.on('close', () => {
      clearInterval(heartbeat);
    });
  });
}

/**
 * Handle messages from WebSocket clients
 */
function handleClientMessage(
  clientId: string,
  message: { type: string; topics?: string[] },
  fastify: FastifyInstance
) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      if (message.topics && Array.isArray(message.topics)) {
        message.topics.forEach((topic) => client.topics.add(topic));
        fastify.log.info(`Client ${clientId} subscribed to topics:`, message.topics);
        
        client.socket.send(
          JSON.stringify({
            type: 'subscribed',
            payload: { topics: Array.from(client.topics) },
          })
        );
      }
      break;

    case 'unsubscribe':
      if (message.topics && Array.isArray(message.topics)) {
        message.topics.forEach((topic) => client.topics.delete(topic));
        fastify.log.info(`Client ${clientId} unsubscribed from topics:`, message.topics);
        
        client.socket.send(
          JSON.stringify({
            type: 'unsubscribed',
            payload: { topics: Array.from(client.topics) },
          })
        );
      }
      break;

    case 'ping':
      client.socket.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
      break;

    default:
      fastify.log.warn(`Unknown message type from client ${clientId}:`, message.type);
  }
}

/**
 * Broadcast event to all subscribed clients
 */
function broadcastEvent(event: { type: string; payload: unknown }) {
  const message = JSON.stringify(event);

  // Determine which topic this event belongs to
  const topic = event.type.split('.')[0]; // e.g., 'dashboard', 'stock', 'operation'

  clients.forEach((client, clientId) => {
    // Check if client is subscribed to this topic or 'all'
    if (client.topics.has(topic) || client.topics.has('all')) {
      if (client.socket.readyState === client.socket.OPEN) {
        try {
          client.socket.send(message);
        } catch (error) {
          console.error(`Failed to send message to client ${clientId}:`, error);
        }
      }
    }
  });
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  return clients.size;
}

/**
 * Disconnect all clients (for graceful shutdown)
 */
export function disconnectAllClients() {
  clients.forEach((client, clientId) => {
    try {
      client.socket.close();
    } catch (error) {
      console.error(`Failed to close connection for client ${clientId}:`, error);
    }
  });
  clients.clear();
}

