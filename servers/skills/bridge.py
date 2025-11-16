"""
Python Bridge - JavaScript ↔ Python communication
Handles stdin/stdout communication for MCP integration
"""

import sys
import json
import asyncio
from typing import Dict, Any
from .executor import SkillExecutor


class PythonBridge:
    """
    Bridge between Node.js and Python for skill execution

    Communication Protocol:
    - Input: JSON via stdin (one message per line)
    - Output: JSON via stdout
    - Errors: JSON via stdout with success=false

    Message Format (Input):
    {
        "action": "execute" | "stats" | "ping",
        "skill": "skill-name",
        "params": {...},
        "timeout": 30,
        "requestId": "unique-id"
    }

    Message Format (Output):
    {
        "success": true/false,
        "result": {...} | null,
        "error": "error message" | null,
        "requestId": "unique-id"
    }
    """

    def __init__(self, skills_path: str = None):
        """
        Initialize the Python Bridge

        Args:
            skills_path: Path to skills/packages directory
        """
        self.executor = SkillExecutor(skills_path)
        self.running = False

    async def start(self):
        """Start the bridge (listen to stdin)"""
        self.running = True

        # Send ready signal
        self._send_message({
            "type": "ready",
            "message": "Python Bridge ready",
            "version": "1.0.0"
        })

        # Process messages from stdin
        while self.running:
            try:
                line = await asyncio.get_event_loop().run_in_executor(
                    None, sys.stdin.readline
                )

                if not line:
                    break

                await self._process_message(line.strip())

            except KeyboardInterrupt:
                break
            except Exception as e:
                self._send_error(str(e), request_id=None)

    async def _process_message(self, message_str: str):
        """Process incoming JSON message"""
        try:
            message = json.loads(message_str)
            request_id = message.get("requestId")
            action = message.get("action")

            if action == "execute":
                await self._handle_execute(message, request_id)
            elif action == "stats":
                await self._handle_stats(request_id)
            elif action == "ping":
                self._send_message({
                    "type": "pong",
                    "requestId": request_id
                })
            elif action == "shutdown":
                self.running = False
                self._send_message({
                    "type": "shutdown",
                    "message": "Bridge shutting down",
                    "requestId": request_id
                })
            else:
                self._send_error(
                    f"Unknown action: {action}",
                    request_id=request_id
                )

        except json.JSONDecodeError as e:
            self._send_error(f"Invalid JSON: {e}", request_id=None)
        except Exception as e:
            self._send_error(str(e), request_id=None)

    async def _handle_execute(self, message: Dict[str, Any], request_id: str):
        """Handle skill execution request"""
        skill = message.get("skill")
        params = message.get("params", {})
        timeout = message.get("timeout", 30)

        if not skill:
            self._send_error("Missing 'skill' parameter", request_id)
            return

        # Execute skill
        result = await self.executor.execute_skill(skill, params, timeout)

        # Send response
        self._send_message({
            "type": "result",
            "requestId": request_id,
            **result
        })

    async def _handle_stats(self, request_id: str):
        """Handle stats request"""
        stats = self.executor.get_stats()

        self._send_message({
            "type": "stats",
            "requestId": request_id,
            "stats": stats
        })

    def _send_message(self, data: Dict[str, Any]):
        """Send JSON message to stdout"""
        try:
            message = json.dumps(data)
            print(message, flush=True)
        except Exception as e:
            # Last resort error logging to stderr
            print(f"ERROR: Failed to send message: {e}", file=sys.stderr)

    def _send_error(self, error: str, request_id: str = None):
        """Send error message"""
        self._send_message({
            "type": "error",
            "success": False,
            "error": error,
            "requestId": request_id
        })


# Entry point for Node.js child_process
if __name__ == "__main__":
    bridge = PythonBridge()

    try:
        asyncio.run(bridge.start())
    except KeyboardInterrupt:
        pass