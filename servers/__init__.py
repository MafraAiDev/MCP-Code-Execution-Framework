"""
MCP Servers - Módulos Python Importáveis

Organização de 25+ MCPs em categorias
Progressive Disclosure: Import sob demanda
"""

# Registry de categorias
CATEGORIES = {
    'security': ['guardrails', 'garak', 'cipher'],
    'scraping': ['apify', 'crawl4ai'],
    'dev': ['chrome_devtools', 'magic', 'react_bits', 'shadcn'],
    'workflows': ['n8n'],
    'utils': ['clickup', 'context7', 'sequential_thinking', 'testsprite'],
    'integrations': ['supabase', 'dinastia_api', 'vapi'],
    'infrastructure': ['docker_gateway']
}

# Metadata completo
REGISTRY = {
    'security': {
        'guardrails': {
            'name': 'Guardrails AI',
            'version': '0.6.7',
            'description': 'LLM validation and security guardrails',
            'functions': ['validate', 'scan']
        },
        'garak': {
            'name': 'NVIDIA Garak',
            'version': '0.13.1',
            'description': 'LLM vulnerability scanner',
            'functions': ['scan', 'report']
        },
        'cipher': {
            'name': 'Cipher',
            'version': '0.3.0',
            'description': 'Encryption and decryption for LLMs',
            'functions': ['encrypt', 'decrypt']
        }
    },
    'scraping': {
        'apify': {
            'name': 'Apify',
            'version': '0.5.1',
            'description': 'Web scraping and automation',
            'functions': ['run_actor', 'get_dataset']
        },
        'crawl4ai': {
            'name': 'Crawl4AI',
            'version': 'latest',
            'description': 'AI-powered web crawling',
            'functions': ['crawl', 'extract']
        }
    },
    'dev': {
        'chrome_devtools': {
            'name': 'Chrome DevTools',
            'version': '0.10.0',
            'description': 'Chrome DevTools automation',
            'functions': ['inspect', 'debug']
        },
        'magic': {
            'name': 'Magic',
            'version': '1.0.0',
            'description': 'Magic development tools',
            'functions': ['generate', 'optimize']
        },
        'react_bits': {
            'name': 'React Bits',
            'version': '1.0.0',
            'description': 'React component library',
            'functions': ['component', 'template']
        },
        'shadcn': {
            'name': 'shadcn/ui',
            'version': 'latest',
            'description': 'UI component library',
            'functions': ['component', 'theme']
        }
    },
    'workflows': {
        'n8n': {
            'name': 'n8n',
            'version': '1.0.0',
            'description': 'Workflow automation',
            'functions': ['workflow', 'execute']
        }
    },
    'utils': {
        'clickup': {
            'name': 'ClickUp',
            'version': '1.0.0',
            'description': 'Project management',
            'functions': ['task', 'project']
        },
        'context7': {
            'name': 'Context7',
            'version': '1.0.0',
            'description': 'Context management',
            'functions': ['context', 'memory']
        },
        'sequential_thinking': {
            'name': 'Sequential Thinking',
            'version': '1.0.0',
            'description': 'Sequential reasoning',
            'functions': ['think', 'reason']
        },
        'testsprite': {
            'name': 'TestSprite',
            'version': '1.0.0',
            'description': 'Testing framework',
            'functions': ['test', 'validate']
        }
    },
    'integrations': {
        'supabase': {
            'name': 'Supabase',
            'version': '1.0.0',
            'description': 'Backend as a Service',
            'functions': ['query', 'insert', 'update']
        },
        'dinastia_api': {
            'name': 'Dinastia API',
            'version': '1.0.0',
            'description': 'Brazilian API integration',
            'functions': ['consult', 'process']
        },
        'vapi': {
            'name': 'VAPI',
            'version': '1.0.0',
            'description': 'Voice AI platform',
            'functions': ['call', 'transcribe']
        }
    },
    'infrastructure': {
        'docker_gateway': {
            'name': 'Docker Gateway',
            'version': '1.0.0',
            'description': 'Docker container management',
            'functions': ['run', 'build', 'deploy']
        }
    }
}

def list_categories():
    """Lista todas as categorias de MCPs"""
    return list(CATEGORIES.keys())

def list_mcps(category=None):
    """Lista MCPs de uma categoria ou todos"""
    if category:
        return CATEGORIES.get(category, [])
    return CATEGORIES

def get_mcp_info(category, mcp_name):
    """Obtém informações de um MCP específico"""
    return REGISTRY.get(category, {}).get(mcp_name)

__all__ = ['CATEGORIES', 'REGISTRY', 'list_categories', 'list_mcps', 'get_mcp_info']