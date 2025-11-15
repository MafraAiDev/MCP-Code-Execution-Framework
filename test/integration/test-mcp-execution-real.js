/**
 * Testes de Integração REAIS - Execução de MCP
 * Testa fluxo completo: JS → Python Bridge → Python Server → MCPs
 */

describe('MCP Execution Flow - Testes Reais de Integração', () => {

  let framework;

  beforeAll(async () => {
    // Importa framework dinamicamente
    const module = await import('../../core/index.js');
    framework = module.default;
    // Inicializa framework real
    await framework.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await framework.cleanup();
  });

  describe('Fluxo Completo JS → Python → MCP', () => {

    it('should execute Python code via real Python Bridge', async () => {
      // Teste REAL (não simulação)
      const result = await framework.execute('2 + 2');

      expect(result).toBe(4);
      expect(typeof result).toBe('number');
    });

    it('should import servers module via real Python', async () => {
      const code = `
from servers import list_categories
categories = list_categories()
categories
      `;

      const result = await framework.execute(code);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('security');
      expect(result).toContain('scraping');
    });

    it('should import servers modules successfully', async () => {
      // Verifica que imports funcionam (estrutura)
      const code = `
from servers.scraping import apify
from servers.security import guardrails

# Verifica se módulos existem
has_apify = hasattr(apify, 'run_actor')
has_guardrails = hasattr(guardrails, 'validate')

{'has_apify': has_apify, 'has_guardrails': has_guardrails}
      `;

      const result = await framework.execute(code);

      expect(result.has_apify).toBe(true);
      expect(result.has_guardrails).toBe(true);
    });

    it('should list MCP categories', async () => {
      const code = `
from servers import list_categories
categories = list_categories()
categories
      `;

      const result = await framework.execute(code);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('security');
      expect(result).toContain('scraping');
    });

    it('should maintain state between Python executions', async () => {
      // Define variável
      await framework.execute('x = 42');

      // Acessa variável em execução separada
      const result = await framework.eval('x');

      expect(result).toBe(42);
    });

    it('should handle Python errors gracefully', async () => {
      await expect(
        framework.execute('1 / 0')
      ).rejects.toThrow();
    });

    it('should execute basic Python functions', async () => {
      const code = `
def greet(name):
    return f"Hello, {name}!"

greet('World')
      `;

      const result = await framework.execute(code);
      expect(result).toBe('Hello, World!');
    });

    it('should pass context variables to Python', async () => {
      const context = { name: 'World' };
      const code = `
def process_context():
    if 'name' in context:
        return f"Name: {context['name']}"
    return "No name"

process_context()
      `;

      const result = await framework.execute(code, context);
      expect(result).toBe('Name: World');
    });

    it('should handle complex Python data structures', async () => {
      const code = `
data = {
    'list': [1, 2, 3],
    'dict': {'nested': 'value'},
    'number': 42,
    'string': 'text'
}
data
      `;

      const result = await framework.execute(code);

      expect(result).toHaveProperty('list');
      expect(result.list).toEqual([1, 2, 3]);
      expect(result.dict.nested).toBe('value');
    });

    it('should provide accurate statistics', async () => {
      const stats = framework.getStats();

      expect(stats).toHaveProperty('executions');
      expect(stats).toHaveProperty('initialized');
      expect(stats.initialized).toBe(true);
      expect(stats.executions).toBeGreaterThan(0);
    });

  });

  describe('Sistema de Enforcement', () => {

    it('should have enforcement active', () => {
      const stats = framework.getStats();
      expect(stats.mcpInterceptor.enforced).toBe(true);
    });

    it('should track MCP interception attempts', () => {
      const stats = framework.getStats();
      expect(stats.mcpInterceptor).toHaveProperty('interceptedMCPs');
      expect(stats.mcpInterceptor.interceptedMCPs).toBeGreaterThan(0);
    });

  });

  describe('Progressive Disclosure', () => {

    it('should discover security MCPs', async () => {
      const code = `
from servers import list_mcps
security_mcps = list_mcps('security')
security_mcps
      `;

      const mcps = await framework.execute(code);

      expect(Array.isArray(mcps)).toBe(true);
      expect(mcps.length).toBeGreaterThan(0);
      expect(mcps).toContain('guardrails');
    });

  });

});
