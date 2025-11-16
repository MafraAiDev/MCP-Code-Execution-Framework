"""
Claude Skills Python Executor
MCP Code Execution Framework integration
"""

__version__ = "1.0.0"

from .executor import SkillExecutor
from .bridge import PythonBridge

__all__ = ["SkillExecutor", "PythonBridge"]