"""
Apify

Web scraping and automation

Exemplo de uso:
    from servers.scraping.apify import run_actor

    result = await run_actor('web-scraper', config)
"""

from .run_actor import run_actor
from .get_dataset import get_dataset

__all__ = ['run_actor', 'get_dataset']

# Metadata
__version__ = '0.5.1'
__description__ = 'Web scraping and automation'