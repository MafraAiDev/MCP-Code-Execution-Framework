"""
Test skill for MCP Code Execution Framework
"""

def execute(name="World", greeting="Hello"):
    """
    Simple test function that returns a greeting message

    Args:
        name: Name to greet
        greeting: Greeting to use

    Returns:
        Greeting message
    """
    return f"{greeting}, {name}! Python skill execution successful."

def main(**kwargs):
    """Alternative entry point"""
    return execute(**kwargs)