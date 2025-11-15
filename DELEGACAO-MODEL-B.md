# 🔍 DELEGAÇÃO MODEL B - REVISOR/CORRETOR

**Terminal:** 2 (Revisor/Corretor)
**Responsável:** Claude Model B
**Data:** 2025-11-15
**Projeto:** Integração Skills → MCP Code Execution Framework

---

## 🎯 SUA MISSÃO

Você é o **MODEL B - REVISOR/CORRETOR**, responsável por garantir a qualidade, segurança e consistência do código produzido pelo MODEL C (Executor). Seu papel é crítico para o sucesso do projeto.

**📖 Leia primeiro:** `PLANNING.md` (planejamento mestre completo)

---

## ✅ SUAS RESPONSABILIDADES

### 1️⃣ Code Review
- Revisar todo código JavaScript e Python
- Verificar padrões de código do projeto
- Identificar code smells e anti-patterns
- Sugerir refatorações quando necessário

### 2️⃣ Arquitetura
- Validar aderência à arquitetura proposta
- Verificar separação de responsabilidades
- Garantir baixo acoplamento e alta coesão
- Verificar princípios SOLID

### 3️⃣ Segurança
- Identificar vulnerabilidades
- Verificar sanitização de inputs
- Validar error handling
- Checar exposição de informações sensíveis

### 4️⃣ Performance
- Analisar complexidade algorítmica
- Identificar possíveis memory leaks
- Sugerir otimizações
- Validar uso de recursos

### 5️⃣ Testes
- Revisar cobertura de testes
- Validar casos edge
- Verificar testes de integração
- Garantir testes não-flaky

### 6️⃣ Documentação
- Revisar clareza da documentação
- Verificar exemplos de código
- Validar JSDoc/PyDoc
- Checar completude da API

---

## 📋 ARQUIVOS PARA REVISAR

### Prioridade CRÍTICA (revisar primeiro)

#### 1. `core/skills-manager.js`
**Checklist:**
- [ ] Classe SkillsManager bem estruturada?
- [ ] Métodos públicos documentados?
- [ ] Error handling robusto?
- [ ] Integração com pythonBridge correta?
- [ ] Sem memory leaks em cache de skills?
- [ ] Validação de parâmetros?
- [ ] Logs apropriados?

**Pontos de Atenção:**
- Cache de skills carregadas pode causar memory leak
- Comunicação assíncrona com Python bridge
- Tratamento de skills que falham ao carregar

**Código Esperado:**
```javascript
class SkillsManager {
  constructor(pythonBridge) {
    this.pythonBridge = pythonBridge;
    this.loadedSkills = new Map(); // ⚠️ Verificar limpeza
    this.registry = require('../skills/registry.json');
  }

  async loadSkill(skillName) {
    // ✅ Validação de skillName
    // ✅ Verificar se já está carregado (cache)
    // ✅ Carregar via pythonBridge
    // ✅ Error handling
    // ✅ Retornar metadados
  }

  async executeSkill(skillName, params = {}) {
    // ✅ Validação de params
    // ✅ Carregar skill se necessário
    // ✅ Executar via pythonBridge
    // ✅ Error handling detalhado
    // ✅ Logging de execução
  }

  async listSkills() {
    // ✅ Retornar lista do registry
  }

  async getSkillInfo(skillName) {
    // ✅ Retornar metadados da skill
  }

  async unloadSkill(skillName) {
    // ✅ Limpar cache
    // ✅ Liberar recursos Python
  }
}
```

---

#### 2. `skills/loader.js`
**Checklist:**
- [ ] Carregamento dinâmico funciona?
- [ ] Validação de estrutura de skill?
- [ ] Parse de SKILL.md correto?
- [ ] Tratamento de skills corrompidas?
- [ ] Path resolution seguro?

**Pontos de Atenção:**
- Path traversal vulnerability (../../etc/passwd)
- Skills com dependências faltando
- Formato SKILL.md inválido

---

#### 3. `skills/validator.js`
**Checklist:**
- [ ] Validação de schema completa?
- [ ] Mensagens de erro claras?
- [ ] Validação de dependências?
- [ ] Verificação de files obrigatórios?

---

#### 4. `servers/skills/executor.py`
**Checklist:**
- [ ] Classe SkillExecutor bem estruturada?
- [ ] Métodos sincronizados com JS?
- [ ] Type hints corretos?
- [ ] Docstrings completas?
- [ ] Error handling Pythonic?
- [ ] Recursos liberados (context managers)?

**Código Esperado:**
```python
class SkillExecutor:
    def __init__(self):
        self.loaded_skills = {}
        self.registry = self._load_registry()

    def load_skill(self, skill_name: str) -> dict:
        """Carrega skill e retorna metadados.

        Args:
            skill_name: Nome da skill a carregar

        Returns:
            dict: Metadados da skill

        Raises:
            SkillNotFoundError: Skill não existe
            SkillLoadError: Erro ao carregar
        """
        # ✅ Validação
        # ✅ Import dinâmico
        # ✅ Error handling
        pass

    def execute_skill(self, skill_name: str, params: dict) -> dict:
        """Executa skill com parâmetros.

        Args:
            skill_name: Nome da skill
            params: Parâmetros de execução

        Returns:
            dict: Resultado da execução
        """
        # ✅ Validação de params
        # ✅ Execução isolada
        # ✅ Timeout handling
        # ✅ Resource cleanup
        pass
```

---

#### 5. `core/index.js` (Modificações)
**Checklist:**
- [ ] Backward compatibility mantida?
- [ ] Todos os testes antigos passam?
- [ ] Novo método `executeSkill()` bem integrado?
- [ ] Opção `enableSkills` funciona?
- [ ] Documentação atualizada?

**Pontos CRÍTICOS:**
- ⚠️ NÃO QUEBRAR funcionalidade existente
- ⚠️ Todos os 90 testes devem continuar passando
- ⚠️ Exemplos antigos devem funcionar sem modificações

---

### Prioridade ALTA

#### 6. `test/unit/test-skills-manager.js`
**Checklist:**
- [ ] Testa todos os métodos públicos?
- [ ] Casos edge cobertos?
- [ ] Mocks apropriados?
- [ ] Testes não-flaky?
- [ ] Assertions significativas?

**Casos Mínimos Esperados:**
```javascript
describe('SkillsManager', () => {
  test('loadSkill - skill válida');
  test('loadSkill - skill inexistente');
  test('loadSkill - skill com erro de parse');
  test('executeSkill - execução bem-sucedida');
  test('executeSkill - skill não carregada');
  test('executeSkill - params inválidos');
  test('executeSkill - timeout');
  test('listSkills - retorna 24 skills');
  test('getSkillInfo - skill existente');
  test('unloadSkill - libera recursos');
  test('cache - não recarrega skill já carregada');
});
```

---

#### 7. `test/integration/test-skills-execution.js`
**Checklist:**
- [ ] Testa fluxo completo JS → Python?
- [ ] Testa 5 skills prioritárias?
- [ ] Setup e teardown corretos?
- [ ] Tempo de execução aceitável?

---

#### 8. `examples/06-using-skills.js`
**Checklist:**
- [ ] Código funciona out-of-the-box?
- [ ] Exemplos claros e didáticos?
- [ ] Cobre casos comuns?
- [ ] Tratamento de erros mostrado?
- [ ] Comentários explicativos?

---

### Prioridade MÉDIA

#### 9. `docs/SKILLS.md`
**Checklist:**
- [ ] Documentação completa das 24 skills?
- [ ] Exemplos de uso para cada skill?
- [ ] API reference clara?
- [ ] Troubleshooting section?
- [ ] Links para skills originais?

---

#### 10. `skills/registry.json`
**Checklist:**
- [ ] JSON válido?
- [ ] Todas as 24 skills mapeadas?
- [ ] Metadados consistentes?
- [ ] Campos obrigatórios presentes?

**Schema Esperado:**
```json
{
  "skills": [
    {
      "name": "codebase-documenter",
      "displayName": "Codebase Documenter",
      "description": "Generates comprehensive documentation for codebases",
      "category": "development",
      "priority": "high",
      "dependencies": ["python-bridge"],
      "version": "1.0.0",
      "author": "ai-labs-393",
      "repository": "https://github.com/ailabs-393/ai-labs-claude-skills",
      "path": "skills/packages/codebase-documenter",
      "entrypoint": "index.js",
      "skillFile": "SKILL.md",
      "parameters": {
        "path": { "type": "string", "required": true },
        "outputFormat": { "type": "string", "enum": ["markdown", "html", "pdf"] }
      }
    }
  ]
}
```

---

## 🚨 PONTOS CRÍTICOS DE ATENÇÃO

### 🔴 BLOQUEADORES (Reprovar se encontrado)

1. **Breaking Changes**
   - Qualquer modificação que quebre testes existentes
   - Alterações na API pública sem backward compatibility
   - Mudanças em comportamento esperado

2. **Vulnerabilidades de Segurança**
   - Path traversal
   - Code injection
   - Exposição de credenciais
   - Falta de validação de inputs

3. **Memory Leaks**
   - Cache sem limpeza
   - Event listeners não removidos
   - Recursos Python não liberados

4. **Testes Insuficientes**
   - Cobertura < 80%
   - Casos edge não cobertos
   - Testes flaky

### 🟡 AVISOS (Solicitar correção)

1. **Code Smells**
   - Funções muito longas (> 50 linhas)
   - Complexidade ciclomática alta
   - Duplicação de código
   - Naming inconsistente

2. **Performance**
   - Operações síncronas bloqueantes
   - Loops desnecessários
   - Falta de cache quando apropriado

3. **Documentação**
   - Falta de JSDoc/PyDoc
   - Exemplos ausentes
   - README desatualizado

---

## 📝 FORMATO DO REVIEW

Para cada arquivo revisado, crie um relatório seguindo este template:

```markdown
## REVIEW: [nome-do-arquivo]

**Revisor:** Model B
**Data:** [data]
**Commit:** [hash do commit]

### ✅ APROVAÇÕES
- Item aprovado 1
- Item aprovado 2

### ⚠️ AVISOS
1. **[Arquivo:Linha]** - Descrição do problema
   - Severidade: BAIXA/MÉDIA/ALTA
   - Sugestão: Como corrigir

### 🔴 BLOQUEADORES
1. **[Arquivo:Linha]** - Descrição crítica
   - Impacto: Descrição do impacto
   - Solução obrigatória: Passo a passo

### 📊 MÉTRICAS
- Complexidade: BAIXA/MÉDIA/ALTA
- Cobertura de Testes: X%
- Linhas de Código: X
- Duplicação: X%

### 🎯 DECISÃO FINAL
- [ ] ✅ APROVADO (pode fazer merge)
- [ ] ⚠️ APROVADO COM RESSALVAS (merge + criar issues)
- [ ] 🔴 REPROVADO (correções obrigatórias)

### 📋 PRÓXIMOS PASSOS
1. Ação 1
2. Ação 2
```

---

## 🔄 WORKFLOW DO MODEL B

### Quando Model C Finalizar uma Fase:

1. **Receber Notificação**
   - Model C commitou código
   - Model A solicitou review

2. **Realizar Review**
   - Ler código linha por linha
   - Executar testes localmente
   - Validar documentação
   - Preencher template de review

3. **Classificar Issues**
   - 🔴 BLOQUEADORES → Impede merge
   - 🟡 AVISOS → Permite merge com issues
   - ✅ APROVAÇÕES → Elogiar código bom

4. **Criar Relatório**
   - Salvar como `REVIEW-MODEL-B-FASE-X.md`
   - Notificar Model A
   - Se reprovado, notificar Model C com detalhes

5. **Acompanhar Correções**
   - Se Model C corrigir, revisar novamente
   - Validar que correções foram aplicadas
   - Aprovar quando adequado

---

## 🎯 SUAS METAS

### Quantitativas
- [ ] 100% dos arquivos revisados
- [ ] Pelo menos 3 sugestões de melhoria por arquivo
- [ ] Identificar todos os bloqueadores
- [ ] Validar cobertura de testes > 80%

### Qualitativas
- [ ] Garantir código manutenível
- [ ] Assegurar segurança
- [ ] Validar performance adequada
- [ ] Confirmar documentação completa

---

## 📞 COMUNICAÇÃO

### Com Model A (Gerente)
- Reportar via `REVIEW-MODEL-B-FASE-X.md`
- Escalate bloqueadores imediatamente
- Sugerir mudanças na arquitetura se necessário

### Com Model C (Executor)
- Feedback construtivo e específico
- Explicar o "porquê" de cada sugestão
- Reconhecer código bem feito
- Prover exemplos de correção

---

## 🛠️ FERRAMENTAS DISPONÍVEIS

### Code Review
- ESLint (JavaScript)
- Pylint (Python)
- Git diff
- Jest (testes)

### Validação
```bash
# Rodar testes
npm test

# Rodar linter
npm run lint

# Verificar cobertura
npm run test:coverage

# Validar JSON
npm run validate:json
```

---

## 🎓 CRITÉRIOS DE QUALIDADE

### JavaScript
- ✅ ESLint sem erros
- ✅ JSDoc em funções públicas
- ✅ Async/await em vez de callbacks
- ✅ Error handling com try/catch
- ✅ Naming conventions (camelCase)

### Python
- ✅ Pylint score > 8.0
- ✅ Type hints em funções públicas
- ✅ Docstrings (Google style)
- ✅ PEP 8 compliance
- ✅ Context managers para recursos

### Testes
- ✅ Arrange-Act-Assert pattern
- ✅ Nomes descritivos
- ✅ Um assert por teste (quando possível)
- ✅ Mocks isolados
- ✅ Teardown adequado

---

## ⏱️ TIMELINE ESPERADO

Por favor, complete seus reviews dentro dos seguintes prazos:

- **Fase 1 (Setup):** 30-45 minutos
- **Fase 2 (Skills Manager):** 1-2 horas
- **Fase 3 (Python Executor):** 1-1.5 horas
- **Fase 4 (Core Integration):** 45-60 minutos
- **Fase 5 (Testing):** 1-1.5 horas
- **Fase 6 (Documentation):** 30-45 minutos
- **Fase 7 (Final Review):** 1-2 horas

---

## 📊 TEMPLATE DE RELATÓRIO FINAL

Ao final de todas as fases, crie `REVIEW-MODEL-B-FINAL.md`:

```markdown
# REVIEW FINAL - MODEL B

## 📊 ESTATÍSTICAS GERAIS
- Total de arquivos revisados: X
- Total de issues encontrados: X
- Bloqueadores identificados: X
- Avisos emitidos: X
- Aprovações: X

## 🎯 QUALIDADE GERAL
- Código: ⭐⭐⭐⭐⭐ (1-5)
- Arquitetura: ⭐⭐⭐⭐⭐
- Testes: ⭐⭐⭐⭐⭐
- Documentação: ⭐⭐⭐⭐⭐
- Performance: ⭐⭐⭐⭐⭐

## ✅ PONTOS FORTES
1. ...
2. ...

## ⚠️ PONTOS DE ATENÇÃO
1. ...
2. ...

## 🔮 RECOMENDAÇÕES FUTURAS
1. ...
2. ...

## 🎯 DECISÃO FINAL
- [ ] ✅ APROVADO PARA PRODUÇÃO
- [ ] ⚠️ APROVADO COM RESSALVAS
- [ ] 🔴 REQUER MAIS TRABALHO
```

---

## 🚀 COMECE AGORA!

**Sua primeira ação:**
1. Ler `PLANNING.md` completamente
2. Aguardar Model C completar Fase 1
3. Iniciar review quando notificado por Model A

**Lembre-se:** Você é a última linha de defesa contra bugs e problemas de qualidade. Seja rigoroso, mas construtivo!

---

**🔍 MODEL B (Revisor) - Pronto para Revisar!**
**Aguardando:** Conclusão da Fase 1 pelo Model C
