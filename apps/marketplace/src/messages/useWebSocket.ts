// apps/marketplace/src/messages/useWebSocket.ts
// WebSocket hook for real-time messaging in marketplace

import { useEffect, useRef, useCallback, useState } from "react";

export type WebSocketEvent =
  | { event: "connected"; payload: { tenantId: number; userId: string } }
  | { event: "new_message"; payload: { threadId: number; message: { id: number; body: string; senderPartyId: number; createdAt: string } } }
  | { event: "thread_update"; payload: { threadId: number; isRead?: boolean; flagged?: boolean; archived?: boolean } };

interface UseWebSocketOptions {
  onMessage?: (event: WebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

/**
 * Get tenant ID from platform context
 * In marketplace, this may not always be set (user browses multiple breeders)
 */
function getTenantId(): number | null {
  const w = window as any;
  const tenantId = w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID");
  return tenantId ? Number(tenantId) : null;
}

/**
 * Build WebSocket URL from current location
 */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const envBase = (import.meta.env.VITE_API_BASE_URL as string) || "";
  const w = window as any;
  const windowBase = String(w.__BHQ_API_BASE__ || "").trim();
  let apiHost = windowBase || envBase || window.location.host;
  apiHost = apiHost.replace(/^https?:\/\//, "");
  return `${protocol}//${apiHost}/api/v1/ws/messages`;
}

export function useWebSocket({
  onMessage,
  onConnect,
  onDisconnect,
  enabled = true,
}: UseWebSocketOptions = {}) {
  const tenantId = getTenantId();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid re-triggering effects
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const enabledRef = useRef(enabled);
  const tenantIdRef = useRef(tenantId);

  // Update refs when values change
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { tenantIdRef.current = tenantId; }, [tenantId]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Create WebSocket connection
  const createConnection = useCallback(() => {
    // For marketplace, we allow connection even without tenantId
    if (!mountedRef.current || !enabledRef.current) {
      return;
    }

    // Don't connect if already connected or connecting
    const currentState = wsRef.current?.readyState;
    if (currentState === WebSocket.OPEN || currentState === WebSocket.CONNECTING) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    const currentTenantId = tenantIdRef.current;
    console.log("[WS Marketplace] Connecting to:", wsUrl);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (err) {
      console.error("[WS Marketplace] Failed to create WebSocket:", err);
      return;
    }

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      console.log("[WS Marketplace] Connected");
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onConnectRef.current?.();
      // Send auth with tenantId if available
      if (currentTenantId) {
        ws.send(JSON.stringify({ type: "auth", tenantId: currentTenantId }));
      }
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        console.log("[WS Marketplace] Received:", data.event);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error("[WS Marketplace] Failed to parse message:", err);
      }
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      console.log("[WS Marketplace] Disconnected:", event.code, event.reason);
      setIsConnected(false);

      // Only clear wsRef if this is the current WebSocket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      onDisconnectRef.current?.();

      // Reconnect with exponential backoff (max 30 seconds, max 10 attempts)
      if (enabledRef.current && reconnectAttemptsRef.current < 10 && mountedRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[WS Marketplace] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            createConnection();
          }
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("[WS Marketplace] Error:", error);
    };
  }, []);

  // Main connection effect
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      createConnection();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, tenantId, createConnection]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      send({ type: "ping" });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, send]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    createConnection();
  }, [disconnect, createConnection]);

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
  };
}
