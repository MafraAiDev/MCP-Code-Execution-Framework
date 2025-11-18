#!/usr/bin/env python3
"""
Test Skill - Simple skill for unit testing
Simple skill that greets users with customizable message
"""

def execute(name="Test User", greeting="Hello", **kwargs):
    """
    Execute test skill with parameters

    Args:
        name (str): Name to greet
        greeting (str): Greeting message

    Returns:
        dict: Execution result with success status and message
    """
    try:
        result_message = f"{greeting}, {name}! Test skill executed successfully."

        return {
            "success": True,
            "result": result_message,
            "execution_time": 0.01,
            "params_received": {
                "name": name,
                "greeting": greeting
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "execution_time": 0.0
        }

if __name__ == "__main__":
    import sys
    import json

    # Read parameters from stdin (for testing)
    try:
        if not sys.stdin.isatty():
            params = json.loads(sys.stdin.read())
        else:
            # Default parameters for manual testing
            params = {"name": "Manual Test", "greeting": "Hi"}

        # Execute skill
        result = execute(**params)

        # Output result
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Failed to execute: {str(e)}"
        }))
