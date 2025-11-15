"""
Get Dataset function for Apify
"""
import subprocess
import json
import asyncio

async def get_dataset(dataset_id, options=None):
    """
    Get dataset from Apify via MCP real

    Args:
        dataset_id: ID of the dataset
        options: Optional parameters (offset, limit, etc.)

    Returns:
        dict: Dataset contents
    """
    try:
        # 1. Build npx command
        cmd = ['npx', '-y', '@apify/mcp-server', 'get-dataset', dataset_id]

        if options:
            # Add options as JSON string
            cmd.extend(['--options', json.dumps(options)])

        # 2. Execute via subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # 3. Validate result
        if process.returncode != 0:
            raise Exception(f"Apify dataset error: {stderr.decode()}")

        # 4. Parse JSON
        result = json.loads(stdout.decode())

        # 5. Return data
        return {
            'success': True,
            'data': result,
            'dataset_id': dataset_id
        }

    except Exception as e:
        return {
            'error': str(e),
            'dataset_id': dataset_id,
            'success': False
        }