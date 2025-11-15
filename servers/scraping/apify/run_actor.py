"""
Run Actor function for Apify
"""
import subprocess
import json
import asyncio
import tempfile
import os

async def run_actor(actor_name, config=None):
    """
    Execute an Apify Actor via MCP real

    Args:
        actor_name: Name of the actor to run (ex: 'apify/web-scraper')
        config: Configuration for the actor (dict)

    Returns:
        dict: Actor execution results
    """
    try:
        # 1. Build npx command
        cmd = ['npx', '-y', '@apify/mcp-server', 'run-actor', actor_name]

        if config:
            # Create temporary file for config
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
                json.dump(config, f)
                config_path = f.name
            cmd.extend(['--config', config_path])

        # 2. Execute via subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # Clean up temporary file
        if config:
            os.unlink(config_path)

        # 3. Validate result
        if process.returncode != 0:
            raise Exception(f"Apify error: {stderr.decode()}")

        # 4. Parse JSON
        result = json.loads(stdout.decode())

        # 5. Return data
        return {
            'success': True,
            'data': result,
            'actor': actor_name
        }

    except Exception as e:
        return {
            'error': str(e),
            'actor': actor_name,
            'success': False
        }