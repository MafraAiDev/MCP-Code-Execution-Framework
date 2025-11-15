# MCP Servers - Módulos Python

## Estrutura

MCPs organizados como módulos Python importáveis para Progressive Disclosure.

## Categorias

- **security/**: Segurança e validação (Guardrails, Garak, Cipher)
- **scraping/**: Web scraping (Apify, Crawl4AI)
- **dev/**: Ferramentas de desenvolvimento
- **workflows/**: Automação de workflows
- **utils/**: Utilitários diversos
- **integrations/**: Integrações externas
- **infrastructure/**: Infraestrutura e containers

## Uso

```python
# Level 1: Ver categorias
from servers import list_categories
print(list_categories())

# Level 2: Ver MCPs de uma categoria
from servers import list_mcps
print(list_mcps('scraping'))

# Level 3: Importar e usar
from servers.scraping.apify import run_actor
result = await run_actor('web-scraper', {...})
```

## Convenções

- Arquivos privados começam com `_` (ex: `_client.py`)
- Cada MCP tem seu próprio diretório
- Funções públicas exportadas via `__init__.py`
- Funções assíncronas (async/await) quando apropriado