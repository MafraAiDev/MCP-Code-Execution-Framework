# PLANNING.md - Template

**Projeto:** [Nome do Projeto]
**Data de Início:** [YYYY-MM-DD]
**Última Atualização:** [YYYY-MM-DD]
**Model A (Gerente):** [Nome/ID da sessão]

---

## VISÃO GERAL

### Objetivo do Projeto
[Descreva em 2-3 parágrafos o que o projeto faz e por que existe]

### Problema que Resolve
[Descreva o problema específico que este projeto soluciona]

### Usuários-Alvo
[Quem vai usar este projeto? Desenvolvedores? Usuários finais? Sistemas?]

---

## ARQUITETURA

### Visão de Alto Nível

```
┌─────────────────────────────────────┐
│         [Componente Principal]      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐      ┌──────────┐   │
│  │ Módulo A │────→ │ Módulo B │   │
│  └──────────┘      └──────────┘   │
│       │                 │          │
│       ↓                 ↓          │
│  ┌──────────┐      ┌──────────┐   │
│  │ Módulo C │      │ Módulo D │   │
│  └──────────┘      └──────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Componentes Principais

#### Componente 1: [Nome]
- **Responsabilidade:** [O que faz]
- **Tecnologia:** [Linguagem/Framework]
- **Localização:** `path/to/component/`
- **Dependências:** [Lista de dependências]

#### Componente 2: [Nome]
- **Responsabilidade:** [O que faz]
- **Tecnologia:** [Linguagem/Framework]
- **Localização:** `path/to/component/`
- **Dependências:** [Lista de dependências]

---

## STACK TECNOLÓGICO

### Linguagem Principal
- **Linguagem:** Python 3.11+
- **Motivo:** [Por que esta linguagem]

### Frameworks e Bibliotecas

#### Backend
- **Framework:** [FastAPI / Flask / Django / etc]
- **ORM:** [SQLAlchemy / SQLModel / etc]
- **Validação:** [Pydantic]
- **Testes:** [Pytest]

#### Frontend (se aplicável)
- **Framework:** [React / Vue / etc]
- **Build Tool:** [Vite / Webpack / etc]

#### Banco de Dados
- **Tipo:** [PostgreSQL / MySQL / SQLite / MongoDB / etc]
- **Motivo:** [Por que este banco]

#### Infraestrutura
- **Containerização:** Docker
- **Orquestração:** [Docker Compose / Kubernetes / nenhum]
- **CI/CD:** [GitHub Actions / GitLab CI / etc]

---

## ESTRUTURA DE DIRETÓRIOS

```
projeto/
├── README.md                    # Documentação principal
├── PLANNING.md                  # Este arquivo
├── TASK.md                      # Gestão de tarefas
├── requirements.txt             # Dependências Python
├── .env.example                 # Template de variáveis de ambiente
├── Dockerfile                   # Container principal
├── docker-compose.yml           # Orquestração local
├── .gitignore                   # Arquivos ignorados pelo Git
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline CI/CD
├── src/                         # Código-fonte principal
│   ├── __init__.py
│   ├── main.py                  # Entry point
│   ├── config.py                # Configurações
│   ├── core/                    # Lógica de negócio central
│   │   ├── __init__.py
│   │   ├── models.py            # Modelos de dados
│   │   ├── schemas.py           # Schemas Pydantic
│   │   └── utils.py             # Utilitários
│   ├── api/                     # API/Endpoints (se aplicável)
│   │   ├── __init__.py
│   │   ├── routes.py            # Definição de rotas
│   │   └── handlers.py          # Handlers de requisições
│   └── services/                # Serviços externos
│       ├── __init__.py
│       └── database.py          # Conexão com banco
├── tests/                       # Testes unitários e integração
│   ├── __init__.py
│   ├── conftest.py              # Configuração Pytest
│   ├── test_core.py
│   ├── test_api.py
│   └── test_services.py
└── docs/                        # Documentação adicional
    ├── architecture.md          # Detalhes de arquitetura
    ├── api.md                   # Documentação de API
    └── deployment.md            # Guia de deploy
```

---

## PADRÕES DE DESIGN

### Padrões Arquiteturais
- **[Nome do Padrão]:** [Repository / Service Layer / MVC / etc]
  - **Aplicação:** [Onde e como é usado]
  - **Motivo:** [Por que escolhido]

### Convenções de Código

#### Nomenclatura
- **Variáveis:** `snake_case`
- **Funções:** `snake_case`
- **Classes:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Arquivos:** `snake_case.py`
- **Diretórios:** `snake_case/`

#### Imports
```python
# 1. Bibliotecas padrão
import os
from typing import List, Optional

# 2. Bibliotecas terceiros
from fastapi import FastAPI
from pydantic import BaseModel

# 3. Imports locais
from src.core.models import User
from src.core.utils import hash_password
```

#### Docstrings
- **Formato:** Google Style
- **Obrigatório em:** Todas funções públicas, classes, módulos

---

## RESTRIÇÕES E LIMITAÇÕES

### Restrições Técnicas
- **Memória:** [Limite de memória se aplicável]
- **Performance:** [Requisitos de performance]
- **Compatibilidade:** [Versões suportadas]

### Limitações Conhecidas
- [Limitação 1]
- [Limitação 2]

### Trade-offs Arquiteturais
- **Decisão:** [Descrição]
  - **Alternativa considerada:** [O que não foi escolhido]
  - **Motivo da escolha:** [Por que escolhemos esta opção]

---

## SEGURANÇA

### Princípios de Segurança
- Aplicar Power of Ten (NASA/JPL)
- Zero trust por padrão
- Validação de entrada rigorosa
- Sanitização de output
- Princípio do menor privilégio

### Ferramentas de Segurança
- **guardrails-ai:** Verificação de segurança em tempo real
- **Garak:** Auditoria de código
- **bandit:** Análise estática de segurança Python
- **Safety:** Verificação de vulnerabilidades em dependências

### Checklist de Segurança
- [ ] Validação de entrada em todas APIs
- [ ] Sanitização de dados antes de persistir
- [ ] Uso de prepared statements (SQL injection prevention)
- [ ] Rate limiting implementado
- [ ] Logs de segurança habilitados
- [ ] Secrets em variáveis de ambiente (nunca em código)

---

## QUALIDADE DE CÓDIGO

### Ferramentas Obrigatórias
- **pylint:** Linting rigoroso
- **mypy:** Type checking estrito
- **black:** Formatação automática
- **isort:** Organização de imports
- **pytest:** Framework de testes
- **coverage:** Cobertura de testes (mínimo 80%)

### Comandos de Verificação
```bash
# Linting
pylint --max-line-length=100 src/

# Type checking
mypy --strict src/

# Segurança
bandit -r src/ -ll

# Formatação
black src/ tests/

# Organizar imports
isort src/ tests/

# Testes
pytest --cov=src --cov-report=html

# Tudo de uma vez
make check  # (definir no Makefile)
```

---

## TESTES

### Estratégia de Testes

#### Testes Unitários
- **Cobertura Mínima:** 80%
- **Ferramentas:** Pytest
- **Localização:** `tests/test_*.py`
- **Padrão:** Mínimo 3 testes por função (sucesso, edge case, falha)

#### Testes de Integração
- **Escopo:** Integração entre módulos
- **Ferramentas:** Pytest + Docker (para banco de dados)
- **Localização:** `tests/integration/`

#### Testes de Performance (se aplicável)
- **Ferramentas:** [Locust / pytest-benchmark / etc]
- **Critérios:** [Requisitos de performance]

---

## DEPLOYMENT

### Ambientes

#### Desenvolvimento
- **Onde:** Local (Docker Compose)
- **Banco:** SQLite ou PostgreSQL local
- **Configuração:** `.env.development`

#### Staging (opcional)
- **Onde:** [Servidor/Cloud]
- **Banco:** [Tipo e localização]
- **Configuração:** `.env.staging`

#### Produção
- **Onde:** [Servidor/Cloud]
- **Banco:** [Tipo e localização]
- **Configuração:** `.env.production`
- **Backup:** [Estratégia de backup]

### Build e Deploy

#### Build Docker
```bash
docker build -t projeto:latest .
```

#### Deploy
```bash
# Método: [Docker / Kubernetes / Manual / etc]
[Comandos específicos de deploy]
```

---

## DEPENDÊNCIAS

### Dependências Python (requirements.txt)
```
# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0

# Database
sqlalchemy==2.0.23
alembic==1.12.1

# Testes
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1

# Qualidade
pylint==3.0.2
mypy==1.7.1
black==23.11.0
isort==5.12.0
bandit==1.7.5
```

### Dependências de Sistema
```
python >= 3.11
docker >= 24.0
docker-compose >= 2.0
```

---

## ROADMAP

### Fase 1: MVP (Mínimo Produto Viável)
- [ ] Setup inicial do projeto
- [ ] Estrutura base de diretórios
- [ ] Configuração de CI/CD
- [ ] [Funcionalidade core 1]
- [ ] [Funcionalidade core 2]

### Fase 2: Features Principais
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

### Fase 3: Melhorias e Otimizações
- [ ] Performance tuning
- [ ] Documentação completa
- [ ] Testes de carga
- [ ] Monitoramento

### Fase 4: Produção
- [ ] Deploy em produção
- [ ] Monitoramento ativo
- [ ] Feedback de usuários

---

## DECISÕES TÉCNICAS IMPORTANTES

### Decisão 1: [Título]
- **Data:** [YYYY-MM-DD]
- **Contexto:** [Por que precisamos decidir]
- **Opções consideradas:**
  - Opção A: [Prós e contras]
  - Opção B: [Prós e contras]
- **Decisão:** [O que foi escolhido]
- **Motivo:** [Justificativa]
- **Impacto:** [Consequências da decisão]

### Decisão 2: [Título]
- **Data:** [YYYY-MM-DD]
- [Mesmo formato acima]

---

## REFERÊNCIAS

### Documentação Técnica
- [Link para documentação de framework principal]
- [Link para documentação de bibliotecas importantes]

### Recursos de Aprendizado
- [Tutoriais relevantes]
- [Artigos técnicos]

### Projetos Similares
- [Repositórios de referência]

---

## GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| [Termo 1] | [Definição] |
| [Termo 2] | [Definição] |

---

## CHANGELOG DO PLANNING

### [YYYY-MM-DD]
- Criação inicial do PLANNING.md

### [YYYY-MM-DD]
- [Descrição das mudanças]

---

**Nota para Model A:** Este arquivo deve ser referenciado no início de TODA nova conversa.
**Comando:** "Use the structure and decisions outlined in PLANNING.md."
