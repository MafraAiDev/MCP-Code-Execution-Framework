# 📚 API Reference - MCP Code Execution Framework

## 📋 Visão Geral

Esta documentação descreve todos os métodos, opções e funcionalidades disponíveis no MCP Code Execution Framework.

## 🏗️ Estrutura da API

```
MCPCodeExecutionFramework
├── initialize(options)
├── execute(code, context)
├── importPython(module)
├── evalPython(expression)
├── getStats()
├── generateReport()
└── cleanup()
```

---

## 🔧 Métodos Principais

### `framework.initialize(options)`

Inicializa o framework com as configurações especificadas.

**Parâmetros:**
- `options` (Object, opcional): Configurações do framework

**Opções disponíveis:**
```javascript
{
  autoEnforce: true,        // Ativa enforcement de MCPs (padrão: true)
  pythonPath: 'python3',    // Caminho do Python (padrão: 'python')
  timeout: 30000,          // Timeout em ms (padrão: 30000)
  maxMemory: '512MB',      // Limite de memória (padrão: '512MB')
  enableCache: true,       // Ativa caching (padrão: true)
  enableProgressiveDisclosure: true, // Ativa Progressive Disclosure (padrão: true)
  logLevel: 'info'         // Nível de log (padrão: 'info')
}
```

**Retorno:**
```javascript
{
  success: true,
  message: 'Framework initialized successfully',
  pythonVersion: '3.9.7',
  mcpCount: 4,
  enforcementActive: true
}
```

**Exemplo:**
```javascript
await framework.initialize({
  autoEnforce: true,
  pythonPath: '/usr/bin/python3',
  timeout: 60000
});
```

---

### `framework.execute(code, context)`

Executa código Python com segurança integrada.

**Parâmetros:**
- `code` (String): Código Python a ser executado
- `context` (Object, opcional): Variáveis e funções disponíveis no código

**Retorno:**
Retorna o resultado da execução Python (tipo varia conforme o código).

**Exemplos:**

```javascript
// Execução simples
const result = await framework.execute('2 + 2');
console.log(result); // 4

// Com variáveis de contexto
const context = { name: 'World', multiplier: 3 };
const result = await framework.execute(`
message = f"Hello, {name}!"
result = len(message) * multiplier
result
`, context);
console.log(result); // 45

// Com MCPs
const scrapingResult = await framework.execute(`
from servers.scraping.apify import run_actor

result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com'],
    'maxRequestsPerCrawl': 10
})
result
`);
```

---

### `framework.importPython(module)`

Importa um módulo Python e retorna suas funções/classes.

**Parâmetros:**
- `module` (String): Nome do módulo Python

**Retorno:**
Objeto com as funções/classes do módulo.

**Exemplo:**
```javascript
const math = await framework.importPython('math');
console.log(math.pi); // 3.141592653589793
console.log(math.sqrt(16)); // 4.0

const servers = await framework.importPython('servers');
const categories = servers.list_categories();
console.log(categories); // ['scraping', 'security', 'privacy']
```

---

### `framework.evalPython(expression)`

Avalia uma expressão Python simples.

**Parâmetros:**
- `expression` (String): Expressão Python

**Retorno:**
Resultado da expressão.

**Exemplo:**
```javascript
const result1 = await framework.evalPython('2 ** 8');
console.log(result1); // 256

const result2 = await framework.evalPython('[x**2 for x in range(5)]');
console.log(result2); // [0, 1, 4, 9, 16]
```

---

### `framework.getStats()`

Obtém estatísticas de uso do framework.

**Retorno:**
```javascript
{
  executions: 42,           // Número de execuções
  tokensUsed: 1500,         // Tokens utilizados
  tokensSaved: 300,         // Tokens economizados via cache
  mcpsLoaded: ['apify', 'guardrails'], // MCPs carregados
  pythonVersion: '3.9.7',   // Versão do Python
  uptime: 3600,            // Tempo online em segundos
  cacheHitRate: 0.75,      // Taxa de acerto do cache
  averageExecutionTime: 45.2 // Tempo médio de execução em ms
}
```

---

### `framework.generateReport()`

Gera um relatório detalhado de uso.

**Retorno:**
String formatada com estatísticas e informações.

**Exemplo:**
```javascript
const report = framework.generateReport();
console.log(report);
/*
MCP Code Execution Framework - Execution Report
===============================================
Total Executions: 42
Tokens Used: 1,500
Tokens Saved: 300 (20%)
MCPs Loaded: apify, guardrails
Python Version: 3.9.7
Uptime: 1h 0m 0s
Cache Hit Rate: 75%
Average Execution Time: 45.2ms
Status: Active
*/
```

---

### `framework.cleanup()`

Limpa recursos e finaliza o framework.

**Retorno:**
```javascript
{
  success: true,
  message: 'Framework cleaned up successfully',
  pythonProcessTerminated: true,
  resourcesFreed: ['memory', 'file_handles', 'network_connections']
}
```

---

## 🔐 Sistema de Enforcement

### Progressive Disclosure

O framework implementa um sistema de níveis que controla o acesso aos MCPs:

```javascript
// Níveis disponíveis
const levels = {
  beginner: ['security'],
  intermediate: ['security', 'scraping'],
  advanced: ['security', 'scraping', 'privacy']
};

// Configure o nível do usuário
await framework.initialize({
  userLevel: 'intermediate'
});
```

### Enforcement Automático

Quando `autoEnforce: true`, o framework:
- Intercepta chamadas diretas a MCPs
- Redireciona para `framework.execute()`
- Fornece mensagens educativas
- Mantém log de tentativas

---

## 🛡️ Segurança e Validação

### Validação de Código

O framework valida automaticamente:
- Sintaxe Python
- Importações permitidas
- Padrões perigosos (eval, exec, etc.)
- Tamanho do código

### Proteção de Dados

```javascript
// Detecção automática de PII
const result = await framework.execute(`
from servers.security.guardrails import scan

result = await scan(user_text, 'privacy')
result
`, { user_text: sensitive_data });
```

### Rate Limiting

```javascript
// Configure limites
await framework.initialize({
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false
  }
});
```

---

## 📊 MCPs Disponíveis

### Apify (Web Scraping)

```javascript
const apifyCode = `
from servers.scraping.apify import run_actor, get_dataset

# Executar actor
actor_result = await run_actor('apify/web-scraper', {
    'startUrls': ['https://example.com'],
    'maxRequestsPerCrawl': 100,
    'selector': '.content'
})

# Obter dataset
dataset = await get_dataset(actor_result['datasetId'])
dataset
`;
```

### Guardrails AI (Segurança)

```javascript
const guardrailsCode = `
from servers.security.guardrails import validate, scan

# Validar texto
validation = await validate(user_input, {
    'check_toxicity': True,
    'check_pii': True,
    'strict': True
})

# Scan de segurança
security_scan = await scan(code_content, 'security')

{'validation': validation, 'scan': security_scan}
`;
```

---

## ⚙️ Configuração Avançada

### Opções de Performance

```javascript
await framework.initialize({
  // Cache
  enableCache: true,
  cacheSize: 1000,
  cacheTTL: 3600000, // 1 hora

  // Performance
  maxWorkers: 4,
  workerTimeout: 30000,
  memoryLimit: '1GB',

  // Logging
  logLevel: 'debug', // debug, info, warn, error
  logFile: 'mcp-framework.log',

  // Segurança
  enableSandbox: true,
  allowedModules: ['math', 'json', 'datetime', 'servers'],
  blockedModules: ['os', 'subprocess', 'socket']
});
```

### Eventos e Callbacks

```javascript
// Eventos de execução
framework.on('execution:start', (data) => {
  console.log('Executando:', data.codeId);
});

framework.on('execution:complete', (data) => {
  console.log('Completo:', data.duration, 'ms');
});

framework.on('mcp:intercepted', (data) => {
  console.log('MCP interceptado:', data.mcpName);
});

framework.on('error', (error) => {
  console.error('Erro:', error.message);
});
```

---

## 🚨 Tratamento de Erros

### Erros Comuns

```javascript
try {
  const result = await framework.execute('código problemático');
} catch (error) {
  switch (error.code) {
    case 'PYTHON_ERROR':
      console.error('Erro Python:', error.message);
      break;
    case 'MCP_NOT_FOUND':
      console.error('MCP não encontrado:', error.mcpName);
      break;
    case 'ENFORCEMENT_VIOLATION':
      console.error('Violação de enforcement:', error.message);
      console.log('Use:', error.suggestedUsage);
      break;
    case 'TIMEOUT':
      console.error('Timeout:', error.timeoutMs);
      break;
    case 'MEMORY_LIMIT':
      console.error('Limite de memória:', error.limit);
      break;
    default:
      console.error('Erro desconhecido:', error);
  }
}
```

### Códigos de Erro

| Código | Descrição | Solução |
|--------|-----------|---------|
| `PYTHON_ERROR` | Erro no código Python | Verifique sintaxe e imports |
| `MCP_NOT_FOUND` | MCP não disponível | Instale o MCP necessário |
| `ENFORCEMENT_VIOLATION` | Chamada direta bloqueada | Use `framework.execute()` |
| `TIMEOUT` | Execução excedeu tempo limite | Aumente timeout ou otimize código |
| `MEMORY_LIMIT` | Limite de memória excedido | Reduza uso de memória |
| `AUTH_FAILED` | Falha na autenticação | Configure credenciais |
| `RATE_LIMITED` | Muitas requisições | Aguarde e tente novamente |

---

## 📈 Performance e Otimização

### Métricas de Performance

```javascript
// Monitore performance
const stats = framework.getStats();
console.log(`
Performance Metrics:
- Average Execution Time: ${stats.averageExecutionTime}ms
- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%
- Memory Usage: ${stats.memoryUsage}MB
- Active Workers: ${stats.activeWorkers}
`);
```

### Otimizações Recomendadas

1. **Use cache quando possível**
```javascript
const result = await framework.execute(code, context, { useCache: true });
```

2. **Batch operations**
```javascript
const results = await Promise.all([
  framework.execute(code1),
  framework.execute(code2),
  framework.execute(code3)
]);
```

3. **Pré-compilação**
```javascript
const compiled = await framework.compile(code);
const result = await compiled.execute(context);
```

---

## 🔌 Extensibilidade

### Criando MCPs Customizados

```python
# servers/custom/meu_mcp.py
async def minha_funcao(parametros):
    """
    Minha função customizada

    Args:
        parametros: Dict com parâmetros

    Returns:
        Dict com resultado
    """
    return {
        'success': True,
        'data': f'Processado: {parametros}',
        'timestamp': datetime.now().isoformat()
    }
```

### Registrando MCPs

```javascript
await framework.registerMCP('custom', {
  name: 'meu_mcp',
  functions: ['minha_funcao'],
  category: 'custom',
  level: 'intermediate'
});
```

---

## 📚 Referências Cruzadas

- [QUICKSTART.md](QUICKSTART.md) - Guia rápido de instalação
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solução de problemas
- [examples/](examples/) - Exemplos práticos
- [test/unit/](test/unit/) - Testes unitários
- [test/integration/](test/integration/) - Testes de integração

---

**📖 Documentação gerada automaticamente**
**Última atualização**: 2025-11-14
**Versão**: 2.0.0