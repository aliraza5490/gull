import uuid
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections for real-time payload streaming."""

    def __init__(self):
        # Maps endpoint_id string to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, endpoint_id: str, websocket: WebSocket):
        await websocket.accept()
        if endpoint_id not in self.active_connections:
            self.active_connections[endpoint_id] = []
        self.active_connections[endpoint_id].append(websocket)

    def disconnect(self, endpoint_id: str, websocket: WebSocket):
        if endpoint_id in self.active_connections:
            if websocket in self.active_connections[endpoint_id]:
                self.active_connections[endpoint_id].remove(websocket)
            if not self.active_connections[endpoint_id]:
                del self.active_connections[endpoint_id]

    async def broadcast(self, endpoint_id: str, message: dict):
        if endpoint_id in self.active_connections:
            for connection in self.active_connections[endpoint_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Connection might be closed, disconnect will clean up
                    pass


manager = ConnectionManager()
