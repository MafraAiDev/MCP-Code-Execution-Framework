# 🔧 Troubleshooting - MCP Code Execution Framework

## 📋 Índice de Problemas

1. [Erros de Instalação](#erros-de-instalação)
2. [Erros de Python](#erros-de-python)
3. [Erros de MCP](#erros-de-mcp)
4. [Erros de Execução](#erros-de-execucao)
5. [Erros de Segurança](#erros-de-seguranca)
6. [Problemas de Performance](#problemas-de-performance)
7. [Erros de Integração](#erros-de-integracao)
8. [Problemas Específicos por Sistema Operacional](#problemas-por-sistema)

---

## 🔧 Erros de Instalação

### ❌ "Python não encontrado"

**Erro:**
```
Error: Python process not found
```

**Causas:**
- Python não está instalado
- Python não está no PATH
- Caminho incorreto no .env

**Soluções:**

1. **Verifique se Python está instalado:**
```bash
# Linux/Mac
python3 --version

# Windows
python --version
py --version
```

2. **Configure o caminho correto no .env:**
```bash
# Linux/Mac
PYTHON_PATH=/usr/bin/python3

# Windows
PYTHON_PATH=C:\\Python39\\python.exe

# Usando py launcher (Windows)
PYTHON_PATH=py
```

3. **Instale Python se necessário:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# macOS
brew install python

# Windows
# Baixe em: https://www.python.org/downloads/
```

### ❌ "Node.js versão incompatível"

**Erro:**
```
Error: Node.js version must be >= 18.0.0
```

**Solução:**
```bash
# Verifique a versão atual
node --version

# Instale versão compatível
# Via nvm (recomendado)
nvm install 18
nvm use 18

# Via package manager
# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### ❌ "Dependências não encontradas"

**Erro:**
```
npm ERR! Cannot find module 'python-shell'
```

**Solução:**
```bash
# Limpe cache e reinstale
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Se persistir, instale manualmente
npm install python-shell@^5.0.0
npm install @jest/globals@^30.0.0
```

---

## 🐍 Erros de Python

### ❌ "ModuleNotFoundError: No module named 'servers'"

**Erro:**
```python
ModuleNotFoundError: No module named 'servers'
```

**Causas:**
- PYTHONPATH incorreto
- Módulo servers não está no path

**Soluções:**

1. **Verifique a estrutura:**
```bash
ls -la servers/
# Deve mostrar: scraping/ security/ __init__.py
```

2. **Configure PYTHONPATH:**
```bash
# No .env
PYTHONPATH=/caminho/para/MCP-Code-Execution-Framework

# Ou no código
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

3. **Verifique __init__.py:**
```bash
# Deve existir em:
# servers/__init__.py
# servers/scraping/__init__.py
# servers/security/__init__.py
```

### ❌ "SyntaxError: invalid syntax"

**Erro:**
```python
SyntaxError: invalid syntax
```

**Causas comuns:**
- Código Python com sintaxe inválida
- Uso de recursos não suportados
- Problemas de indentação

**Solução:**
```javascript
// ❌ Código problemático
const badCode = `
def func(
    print("test")
`;

// ✅ Código correto
const goodCode = `
def func():
    print("test")
    return True
`;

const result = await framework.execute(goodCode);
```

### ❌ "IndentationError: unexpected indent"

**Solução:**
```javascript
// Use template strings com cuidado
const code = `
def minha_funcao():
    # 4 espaços para indentação
    if True:
        return "OK"  # 8 espaços
    return None
`;
```

---

## 🔌 Erros de MCP

### ❌ "MCP not found: apify"

**Erro:**
```
Error: MCP 'apify' not found or not available
```

**Causas:**
- MCP não instalado
- Credenciais não configuradas
- Nível de usuário inadequado

**Soluções:**

1. **Instale o MCP:**
```bash
# Apify
npm install @apify/mcp-server

# Guardrails
pip install guardrails-ai
```

2. **Configure credenciais:**
```bash
# .env
APIFY_TOKEN=your_token_here
GUARDRAILS_API_KEY=your_key_here
```

3. **Verifique nível do usuário:**
```javascript
const userLevel = 'beginner'; // só pode usar 'security'
const userLevel = 'intermediate'; // pode usar 'security', 'scraping'
const userLevel = 'advanced'; // pode usar todos
```

### ❌ "Authentication failed"

**Erro:**
```
Error: Authentication failed for MCP 'apify'
```

**Soluções:**

1. **Verifique o token:**
```bash
# Teste o token manualmente
curl -H "Authorization: Bearer $APIFY_TOKEN" \
  https://api.apify.com/v2/acts
```

2. **Renove o token:**
```bash
# Apify Console > Settings > API tokens
generate_new_token()
```

3. **Verifique limites:**
```bash
# Veja uso da API
curl -H "Authorization: Bearer $APIFY_TOKEN" \
  https://api.apify.com/v2/users/me/usage
```

### ❌ "Rate limit exceeded"

**Erro:**
```
Error: Rate limit exceeded. Maximum 100 requests per hour
```

**Soluções:**

1. **Implemente backoff exponencial:**
```javascript
async function executeWithRetry(code, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await framework.execute(code);
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

2. **Reduza frequência:**
```javascript
// ❌ Muitas chamadas rápidas
for (let i = 0; i < 1000; i++) {
  await framework.execute(code);
}

// ✅ Batch processing
const batchSize = 10;
for (let i = 0; i < 1000; i += batchSize) {
  const batch = Array(batchSize).fill(code);
  await Promise.all(batch.map(c => framework.execute(c)));
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

## ⚙️ Erros de Execução

### ❌ "Execution timeout"

**Erro:**
```
Error: Execution timeout after 30000ms
```

**Soluções:**

1. **Aumente o timeout:**
```javascript
await framework.initialize({
  timeout: 60000 // 60 segundos
});
```

2. **Otimize o código:**
```javascript
// ❌ Código lento
const slowCode = `
result = []
for i in range(1000000):
    result.append(i**2)
`;

// ✅ Código otimizado
const fastCode = `
result = [i**2 for i in range(1000000)]
`;
```

3. **Use async/await corretamente:**
```javascript
// ❌ Travando o event loop
const badCode = `
import time
time.sleep(10)  # Bloqueia!
`;

// ✅ Async correto
const goodCode = `
import asyncio
await asyncio.sleep(10)  # Não bloqueia
`;
```

### ❌ "Memory limit exceeded"

**Erro:**
```
Error: Memory usage exceeded limit of 512MB
```

**Soluções:**

1. **Aumente limite de memória:**
```javascript
await framework.initialize({
  maxMemory: '1GB'
});
```

2. **Libere memória explicitamente:**
```javascript
const code = `
# Processa em chunks
chunk_size = 1000
for i in range(0, len(data), chunk_size):
    chunk = data[i:i+chunk_size]
    process_chunk(chunk)
    # Libera memória
    del chunk
    gc.collect()
`;
```

3. **Use geradores:**
```javascript
const code = `
def process_large_dataset():
    for item in huge_dataset:
        yield process_item(item)

# Processa item por item
for result in process_large_dataset():
    save_result(result)
`;
```

### ❌ "Enforcement violation"

**Erro:**
```
Error: Enforcement violation: Direct MCP call detected
```

**Solução:**
```javascript
// ❌ Chamada direta (bloqueada)
apify.run_actor('test');

// ✅ Uso correto via framework
const code = `
from servers.scraping.apify import run_actor
result = await run_actor('test')
`;
const result = await framework.execute(code);
```

---

## 🔒 Erros de Segurança

### ❌ "Dangerous code detected"

**Erro:**
```
Error: Dangerous pattern detected: eval\s*\(
```

**Causas:**
- Uso de `eval()`, `exec()`
- Importações perigosas
- Código potencialmente malicioso

**Soluções:**

1. **Use alternativas seguras:**
```javascript
// ❌ Perigoso
const dangerous = `
user_code = input("Enter code: ")
eval(user_code)
`;

// ✅ Seguro
const safe = `
# Use funções específicas em vez de eval
def safe_operation(x, y, op):
    operations = {
        'add': x + y,
        'sub': x - y,
        'mul': x * y
    }
    return operations.get(op, None)
`;
```

2. **Valide entrada do usuário:**
```javascript
function validateUserCode(code) {
  const dangerous = ['eval', 'exec', '__import__', 'os', 'subprocess'];
  for (const pattern of dangerous) {
    if (code.includes(pattern)) {
      throw new Error('Código perigoso detectado');
    }
  }
  return true;
}
```

### ❌ "PII detected in output"

**Erro:**
```
Warning: PII detected in execution output
```

**Soluções:**

1. **Use proteção de PII:**
```javascript
const code = `
from servers.security.guardrails import scan

# Detecta PII antes de processar
text = user_input
scan_result = await scan(text, 'privacy')

if scan_result['issues']:
    # Remove ou mascara PII
    cleaned_text = mask_pii(text, scan_result['issues'])
    result = process_text(cleaned_text)
else:
    result = process_text(text)
`;
```

2. **Configure níveis de sensibilidade:**
```javascript
await framework.initialize({
  privacy: {
    piiDetection: true,
    maskEmail: true,
    maskPhone: true,
    maskSSN: true,
    blockIfDetected: false  // Apenas avisa
  }
});
```

---

## ⚡ Problemas de Performance

### ❌ "High memory usage"

**Diagnóstico:**
```javascript
const stats = framework.getStats();
if (stats.memoryUsage > 400) { // 400MB
  console.warn('Memory usage high:', stats.memoryUsage);
}
```

**Soluções:**

1. **Monitore uso de memória:**
```javascript
setInterval(() => {
  const stats = framework.getStats();
  if (stats.memoryUsage > config.memoryLimit * 0.8) {
    // Libera cache
    framework.clearCache();
    // Força garbage collection
    framework.execute('import gc; gc.collect()');
  }
}, 30000); // Verifica a cada 30s
```

2. **Otimize processamento de grandes datasets:**
```javascript
const optimizedCode = `
# Processa em batches
batch_size = 100
results = []

for i in range(0, len(dataset), batch_size):
    batch = dataset[i:i+batch_size]
    batch_results = process_batch(batch)
    results.extend(batch_results)

    # Libera memória a cada batch
    del batch
    del batch_results
    gc.collect()

results
`;
```

### ❌ "Slow execution times"

**Diagnóstico:**
```javascript
const start = performance.now();
const result = await framework.execute(code);
const duration = performance.now() - start;

if (duration > 5000) { // 5 segundos
  console.warn('Slow execution:', duration, 'ms');
}
```

**Soluções:**

1. **Profile o código:**
```javascript
const profilingCode = `
import cProfile
import pstats
import io

# Profile a execução
pr = cProfile.Profile()
pr.enable()

# Seu código aqui
result = expensive_operation()

pr.disable()
s = io.StringIO()
ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
ps.print_stats()

{'result': result, 'profile': s.getvalue()}
`;
```

2. **Use cache eficientemente:**
```javascript
// Configure cache inteligente
await framework.initialize({
  cache: {
    enabled: true,
    size: 1000,
    ttl: 1800000, // 30 minutos
    keyGenerator: (code, context) => {
      // Gera chave baseada em hash do código
      return crypto.createHash('md5')
        .update(code + JSON.stringify(context))
        .digest('hex');
    }
  }
});
```

---

## 🔗 Erros de Integração

### ❌ "Callback not found"

**Erro:**
```
Error: JS callback 'process_data' not found
```

**Solução:**
```javascript
// Registre o callback antes de usar
framework.registerCallback('process_data', (data) => {
  return processDataInJS(data);
});

// Agora use no Python
const code = `
result = js_callback('process_data', python_data)
`;
```

### ❌ "Data serialization failed"

**Erro:**
```
Error: Cannot serialize circular reference
```

**Soluções:**

1. **Remova referências circulares:**
```javascript
function removeCircularReferences(obj) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  }));
}
```

2. **Use formatos seguros:**
```javascript
const safeData = {
  // Apenas dados primitivos
  strings: obj.strings,
  numbers: obj.numbers,
  booleans: obj.booleans,
  arrays: obj.arrays.map(item => ({ ...item })), // Shallow copy
  // Evite objetos complexos
  // functions: obj.functions, // ❌ Não serializável
  // dom: obj.dom,            // ❌ Não serializável
};
```

---

## 💻 Problemas por Sistema Operacional

### 🐧 Linux/Ubuntu

#### ❌ "Permission denied"
```bash
# Dê permissões corretas
chmod +x core/python_server.py
chmod 755 -R servers/

# Se usar virtualenv
source venv/bin/activate
pip install -r requirements.txt
```

#### ❌ "Unable to find python3"
```bash
# Instale Python 3
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Crie link simbólico se necessário
sudo ln -s /usr/bin/python3 /usr/local/bin/python
```

### 🍎 macOS

#### ❌ "Library not loaded"
```bash
# Reinstale Python via Homebrew
brew reinstall python

# Atualize paths
export PATH="/usr/local/bin:$PATH"
```

#### ❌ "SSL certificate verify failed"
```bash
# Instale certificados
brew install ca-certificates

# Configure
export SSL_CERT_FILE=/usr/local/etc/openssl/cert.pem
export SSL_CERT_DIR=/usr/local/etc/openssl/certs
```

### 🪟 Windows

#### ❌ "Python path not found"
```powershell
# Encontre Python
py --list-paths

# Configure no .env
PYTHON_PATH=C:\\Users\\Username\\AppData\\Local\\Programs\\Python\\Python39\\python.exe
```

#### ❌ "Access denied"
```powershell
# Execute como administrador
# Ou configure permissões
icacls "C:\\path\\to\\project" /grant Users:F /T
```

#### ❌ "npm ERR! EPERM"
```powershell
# Limpe cache como admin
npm cache clean --force

# Delete node_modules
rmdir /s /q node_modules

# Reinstale
npm install
```

---

## 🆘 Contato e Suporte

### Recursos Adicionais
- [Documentação Completa](API.md)
- [Exemplos Práticos](examples/)
- [Testes de Referência](test/)
- [Reportar Bug](https://github.com/seu-usuario/mcp-code-execution-framework/issues)

### Informações do Sistema
Para reportar problemas, inclua:

```javascript
// Execute este código e inclua o resultado
const debugInfo = {
  framework: framework.getStats(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  memory: process.memoryUsage(),
  env: {
    PYTHON_PATH: process.env.PYTHON_PATH,
    NODE_ENV: process.env.NODE_ENV
  }
};

console.log(JSON.stringify(debugInfo, null, 2));
```

### Comunidade
- **GitHub Issues**: Para bugs e features
- **GitHub Discussions**: Para dúvidas técnicas
- **Stack Overflow**: Tag `mcp-framework`

---

**🎯 Dica Final**: Se nada funcionar, tente a solução universal:

1. **Reinicie o computador** 💻
2. **Reinstale tudo** 🔧
3. **Leia os logs com atenção** 📖
4. **Peça ajuda na comunidade** 🙋‍♂️

**Boa sorte!** 🍀

---

*Última atualização: 2025-11-14*
*Versão: 2.0.0*