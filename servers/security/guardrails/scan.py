"""
Scan function for Guardrails AI
"""
import subprocess
import json
import asyncio
import tempfile
import os

async def scan(content, scan_type='security'):
    """
    Scan content for security issues using Guardrails AI via MCP real

    Args:
        content: Content to scan
        scan_type: Type of scan (security, privacy, etc.)

    Returns:
        dict: Scan results
    """
    try:
        # 1. Build command
        cmd = ['npx', '-y', 'guardrails-ai', 'scan']

        # Create temporary file with content
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(content)
            temp_path = f.name

        cmd.extend(['--input', temp_path])
        cmd.extend(['--type', scan_type])

        # 2. Execute via subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # Clean up temporary file
        os.unlink(temp_path)

        # 3. Validate result
        if process.returncode != 0:
            raise Exception(f"Guardrails scan error: {stderr.decode()}")

        # 4. Parse JSON
        result = json.loads(stdout.decode())

        # 5. Return data
        return {
            'success': True,
            'issues': result.get('issues', []),
            'risk_level': result.get('risk_level', 'unknown'),
            'recommendations': result.get('recommendations', []),
            'data': result
        }

    except Exception as e:
        return {
            'error': str(e),
            'issues': [],
            'risk_level': 'error',
            'recommendations': [],
            'success': False
        }