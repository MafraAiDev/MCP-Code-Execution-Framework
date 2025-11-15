# Tools de Segurança e Qualidade

**IMPORTANTE:** guardrails-ai e Garak são **FERRAMENTAS PYTHON STANDALONE**, NÃO são MCPs!

---

## FERRAMENTAS DISPONÍVEIS

### 1. Guardrails-AI
**Tipo:** Biblioteca Python + REST API (opcional)
**Instalado:** Sim (v0.6.7)
**Repositório:** https://github.com/guardrails-ai/guardrails

**Uso:**
- Validação de entrada/saída de LLMs
- Estruturação de dados
- Detecção de riscos de segurança

**Documentação:** [GUARDRAILS-AI-SETUP.md](./GUARDRAILS-AI-SETUP.md)

---

### 2. Garak
**Tipo:** Ferramenta CLI Python
**Instalado:** Sim (v0.13.1)
**Repositório:** https://github.com/NVIDIA/garak

**Uso:**
- Auditoria de segurança de LLMs
- Red-teaming de modelos
- Detecção de vulnerabilidades

**Documentação:** [GARAK-SETUP.md](./GARAK-SETUP.md)

---

## DIFERENÇA: MCPs vs TOOLS

### MCPs (Model Context Protocol)
- Protocolo de extensão do Claude Code
- Executam via servidor MCP
- Localização: `~/.claude/mcp-scripts/`
- Exemplos: taskmaster-mcp, sequential-thinking, cipher-mcp

### Tools (Ferramentas Standalone)
- Bibliotecas ou CLIs Python independentes
- Executam via `pip install` e `python`
- **guardrails-ai** e **Garak** são TOOLS, não MCPs
- Integram via código Python ou CLI

---

## USO NO SISTEMA DE 3 MODELOS

### Model A (Gerente)

**Ferramentas que usa:**
- **Guardrails-AI:** Validação de segurança durante execução
- **Garak:** Auditoria final do projeto

**MCPs que usa:**
- taskmaster-mcp
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

### Model B (Corretor)

**Ferramentas que usa:**
- Nenhuma diretamente

**MCPs que usa:**
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

### Model C (Executor)

**Ferramentas que usa:**
- Nenhuma diretamente

**MCPs que usa:**
- sequential-thinking
- cipher-mcp-v0.3.0
- byterover-mcp

---

## INSTALAÇÃO

### Verificar Instalação

```bash
# Guardrails-AI
pip list | grep guardrails

# Garak
pip list | grep garak
```

### Instalar (se necessário)

```bash
# Guardrails-AI
pip install guardrails-ai

# Garak
python -m pip install -U garak
```

---

## LINKS RÁPIDOS

- [Guardrails-AI Setup](./GUARDRAILS-AI-SETUP.md)
- [Garak Setup](./GARAK-SETUP.md)

---

**Ambas ferramentas estão instaladas e prontas para uso!**
