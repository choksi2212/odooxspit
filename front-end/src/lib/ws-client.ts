/**
 * WebSocket Client for real-time updates
 * Handles connection, reconnection, and event dispatching
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';

type EventListener = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<string, Set<EventListener>> = new Map();
  private subscriptions: Set<string> = new Set();
  private isConnecting = false;

  connect(accessToken: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(`${WS_URL}?token=${accessToken}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Resubscribe to topics
      if (this.subscriptions.size > 0) {
        this.send('subscribe', { topics: Array.from(this.subscriptions) });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        // Dispatch to listeners
        const eventListeners = this.listeners.get(type);
        if (eventListeners) {
          eventListeners.forEach((listener) => listener(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.isConnecting = false;
      this.ws = null;

      // Attempt reconnection with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
          30000 // Max 30 seconds
        );
        this.reconnectAttempts++;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
          if (accessToken) {
            this.connect(accessToken);
          }
        }, delay);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  subscribe(topics: string[]) {
    topics.forEach((topic) => this.subscriptions.add(topic));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send('subscribe', { topics });
    }
  }

  unsubscribe(topics: string[]) {
    topics.forEach((topic) => this.subscriptions.delete(topic));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send('unsubscribe', { topics });
    }
  }

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    };
  }

  off(event: string, listener: EventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
