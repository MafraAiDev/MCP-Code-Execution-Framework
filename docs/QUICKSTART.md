# 🚀 Guia de Início Rápido - MCP Code Execution Framework

## 📋 Visão Geral

O **MCP Code Execution Framework** é uma solução híbrida JavaScript + Python que permite executar código Python com segurança integrada a MCPs (Model Context Protocols) como Apify e Guardrails AI.

## ⚡ Instalação Rápida (5 minutos)

### 1. Pré-requisitos
```bash
# Node.js >= 18.0.0
node --version

# Python >= 3.9.0
python --version

# npm ou yarn
npm --version
```

### 2. Clone e Instale
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mcp-code-execution-framework.git
cd MCP-Code-Execution-Framework

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
```

### 3. Configure as Credenciais
Edite o arquivo `.env`:
```bash
# Python (obrigatório)
PYTHON_PATH=python3

# Apify (opcional - para web scraping)
APIFY_TOKEN=your_apify_token_here

# Guardrails AI (opcional - para segurança)
GUARDRAILS_API_KEY=your_guardrails_key_here
```

### 4. Teste a Instalação
```bash
# Execute o teste básico
npm run example:basic

# Execute todos os exemplos
npm run example:all
```

## 🎯 Seu Primeiro Código (30 segundos)

### JavaScript
```javascript
import framework from './core/index.js';

// Inicialize o framework
await framework.initialize();

// Execute código Python com MCPs
const result = await framework.execute(`
from servers.scraping.apify import run_actor

# Execute web scraping seguro
result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com'],
    'maxRequestsPerCrawl': 10
})

result
`);

console.log('Resultado:', result);

// Cleanup
await framework.cleanup();
```

### Python (via Framework)
```python
# O framework executa automaticamente código Python
# com segurança integrada e acesso aos MCPs

from servers.scraping.apify import run_actor
from servers.security.guardrails import validate

# Web scraping seguro
data = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com']
})

# Validação de segurança
validation = await validate('user input', {'strict': True})
```

## 🏗️ Estrutura do Projeto

```
MCP-Code-Execution-Framework/
├── core/                    # Núcleo do framework
│   ├── index.js            # Orquestrador principal
│   ├── python-bridge.js    # Comunicação JS ↔ Python
│   └── mcp-interceptor.js  # Sistema de enforcement
├── servers/                # MCPs disponíveis
│   ├── scraping/apify/     # Web scraping
│   └── security/guardrails/ # Segurança AI
├── test/                   # Testes
│   ├── unit/              # Testes unitários
│   └── integration/       # Testes de integração
├── examples/              # Exemplos práticos
└── docs/                  # Documentação completa
```

## 🚀 Exemplos Rápidos

### 1. Web Scraping com Apify
```javascript
const scrapingCode = `
from servers.scraping.apify import run_actor

# Scraping de notícias
result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://news.ycombinator.com/'],
    'maxRequestsPerCrawl': 5,
    'selector': '.titleline > a'
})

result
`;

const scrapedData = await framework.execute(scrapingCode);
console.log('Notícias:', scrapedData.data.items);
```

### 2. Validação de Segurança com Guardrails
```javascript
const securityCode = `
from servers.security.guardrails import validate

# Valida entrada do usuário
validation = await validate(user_input, {
    'check_toxicity': True,
    'check_pii': True,
    'strict': True
})

validation
`;

const userInput = "Hello world! This is a test.";
const validation = await framework.execute(securityCode, { user_input });
console.log('Validação:', validation.valid ? '✅ Seguro' : '❌ Problemático');
```

### 3. Proteção de Dados Pessoais
```javascript
const privacyCode = `
from servers.security.guardrails import scan

# Detecta PII (Informações de Identificação Pessoal)
scan_result = await scan(text_content, 'privacy')

scan_result
`;

const sensitiveText = "Contact John Doe at john@example.com or 555-1234";
const scanResult = await framework.execute(privacyCode, { text_content: sensitiveText });
console.log('PII detectado:', scanResult.issues.length, 'problemas');
```

## ⚙️ Comandos Úteis

```bash
# Iniciar o framework
npm start

# Executar testes
npm test
npm run test:unit
npm run test:integration

# Ver cobertura de testes
npm run test:coverage

# Executar exemplos
npm run example:basic
npm run example:scraping
npm run example:security
npm run example:privacy
npm run example:complete

# Descobrir MCPs disponíveis
npm run discover
```

## 🔧 Configuração Avançada

### Opções do Framework
```javascript
const framework = new MCPCodeExecutionFramework({
  autoEnforce: true,        // Ativa enforcement de MCPs
  pythonPath: 'python3',    // Caminho do Python
  timeout: 30000,          // Timeout em ms
  maxMemory: '512MB',      // Limite de memória
  enableCache: true        // Ativa caching
});
```

### Segurança e Compliance
- ✅ **Progressive Disclosure**: Usuários só acessam MCPs apropriados ao nível
- ✅ **Enforcement Automático**: Impede chamadas diretas perigosas
- ✅ **Validação de Entrada**: Verifica código antes da execução
- ✅ **Tratamento de Erros**: Mensagens educativas e seguras

## 🆘 Solução de Problemas

### Erro Comum: "Python não encontrado"
```bash
# Verifique o caminho do Python
which python3
# Configure no .env
PYTHON_PATH=/usr/bin/python3
```

### Erro: "MCP não encontrado"
```bash
# Instale o MCP necessário
npm install @apify/mcp-server
npm install guardrails-ai
```

### Erro: "Permission denied"
```bash
# Verifique permissões
chmod +x core/python_server.py
```

## 📚 Próximos Passos

1. **[Leia a documentação completa](API.md)** - Todos os métodos e opções
2. **[Veja exemplos avançados](examples/)** - Casos de uso complexos
3. **[Configure produção](TROUBLESHOOTING.md)** - Dicas de deployment
4. **[Contribua com o projeto](../CONTRIBUTING.md)** - Ajude a melhorar!

## 🤝 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/mcp-code-execution-framework/issues)
- **Exemplos**: [examples/](examples/)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**🎉 Pronto! Seu MCP Code Execution Framework está funcionando!**

**Tempo total de instalação: ~5 minutos** ⏱️