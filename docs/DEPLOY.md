# 🚀 Guia de Deploy em Produção

## MCP Code Execution Framework v2.0

Este guia detalha o processo completo de deploy do framework em produção usando Vercel e GitHub Actions.

---

## 📋 Pré-requisitos

### 1. Contas Necessárias
- ✅ **GitHub Account** (para repositório e CI/CD)
- ✅ **Vercel Account** (para deploy serverless)
- 🔒 **Snyk Account** (opcional - para security scanning)

### 2. Ferramentas Locais
```bash
node --version  # >= 18.0.0
python --version  # >= 3.9.0
npm --version
git --version
```

### 3. Instalar Vercel CLI
```bash
npm install -g vercel@latest
vercel login
```

---

## 🔧 Configuração Inicial

### Passo 1: Preparar Repositório Git

Se o projeto ainda não está em um repositório Git:

```bash
git init
git add .
git commit -m "Initial commit - MCP Framework v2.0"
```

Criar repositório no GitHub e conectar:

```bash
git remote add origin https://github.com/seu-usuario/mcp-code-execution-framework.git
git branch -M main
git push -u origin main
```

### Passo 2: Configurar Secrets no GitHub

Acesse: `Settings > Secrets and variables > Actions`

Adicione os seguintes secrets:

#### Obrigatórios:
```
VERCEL_TOKEN          # Token de API do Vercel
VERCEL_ORG_ID         # ID da organização Vercel
VERCEL_PROJECT_ID     # ID do projeto Vercel
```

#### Opcionais:
```
SNYK_TOKEN            # Token Snyk para security scanning
APIFY_TOKEN           # Token Apify (se usar web scraping)
GUARDRAILS_API_KEY    # Guardrails AI (se usar validação)
```

**Como obter os tokens Vercel:**

```bash
# 1. Login
vercel login

# 2. Link ao projeto (na raiz do projeto)
vercel link

# 3. Os IDs serão salvos em .vercel/project.json
cat .vercel/project.json
```

### Passo 3: Configurar Variáveis de Ambiente no Vercel

Acesse: [Vercel Dashboard](https://vercel.com/dashboard) > Seu Projeto > Settings > Environment Variables

Adicione:

| Variable | Value | Environment |
|----------|-------|-------------|
| `PYTHON_PATH` | `python3` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `APIFY_TOKEN` | `seu-token` | Production (opcional) |
| `GUARDRAILS_API_KEY` | `seu-token` | Production (opcional) |

---

## 🚀 Deploy Manual (Primeira vez)

### Opção 1: Via Vercel CLI

```bash
# 1. Build local (validação)
npm run build
npm test

# 2. Deploy preview
vercel

# 3. Deploy produção
vercel --prod
```

### Opção 2: Via Vercel Dashboard

1. Acesse [Vercel Dashboard](https://vercel.com/new)
2. Clique em "Import Project"
3. Conecte ao repositório GitHub
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: (deixe vazio)
   - **Install Command**: `npm install`
5. Adicione variáveis de ambiente
6. Clique em "Deploy"

---

## ⚙️ CI/CD Automático

Após configuração dos secrets, o CI/CD funcionará automaticamente:

### Triggers:

**Push para `main`**:
- ✅ Executa testes (matriz: Node 18.x/20.x, Python 3.9/3.10/3.11)
- ✅ Executa linter
- ✅ Executa security scan
- ✅ Deploy automático para produção (se testes passarem)

**Pull Request para `main`**:
- ✅ Executa testes
- ✅ Executa linter
- ✅ Executa security scan
- ❌ NÃO faz deploy

**Push para `develop`**:
- ✅ Executa testes
- ❌ NÃO faz deploy

### Monitorar Pipeline:

```
GitHub > Actions tab
```

Você verá 3 jobs rodando em paralelo:
1. **Test** - Testes com matriz de versões
2. **Deploy** - Deploy para Vercel
3. **Security** - Scan de vulnerabilidades

---

## 🧪 Validação Pós-Deploy

### 1. Verificar Deploy no Vercel

```bash
# Obter URL do deploy
vercel ls

# Testar endpoint
curl https://seu-projeto.vercel.app/api/health
```

### 2. Executar Testes de Integração

```bash
# Testes contra ambiente de produção
VERCEL_URL=https://seu-projeto.vercel.app npm run test:integration
```

### 3. Verificar Logs

```bash
# Via CLI
vercel logs seu-projeto

# Via Dashboard
https://vercel.com/seu-usuario/seu-projeto/deployments
```

---

## 📊 Monitoramento em Produção

### Métricas do Vercel

Acesse: Dashboard > Analytics

Monitore:
- **Requests/min**
- **Response time** (p50, p95, p99)
- **Error rate**
- **Cache hit ratio**

### Logs de Erro

```bash
# Tail logs em tempo real
vercel logs --follow

# Logs das últimas 24h
vercel logs --since 24h
```

### Alertas (Opcional)

Configure webhooks no Vercel:
```
Settings > Git > Deploy Hooks
```

---

## 🔒 Segurança em Produção

### 1. Secrets Management

**NUNCA commite:**
- ❌ `.env` files
- ❌ API tokens
- ❌ Credentials

**SEMPRE use:**
- ✅ GitHub Secrets (para CI/CD)
- ✅ Vercel Environment Variables (para runtime)

### 2. CORS Configuration

Já configurado em `vercel.json`:

```json
{
  "headers": [{
    "source": "/api/(.*)",
    "headers": [
      {"key": "Access-Control-Allow-Origin", "value": "*"}
    ]
  }]
}
```

**Para produção, restrinja origens:**

```json
{"key": "Access-Control-Allow-Origin", "value": "https://seu-dominio.com"}
```

### 3. Rate Limiting

Adicione rate limiting no código:

```javascript
// Em api/execute.js
const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < 60000);

  if (recentRequests.length >= 100) {
    throw new Error('Rate limit exceeded');
  }

  rateLimit.set(ip, [...recentRequests, now]);
}
```

---

## 🔄 Rollback

Se algo der errado após deploy:

### Via Vercel Dashboard:

1. Acesse: Deployments
2. Encontre o último deploy estável
3. Clique nos 3 pontos → "Promote to Production"

### Via CLI:

```bash
# Listar deployments
vercel ls

# Promover deployment específico
vercel promote <deployment-url>
```

---

## 📈 Otimizações de Produção

### 1. Cold Start Reduction

```javascript
// core/index.js - Lazy loading
let _pythonBridge = null;

function getPythonBridge() {
  if (!_pythonBridge) {
    _pythonBridge = new PythonBridge();
  }
  return _pythonBridge;
}
```

### 2. Caching Strategy

```javascript
// vercel.json
{
  "headers": [{
    "source": "/api/static/(.*)",
    "headers": [
      {"key": "Cache-Control", "value": "public, max-age=3600"}
    ]
  }]
}
```

### 3. Bundle Size

```bash
# Analisar dependências
npm ls --depth=0

# Remover dependências não usadas
npm prune --production
```

---

## 🐛 Troubleshooting

### Problema: Deploy falha com "Module not found"

**Solução:**
```bash
# Verificar package.json
npm install --save <missing-module>
git commit -am "Add missing dependency"
git push
```

### Problema: Testes passam local mas falham no CI

**Solução:**
```bash
# Executar testes com mesmas condições do CI
NODE_ENV=production npm test

# Verificar versão Node
node --version  # Deve ser >= 18.0.0
```

### Problema: Python não encontrado no Vercel

**Solução:**
- Python 3.9 está disponível em `/usr/bin/python3`
- Definir `PYTHON_PATH=python3` nas env vars

### Problema: Timeout em execuções Python

**Solução:**
```javascript
// Aumentar timeout em vercel.json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60  // 60 segundos
    }
  }
}
```

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Framework Documentation](./QUICKSTART.md)
- [API Reference](./docs/API.md)

---

## ✅ Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Todos os testes passando localmente
- [ ] Linter sem erros (`npm run lint`)
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets do GitHub configurados
- [ ] `.gitignore` atualizado (não commitar `.env`)
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs e monitoramento configurados
- [ ] Plano de rollback definido
- [ ] Documentação atualizada

---

## 🎉 Deploy Bem-sucedido!

Após seguir todos os passos:

```bash
✅ CI/CD Pipeline: ATIVO
✅ Deploy Automático: CONFIGURADO
✅ Produção: LIVE em https://seu-projeto.vercel.app
✅ Monitoramento: ATIVO
✅ Security: VALIDADO
```

**Próximos passos:**
1. Monitore métricas nos primeiros dias
2. Configure alertas para erros críticos
3. Documente quaisquer issues específicos do ambiente
4. Planeje releases futuras

---

**Última atualização**: 2025-11-15
**Framework Version**: 2.0.0
**Deploy Platform**: Vercel + GitHub Actions
