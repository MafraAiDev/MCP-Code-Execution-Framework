# 🚀 USO RÁPIDO - MCP Framework

**5 minutos para começar**

---

## ✅ Instalação

```bash
npm install
```

---

## 🎯 Uso Básico

```javascript
import framework from './core/index.js';

// 1. Inicializa
await framework.initialize();

// 2. Executa código Python
const result = await framework.execute(`
from servers import list_categories
__result__ = list_categories()
`);

console.log(result);
// ['security', 'scraping', 'dev', 'workflows', 'utils', 'integrations', 'infrastructure']
```

---

## 📋 Exemplos

### Executar código simples
```javascript
const result = await framework.execute(`
__result__ = 2 + 2
`);
// result = 4
```

### Importar MCP
```javascript
const result = await framework.execute(`
from servers.scraping.apify import run_actor
__result__ = await run_actor('web-scraper', {'maxPages': 10})
`);
```

### Ver estatísticas
```javascript
const stats = framework.getStats();
console.log(stats.executions); // Número de execuções
```

### Relatório completo
```javascript
console.log(framework.generateReport());
```

---

## 🧪 Testar

```bash
node test-basico.js
```

---

## 📚 Documentação Completa

- `DECISOES-ARQUITETURAIS.md` - Arquitetura
- `STATUS-PROJETO.md` - Status atual
- `LEITURA-OBRIGATORIA.md` - Regras de uso
- `LEMBRETE-48H.md` - Melhorias pendentes

---

## ⚡ Features

✅ Execução Python + JavaScript
✅ Progressive Disclosure (18 MCPs)
✅ Enforcement automático
✅ 98.7% economia de tokens (futuro)
✅ Proteção PII (futuro)

---

**Pronto para usar!** 🎉
