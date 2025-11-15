"""
Validate function for Guardrails AI
"""
import subprocess
import json
import asyncio
import tempfile
import os

async def validate(text, rules=None):
    """
    Validate text using Guardrails AI via MCP real

    Args:
        text: Text to validate
        rules: Optional validation rules/config

    Returns:
        dict: Validation result
    """
    try:
        # 1. Build command
        cmd = ['npx', '-y', 'guardrails-ai', 'validate']

        # Create temporary file with text
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(text)
            temp_path = f.name

        cmd.extend(['--input', temp_path])

        if rules:
            cmd.extend(['--rules', json.dumps(rules)])

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
            raise Exception(f"Guardrails error: {stderr.decode()}")

        # 4. Parse JSON
        result = json.loads(stdout.decode())

        # 5. Return data
        return {
            'success': True,
            'valid': result.get('valid', False),
            'issues': result.get('issues', []),
            'score': result.get('score', 0.0),
            'data': result
        }

    except Exception as e:
        return {
            'error': str(e),
            'valid': False,
            'success': False
        }