"""
Guardrails AI

LLM validation and security guardrails

Exemplo de uso:
    from servers.security.guardrails import validate

    result = await validate(text, rules)
"""

from .validate import validate
from .scan import scan

__all__ = ['validate', 'scan']

# Metadata
__version__ = '0.6.7'
__description__ = 'LLM validation and security guardrails'