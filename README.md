# 🚀 MCP Code Execution Framework

Um framework híbrido JavaScript + Python para execução eficiente de código com integração de MCPs (Model Context Protocols) como Apify e Guardrails AI.

## 📋 Visão Geral

Este framework permite executar código Python de forma segura e controlada dentro de aplicações JavaScript/Node.js, com suporte integrado para:

- **Web Scraping** via Apify
- **Validação de Segurança** via Guardrails AI
- **Proteção de Dados Pessoais** com conformidade GDPR/LGPD
- **Progressive Disclosure** baseado em níveis de usuário
- **Sistema de Enforcement** automático

## 🎯 Características Principais

- ✅ **Execução Segura**: Ambiente isolado para execução de código Python
- ✅ **MCPs Integrados**: Apify para scraping, Guardrails para segurança
- ✅ **Progressive Disclosure**: Acesso baseado em níveis (beginner/intermediate/advanced)
- ✅ **Enforcement Automático**: Previne execução de código não autorizado
- ✅ **Gestão de Erros**: Tratamento robusto com códigos específicos
- ✅ **Performance Otimizada**: Cache, timeouts e limites configuráveis
- ✅ **Enterprise Ready**: Suporte para workflows empresariais completos

## 🚀 Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mcp-code-execution-framework.git
cd mcp-code-execution-framework

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves de API

# Execute o exemplo Hello World
npm run example:hello
```

## 📚 Documentação

- **[Quickstart Guide](QUICKSTART.md)** - Comece em 5 minutos
- **[API Reference](API.md)** - Documentação completa da API
- **[Troubleshooting](TROUBLESHOOTING.md)** - Solução de problemas comuns
- **[Examples](examples/)** - Exemplos práticos e casos de uso

## 💡 Exemplos Rápidos

### Hello World
```javascript
import framework from './core/index.js';

await framework.initialize();
const result = await framework.execute('2 + 2');
console.log(result); // 4
await framework.cleanup();
```

### Web Scraping com Apify
```javascript
const scrapingCode = `
from servers.scraping.apify import run_actor
result = await run_actor('apify/web-scraper', {
    'startUrls': [{'url': 'https://news.ycombinator.com/'}],
    'maxRequestsPerCrawl': 10
})
`;
const result = await framework.execute(scrapingCode);
```

### Validação de Segurança
```javascript
const securityCode = `
from servers.security.guardrails import validate
result = await validate("Hello world!", {'strict': true})
`;
const validation = await framework.execute(securityCode);
```

## 🏃‍♂️ Scripts Disponíveis

```bash
# Executar exemplos individuais
npm run example:hello        # Exemplo básico
npm run example:scraping     # Web scraping
npm run example:security     # Validação de segurança
npm run example:privacy      # Proteção de dados
npm run example:workflow     # Workflow completo

# Executar todos os exemplos
npm run example:all

# Testes
npm test                     # Todos os testes
npm run test:unit           # Testes unitários
npm run test:integration    # Testes de integração
npm run test:coverage       # Cobertura de testes

# Documentação
npm run docs:serve          # Servir documentação local
npm run docs:open           # Abrir documentação no navegador
```

## 🏗️ Estrutura do Projeto

```
mcp-code-execution-framework/
├── core/                   # Core do framework
│   ├── index.js           # Ponto de entrada principal
│   ├── security.js        # Sistema de segurança
│   ├── progressive-disclosure.js  # Sistema de níveis
│   └── enforcement.js     # Sistema de enforcement
├── servers/               # Servidores MCP
│   ├── scraping/         # Integração Apify
│   └── security/         # Integração Guardrails AI
├── examples/              # Exemplos de uso
│   ├── 01-hello-world.js
│   ├── 02-web-scraping.js
│   ├── 03-security-validation.js
│   ├── 04-privacy-protection.js
│   └── 05-complete-workflow.js
├── test/                  # Testes
│   ├── unit/             # Testes unitários
│   └── integration/      # Testes de integração
└── docs/                  # Documentação adicional
```

## 🔧 Requisitos

- **Node.js**: >= 18.0.0
- **Python**: >= 3.9.0
- **Sistema Operacional**: Windows, macOS ou Linux

## 🔐 Segurança

O framework implementa várias camadas de segurança:

- **Sandbox de Execução**: Código Python executado em ambiente isolado
- **Validação de Entrada**: Todas as entradas são validadas antes da execução
- **Detecção de PII**: Identificação e mascaramento de dados pessoais
- **Conformidade Regulatória**: Suporte para GDPR, LGPD e outras regulamentações
- **Enforcement Automático**: Previne execução de código não autorizado

## 🚀 Casos de Uso

- **Análise de Feedback de Clientes**: Coleta e análise de sentimentos
- **Web Scraping Empresarial**: Extração de dados de múltiplas fontes
- **Processamento de Dados Pessoais**: Conformidade com regulamentações de privacidade
- **Validação de Conteúdo**: Detecção de conteúdo inadequado ou tóxico
- **Workflows Empresariais**: Automação de processos complexos

## 🔄 Conceito Original

Implementação do conceito de Code Execution com MCP conforme artigo da Anthropic, com melhorias significativas:

```
mcp-code-execution/
├── servers/           # Filesystem virtual de MCPs
│   ├── security/      # Guardrails, Garak, Cipher
│   ├── scraping/      # Apify, Crawl4AI
│   ├── dev/           # Chrome DevTools, UI tools
│   ├── workflows/     # n8n MCP
│   └── utils/         # Utilitários diversos
├── runtime/           # Ambiente de execução seguro
├── skills/            # Skills reutilizáveis persistentes
├── tokenizer/         # Sistema de tokenização para dados sensíveis
└── core/              # Core framework
```

**Benefícios Adicionais:**
- **98.7% redução no uso de tokens** ao filtrar dados localmente
- **Proteção de privacidade** com tokenização automática de PII
- **Carregamento sob demanda** de ferramentas MCP
- **Persistência de skills** para reutilização de código

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📖 **Documentação**: [QUICKSTART.md](QUICKSTART.md)
- 🔧 **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 💬 **Issues**: [GitHub Issues](https://github.com/seu-usuario/mcp-code-execution-framework/issues)
- 📧 **Email**: support@techcorp.com

## 🏆 Status do Projeto

✅ **Fase 1**: Core Framework - Completo
✅ **Fase 2**: MCPs Integração - Completo
✅ **Fase 3**: Sistema de Segurança - Completo
✅ **Fase 4**: Testes e Documentação - Completo
🚀 **Status**: Pronto para Produção

---

**Desenvolvido com ❤️ pelo time MCP Code Execution Framework**
