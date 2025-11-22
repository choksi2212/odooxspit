import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { redisSubClient } from '../../db/redis.js';

/**
 * WebSocket Handler
 * Manages WebSocket connections and real-time event broadcasting
 */

interface WSClient {
  socket: WebSocket;
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
        fastify.log.error({ err }, 'Failed to subscribe to Redis channel');
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
          fastify.log.error({ error }, 'Failed to parse Redis message');
        }
      }
    });
  }

  // WebSocket route
  fastify.get('/ws', { websocket: true }, (connection, req: FastifyRequest) => {
    const socket = connection.socket;
    const clientId = generateClientId();
    
    // Extract token from query string
    const token = req.query && typeof req.query === 'object' && 'token' in req.query 
      ? String(req.query.token) 
      : undefined;
    
    let userId: string | undefined;

    // Verify token (optional - for authenticated connections)
    if (token) {
      try {
        const decoded = fastify.jwt.decode(token) as { id?: string };
        userId = decoded?.id;
      } catch (error) {
        fastify.log.warn({ error }, 'Invalid WebSocket token');
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
        fastify.log.error({ error }, 'Failed to parse WebSocket message');
      }
    });

    // Handle disconnection
    socket.on('close', () => {
      clients.delete(clientId);
      fastify.log.info(`WebSocket client disconnected: ${clientId}`);
    });

    socket.on('error', (error: Error) => {
      fastify.log.error({ error, clientId }, 'WebSocket error for client');
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
        fastify.log.info({ clientId, topics: message.topics }, 'Client subscribed to topics');
        
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
        fastify.log.info({ clientId, topics: message.topics }, 'Client unsubscribed from topics');
        
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
      fastify.log.warn({ clientId, messageType: message.type }, 'Unknown message type from client');
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

