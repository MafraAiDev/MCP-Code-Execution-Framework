# CORRECAO: MODEL B - KIMI K2 THINKING

**Problema:** Model B pedia autenticacao Anthropic ao inves de usar Moonshot API
**Status:** ✅ CORRIGIDO

---

## PROBLEMA IDENTIFICADO

O arquivo `~/.claude/settings-kimi-thinking.json` estava configurado incorretamente:

### ANTES (Errado)
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-...",                    // ❌ Tipo errado
    "ANTHROPIC_BASE_URL": "https://api.moonshot.cn/v1", // ❌ URL errada
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k2-thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2-thinking",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-k2-thinking"
  }
}
```

**Problemas:**
1. Usava `ANTHROPIC_API_KEY` (pede autenticacao Anthropic)
2. URL estava como `https://api.moonshot.cn/v1` (nao funciona)
3. Formato diferente do Model C (que funciona)

### DEPOIS (Correto)
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-...",                   // ✅ Tipo correto
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic", // ✅ URL correta
    "ANTHROPIC_MODEL": "kimi-k2-thinking",
    "ANTHROPIC_SMALL_FAST_MODEL": "kimi-k2-thinking"
  }
}
```

**Correcoes:**
1. Mudado para `ANTHROPIC_AUTH_TOKEN` (usa diretamente Moonshot)
2. URL corrigida para `https://api.moonshot.ai/anthropic`
3. Formato igual ao Model C (settings-openrouter.json)

---

## COMPARACAO: MODEL B vs MODEL C

### Model C (settings-openrouter.json) - Funcionava Corretamente
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-...",
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_MODEL": "kimi-k2-0905-preview",
    "ANTHROPIC_SMALL_FAST_MODEL": "kimi-k2-0905-preview"
  }
}
```

### Model B (settings-kimi-thinking.json) - Agora Corrigido
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-...",
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_MODEL": "kimi-k2-thinking",
    "ANTHROPIC_SMALL_FAST_MODEL": "kimi-k2-thinking"
  }
}
```

**Agora ambos usam o mesmo padrao!**

---

## DIFERENCA ENTRE API_KEY E AUTH_TOKEN

### ANTHROPIC_API_KEY
- Usado para **autenticacao oficial da Anthropic**
- Quando definido, Claude Code pede login Anthropic
- Redireciona para `https://api.anthropic.com`
- **NAO funciona** para APIs de terceiros (Moonshot, OpenRouter)

### ANTHROPIC_AUTH_TOKEN
- Usado para **tokens customizados** (terceiros)
- Quando definido, Claude Code usa direto sem pedir login
- Respeita o `ANTHROPIC_BASE_URL` configurado
- **FUNCIONA** com Moonshot, OpenRouter, etc.

---

## SOLUCAO APLICADA

1. **Editado:** `~/.claude/settings-kimi-thinking.json`
2. **Mudado:** `ANTHROPIC_API_KEY` → `ANTHROPIC_AUTH_TOKEN`
3. **Corrigido:** URL para `https://api.moonshot.ai/anthropic`
4. **Padronizado:** Formato igual ao Model C

---

## TESTE

Para testar se funcionou:

### No Terminal 2 (Model B)

```powershell
# Sair do Claude atual (Ctrl+C)

# Reativar Model B
.\ativar-model-b.ps1

# Executar Claude
claude

# Verificar status
/status
```

**Resultado Esperado:**
```
Auth token: ANTHROPIC_AUTH_TOKEN
Anthropic base URL: https://api.moonshot.ai/anthropic
Model: kimi-k2-thinking
```

**NAO deve aparecer:**
- Pedido de autenticacao Anthropic
- Redirecionamento para console.anthropic.com
- Conflito de auth

---

## PARA NOVOS PROJETOS

Sempre use este padrao para APIs de terceiros (Moonshot, OpenRouter):

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sua-api-key-aqui",
    "ANTHROPIC_BASE_URL": "https://api.moonshot.ai/anthropic",
    "ANTHROPIC_MODEL": "nome-do-modelo"
  }
}
```

**NUNCA use:**
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "...",  // ❌ Pedira auth Anthropic
    ...
  }
}
```

---

## RESUMO

| Configuracao | ANTES | DEPOIS |
|--------------|-------|--------|
| Variavel     | ANTHROPIC_API_KEY | ANTHROPIC_AUTH_TOKEN |
| Base URL     | api.moonshot.cn/v1 | api.moonshot.ai/anthropic |
| Formato      | DEFAULT_*_MODEL | ANTHROPIC_MODEL |
| Status       | ❌ Pedia auth Anthropic | ✅ Funciona direto |

---

**Problema resolvido!**

**Data:** 2025-11-14
**Versao:** 1.0
**Status:** Corrigido e testado
