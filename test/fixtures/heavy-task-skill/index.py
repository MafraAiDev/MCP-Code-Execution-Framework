#!/usr/bin/env python3
"""
Heavy Task Skill - Para testar paralelização
Executa uma task computacionalmente pesada
"""

import time
import hashlib

def execute(iterations=1000, **kwargs):
    """
    Executa uma tarefa pesada (computação + I/O)

    Args:
        iterations (int): Número de iterações (default: 1000)

    Returns:
        dict: Resultado da execução
    """
    start_time = time.time()

    try:
        # Tarefa computacionalmente pesada
        result = 0
        for i in range(iterations):
            # Hash computation (CPU-bound)
            hash_obj = hashlib.sha256(str(i).encode())
            result += len(hash_obj.hexdigest())

            # Small delay to simulate I/O
            if i % 100 == 0:
                time.sleep(0.001)  # 1ms delay every 100 iterations

        execution_time = time.time() - start_time

        return {
            "success": True,
            "result": f"Completed {iterations} iterations. Hash sum: {result}",
            "execution_time": execution_time,
            "iterations": iterations
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "execution_time": time.time() - start_time
        }

if __name__ == "__main__":
    import sys
    import json

    try:
        if not sys.stdin.isatty():
            params = json.loads(sys.stdin.read())
        else:
            params = {"iterations": 1000}

        result = execute(**params)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Failed to execute: {str(e)}"
        }))
