"""
Skill Executor - Executes Claude Skills in Python environment
Integrates with MCP Code Execution Framework
"""

import sys
import json
import traceback
import importlib.util
from pathlib import Path
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime


class SkillExecutor:
    """
    Executes Claude Skills packages from ai-labs-claude-skills

    Features:
    - Dynamic skill loading from packages
    - Parameter validation
    - Timeout handling
    - Error capture and formatting
    - MCP-compatible output
    """

    def __init__(self, skills_path: str = None, max_retries: int = 3):
        """
        Initialize the Skill Executor

        Args:
            skills_path: Path to skills/packages directory
        """
        if skills_path is None:
            # Default: skills/packages relative to project root
            self.skills_path = Path(__file__).parent.parent.parent / "skills" / "packages"
        else:
            self.skills_path = Path(skills_path)

        self.loaded_modules = {}
        self._cache_ttl = 3600  # 1 hour default
        self.execution_stats = {
            "total_executions": 0,
            "successful": 0,
            "failed": 0,
            "total_time": 0
        }
        self.max_retries = max_retries

    async def execute_skill(
        self,
        skill_name: str,
        params: Dict[str, Any],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Execute a skill with given parameters

        Args:
            skill_name: Name of the skill to execute
            params: Parameters for the skill
            timeout: Maximum execution time in seconds

        Returns:
            Dict with execution result in MCP format

        Raises:
            TimeoutError: If execution exceeds timeout
            FileNotFoundError: If skill not found
            Exception: For skill execution errors
        """
        start_time = datetime.now()

        # Cleanup expired cache entries
        self._cleanup_expired_cache()

        try:
            # Validate skill exists
            skill_path = self._resolve_skill_path(skill_name)

            # Load skill module
            skill_module = await self._load_skill(skill_name, skill_path)

            # Execute with timeout
            result = await asyncio.wait_for(
                self._execute_skill_module(skill_module, params),
                timeout=timeout
            )

            # Update stats
            execution_time = (datetime.now() - start_time).total_seconds()
            self.execution_stats["total_executions"] += 1
            self.execution_stats["successful"] += 1
            self.execution_stats["total_time"] += execution_time

            return {
                "success": True,
                "result": result,
                "execution_time": execution_time,
                "skill": skill_name
            }

        except asyncio.TimeoutError:
            execution_time = (datetime.now() - start_time).total_seconds()
            self.execution_stats["total_executions"] += 1
            self.execution_stats["failed"] += 1

            return {
                "success": False,
                "error": f"Skill execution timed out after {timeout}s",
                "error_type": "TimeoutError",
                "execution_time": execution_time,
                "skill": skill_name
            }

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            self.execution_stats["total_executions"] += 1
            self.execution_stats["failed"] += 1

            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc(),
                "execution_time": execution_time,
                "skill": skill_name
            }

    def _resolve_skill_path(self, skill_name: str) -> Path:
        """
        Resolve skill package path

        Args:
            skill_name: Name of the skill

        Returns:
            Path to skill package

        Raises:
            FileNotFoundError: If skill doesn't exist
        """
        skill_path = self.skills_path / skill_name

        if not skill_path.exists():
            raise FileNotFoundError(
                f"Skill '{skill_name}' not found at {skill_path}"
            )

        # Check for index.py or __init__.py
        index_py = skill_path / "index.py"
        init_py = skill_path / "__init__.py"

        if not (index_py.exists() or init_py.exists()):
            raise FileNotFoundError(
                f"Skill '{skill_name}' missing index.py or __init__.py"
            )

        return skill_path

    async def _load_skill(self, skill_name: str, skill_path: Path) -> Any:
        """
        Load skill module dynamically

        Args:
            skill_name: Name of the skill
            skill_path: Path to skill package

        Returns:
            Loaded module
        """
        # Check cache
        if skill_name in self.loaded_modules:
            module_data = self.loaded_modules[skill_name]
            # Check if cache is still valid
            if datetime.now().timestamp() - module_data["timestamp"] < self._cache_ttl:
                return module_data["module"]
            else:
                # Cache expired, remove it
                del self.loaded_modules[skill_name]

        # Determine entry point
        index_py = skill_path / "index.py"
        init_py = skill_path / "__init__.py"

        entry_point = index_py if index_py.exists() else init_py

        # Load module with retry
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                spec = importlib.util.spec_from_file_location(
                    f"skills.{skill_name}",
                    entry_point
                )

                if spec is None or spec.loader is None:
                    raise ImportError(f"Cannot load skill '{skill_name}'")

                # Success - break retry loop
                break

            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    # Wait before retry (exponential backoff)
                    await asyncio.sleep(0.1 * (2 ** attempt))
                else:
                    # Last attempt - raise the error
                    raise ImportError(
                        f"Failed to load skill '{skill_name}' after {self.max_retries} attempts: {last_exception}"
                    ) from last_exception

        module = importlib.util.module_from_spec(spec)
        sys.modules[f"skills.{skill_name}"] = module
        spec.loader.exec_module(module)

        # Cache module with timestamp
        self.loaded_modules[skill_name] = {
            "module": module,
            "timestamp": datetime.now().timestamp()
        }

        return module

    async def _execute_skill_module(
        self,
        module: Any,
        params: Dict[str, Any]
    ) -> Any:
        """
        Execute the skill module's main function

        Args:
            module: Loaded skill module
            params: Execution parameters

        Returns:
            Skill execution result
        """
        # Look for execute() or main() function
        if hasattr(module, "execute"):
            execute_fn = module.execute
        elif hasattr(module, "main"):
            execute_fn = module.main
        else:
            raise AttributeError(
                "Skill module must have 'execute' or 'main' function"
            )

        # Execute (handle both sync and async)
        if asyncio.iscoroutinefunction(execute_fn):
            result = await execute_fn(**params)
        else:
            result = execute_fn(**params)

        return result

    def get_stats(self) -> Dict[str, Any]:
        """Get execution statistics"""
        return {
            **self.execution_stats,
            "average_time": (
                self.execution_stats["total_time"] /
                self.execution_stats["total_executions"]
                if self.execution_stats["total_executions"] > 0
                else 0
            ),
            "success_rate": (
                self.execution_stats["successful"] /
                self.execution_stats["total_executions"]
                if self.execution_stats["total_executions"] > 0
                else 0
            )
        }

    def clear_cache(self):
        """Clear loaded modules cache"""
        self.loaded_modules.clear()

    def _cleanup_expired_cache(self):
        """
        Remove expired entries from cache
        """
        current_time = datetime.now().timestamp()
        expired_keys = [
            key for key, data in self.loaded_modules.items()
            if current_time - data["timestamp"] > self._cache_ttl
        ]

        for key in expired_keys:
            del self.loaded_modules[key]


# CLI interface for testing
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Execute Claude Skills")
    parser.add_argument("skill", help="Skill name to execute")
    parser.add_argument("--params", help="JSON parameters", default="{}")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    params = json.loads(args.params)

    # Create executor and run async execution
    executor = SkillExecutor()
    result = asyncio.run(
        executor.execute_skill(args.skill, params, args.timeout)
    )

    print(json.dumps(result, indent=2))