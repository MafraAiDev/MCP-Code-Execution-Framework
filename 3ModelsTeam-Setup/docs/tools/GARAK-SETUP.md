# Garak - LLM Security Scanner

**Tipo:** Ferramenta standalone Python (NÃO é MCP)
**Repositório:** https://github.com/NVIDIA/garak
**Versão instalada:** 0.13.1
**Desenvolvido por:** NVIDIA

---

## O QUE É GARAK

**Generative AI Red-teaming & Assessment Kit**

Ferramenta de código aberto para realizar testes de segurança em modelos de linguagem. Verifica se um LLM pode falhar de maneiras indesejáveis.

---

## INSTALAÇÃO

### Verificar se está instalado

```bash
pip list | grep garak
```

**Saída esperada:**
```
garak                                    0.13.1
```

### Instalar (se necessário)

```bash
python -m pip install -U garak
```

---

## USO COM MODEL A (GERENTE)

### Papel no Sistema de 3 Modelos

**Model A** usa garak para:
- Auditar código produzido por Model B e Model C
- Verificar vulnerabilidades de segurança
- Testar resiliência contra ataques
- Validar qualidade final do projeto

---

## VULNERABILIDADES DETECTADAS

Garak procura por:

1. **Alucinações** - LLM inventa fatos
2. **Vazamento de dados** - LLM expõe informações sensíveis
3. **Injeção de prompts** - LLM aceita instruções maliciosas
4. **Desinformação** - LLM gera informações falsas
5. **Conteúdo tóxico** - LLM gera conteúdo ofensivo
6. **Jailbreaks** - LLM contorna suas próprias restrições
7. **Encoding attacks** - LLM vulnerável a ataques de codificação

---

## COMPONENTES PRINCIPAIS

### 1. Probes (Sondas)
Geram interações com LLMs para identificar vulnerabilidades

### 2. Detectors (Detectores)
Analisam respostas para encontrar falhas específicas

### 3. Generators
Interfaces com diferentes modelos (OpenAI, Hugging Face, etc.)

---

## COMANDOS PRINCIPAIS

### Listar Probes Disponíveis

```bash
garak --list_probes
```

### Listar Detectors Disponíveis

```bash
garak --list_detectors
```

### Listar Generators Suportados

```bash
garak --list_generators
```

---

## EXECUTAR AUDITORIA

### Auditoria Completa (Todas as Probes)

```bash
# OpenAI
garak --target_type openai --target_name gpt-3.5-turbo

# Hugging Face
garak --target_type huggingface --target_name gpt2

# API customizada
garak --target_type rest --target_uri http://localhost:8000/v1/chat
```

### Auditoria Específica

```bash
# Testar apenas DAN (Do Anything Now) jailbreak
garak --target_type openai --target_name gpt-3.5-turbo --probes dan.Dan_11_0

# Testar encoding attacks
garak --target_type openai --target_name gpt-3.5-turbo --probes encoding

# Testar injeção de prompts
garak --target_type openai --target_name gpt-3.5-turbo --probes promptinject
```

### Auditoria com Múltiplas Probes

```bash
garak --target_type openai \
  --target_name gpt-3.5-turbo \
  --probes dan,encoding,promptinject
```

---

## USO PRÁTICO COM CLAUDE CODE

### Cenário 1: Auditar Código Gerado

```bash
# Criar arquivo com código gerado por Model B ou Model C
echo "código python aqui" > generated_code.py

# Testar o código com garak (se for um LLM endpoint)
# Nota: Garak testa LLMs, não código diretamente
# Use para testar se o código implementa um LLM de forma segura
```

### Cenário 2: Auditar Respostas de LLM Custom

Se você criou uma API customizada com o código gerado:

```bash
# Iniciar seu servidor LLM
python your_llm_server.py

# Auditar com garak
garak --target_type rest \
  --target_uri http://localhost:8000/api/chat \
  --probes dan,encoding,promptinject,toxicity
```

### Cenário 3: Auditar Antes de Deploy

```bash
# Script de pré-deploy
#!/bin/bash

echo "Iniciando auditoria de segurança com Garak..."

garak --target_type openai \
  --target_name gpt-3.5-turbo \
  --probes all \
  --report_prefix pre-deploy-audit

if [ $? -eq 0 ]; then
    echo "Auditoria passou! OK para deploy."
else
    echo "Auditoria falhou! Revisar vulnerabilidades."
    exit 1
fi
```

---

## PROBES RECOMENDADAS PARA MODEL A

### Segurança Crítica

```bash
# DAN (Do Anything Now) - Jailbreak
garak --probes dan

# Prompt Injection
garak --probes promptinject

# Encoding Attacks
garak --probes encoding
```

### Qualidade e Confiabilidade

```bash
# Hallucination Detection
garak --probes hallucination

# Toxicity
garak --probes toxicity

# Package Hallucination (LLM inventa pacotes)
garak --probes packagehallucination
```

### Vazamento de Dados

```bash
# Leak Detection
garak --probes leakreplay

# Data Disclosure
garak --probes continuation
```

---

## INTEGRAÇÃO COM WORKFLOW DE 3 MODELOS

### Fase 4: Auditoria (Model A)

```markdown
## Workflow de Auditoria com Garak

### Passo 1: Model B e Model C Completam Tarefas
- Model C executa tarefas MÉDIA/BAIXA
- Model B corrige erros MÉDIA
- Ambos geram relatórios

### Passo 2: Model A Coleta Outputs
- Ler relatórios de Model B e Model C
- Identificar código/endpoints gerados

### Passo 3: Model A Executa Garak
```bash
# Se houver LLM endpoint criado
garak --target_type rest \
  --target_uri http://localhost:PORT/endpoint \
  --probes dan,promptinject,encoding,toxicity \
  --report_prefix project-audit
```

### Passo 4: Analisar Resultados
- Garak gera relatório em `garak_runs/`
- Model A analisa vulnerabilidades encontradas
- Se houver problemas → Delega correção para Model B

### Passo 5: Re-auditar Após Correções
- Model B implementa correções
- Model A re-executa Garak
- Aprovar somente se passar em todos testes
```

---

## ESTRUTURA DE RELATÓRIOS

Garak gera relatórios em: `garak_runs/garak.[timestamp].[target]/`

### Arquivos Gerados

```
garak_runs/
└── garak.20250114_143022.openai.gpt-3.5-turbo/
    ├── report.jsonl          # Relatório detalhado
    ├── report.html           # Relatório visual
    └── hitlog.jsonl          # Log de vulnerabilidades
```

### Analisar Relatório

```bash
# Ver relatório HTML
start garak_runs/garak.*/report.html  # Windows
open garak_runs/garak.*/report.html   # Mac

# Ver hitlog (vulnerabilidades encontradas)
cat garak_runs/garak.*/hitlog.jsonl | jq
```

---

## EXEMPLO COMPLETO DE AUDITORIA

```bash
#!/bin/bash
# audit-project.sh

echo "=========================================="
echo "  AUDITORIA DE SEGURANÇA - MODEL A"
echo "=========================================="
echo ""

# Configurar variáveis
TARGET_TYPE="rest"
TARGET_URI="http://localhost:8000/api/chat"
REPORT_PREFIX="model-a-audit-$(date +%Y%m%d)"

# Executar auditoria
echo "[1/3] Testando jailbreaks e injection..."
garak --target_type $TARGET_TYPE \
  --target_uri $TARGET_URI \
  --probes dan,promptinject \
  --report_prefix "${REPORT_PREFIX}-injection"

echo ""
echo "[2/3] Testando encoding attacks..."
garak --target_type $TARGET_TYPE \
  --target_uri $TARGET_URI \
  --probes encoding \
  --report_prefix "${REPORT_PREFIX}-encoding"

echo ""
echo "[3/3] Testando toxicity e hallucination..."
garak --target_type $TARGET_TYPE \
  --target_uri $TARGET_URI \
  --probes toxicity,hallucination \
  --report_prefix "${REPORT_PREFIX}-quality"

echo ""
echo "=========================================="
echo "  AUDITORIA COMPLETA!"
echo "=========================================="
echo ""
echo "Relatórios gerados em:"
ls -la garak_runs/${REPORT_PREFIX}*/report.html
```

---

## CONFIGURAÇÃO AVANÇADA

### Arquivo de Config (garak.yaml)

```yaml
# garak.yaml
target:
  type: rest
  uri: http://localhost:8000/api/chat

probes:
  - dan
  - promptinject
  - encoding
  - toxicity

detectors:
  - always_pass
  - mitigation

reporting:
  format: html
  output_dir: ./audit-reports
```

**Executar com config:**
```bash
garak --config garak.yaml
```

---

## TROUBLESHOOTING

### Erro: API Key Missing

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Hugging Face
export HUGGING_FACE_TOKEN="hf_..."
```

### Erro: Target Unreachable

```bash
# Verificar se servidor está rodando
curl http://localhost:8000/health

# Testar endpoint manualmente
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Performance Lenta

```bash
# Reduzir número de probes
garak --target_type openai \
  --target_name gpt-3.5-turbo \
  --probes dan  # Apenas uma probe

# Limitar gerações por probe
garak --target_type openai \
  --target_name gpt-3.5-turbo \
  --probes dan \
  --generations 10  # Padrão: 25
```

---

## BOAS PRÁTICAS PARA MODEL A

### 1. Auditar Antes de Aprovar Projeto

```bash
# Sempre executar garak antes de marcar projeto como concluído
garak --target_type rest --target_uri $ENDPOINT --probes all
```

### 2. Documentar Resultados em TASK.md

```markdown
## Auditoria de Segurança (Garak)

### Data: 2025-01-14
### Probes Executadas: dan, promptinject, encoding, toxicity

### Resultados:
- [OK] DAN jailbreak: Nenhuma vulnerabilidade
- [X] Prompt Injection: 2 vulnerabilidades encontradas
- [OK] Encoding Attacks: Nenhuma vulnerabilidade
- [OK] Toxicity: Nenhuma vulnerabilidade

### Ações:
- Delegado correção de Prompt Injection para Model B
```

### 3. Re-auditar Após Correções

```bash
# Após Model B corrigir
garak --target_type rest \
  --target_uri $ENDPOINT \
  --probes promptinject  # Apenas o que falhou
```

---

## INTEGRAÇÃO COM CI/CD

```yaml
# .github/workflows/security-audit.yml
name: Security Audit with Garak

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Garak
        run: pip install garak

      - name: Start API Server
        run: python server.py &

      - name: Run Security Audit
        run: |
          garak --target_type rest \
            --target_uri http://localhost:8000/api \
            --probes dan,promptinject,encoding

      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: garak-report
          path: garak_runs/
```

---

## DOCUMENTAÇÃO ADICIONAL

- **GitHub:** https://github.com/NVIDIA/garak
- **Documentação:** https://docs.garak.ai/ (em desenvolvimento)
- **Discord:** https://discord.gg/uVch4puUCs
- **Paper:** https://arxiv.org/abs/2406.11036

---

## RESUMO PARA MODEL A

```bash
# Setup básico para auditoria de projeto

# 1. Listar probes disponíveis
garak --list_probes

# 2. Executar auditoria completa
garak --target_type rest \
  --target_uri http://localhost:8000/endpoint \
  --probes dan,promptinject,encoding,toxicity,hallucination

# 3. Analisar resultados
cat garak_runs/garak.*/hitlog.jsonl | jq

# 4. Se falhou → Delegar correção para Model B
# 5. Re-auditar após correção
# 6. Aprovar somente se passar 100%
```

**Garak está instalado e pronto para auditoria de segurança!**
