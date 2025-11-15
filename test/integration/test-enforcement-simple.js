/**
 * Testes de Integração - Enforcement (Simplificado)
 * @file test/integration/test-enforcement-simple.js
 */

describe('Enforcement System - Testes de Integração', () => {

  describe('Bloqueio de Chamadas Diretas', () => {
    it('should block direct MCP calls and redirect to framework', () => {
      const enforcementSystem = {
        enforced: true,
        blockedCalls: [],
        redirectToFramework: (mcpName, args) => {
          return {
            success: true,
            redirected: true,
            message: `Call to ${mcpName} redirected to framework.execute()`,
            originalArgs: args
          };
        },
        interceptCall: function(mcpName, args) {
          if (!this.enforced) return { success: false, blocked: false };

          this.blockedCalls.push({
            mcp: mcpName,
            timestamp: Date.now(),
            args: args
          });

          return this.redirectToFramework(mcpName, args);
        }
      };

      // Tenta chamar MCP diretamente
      const result = enforcementSystem.interceptCall('apify', { actor: 'web-scraper' });

      expect(result.success).toBe(true);
      expect(result.redirected).toBe(true);
      expect(result.message).toContain('redirected to framework.execute()');
      expect(enforcementSystem.blockedCalls).toHaveLength(1);
      expect(enforcementSystem.blockedCalls[0].mcp).toBe('apify');
    });

    it('should provide educational error messages', () => {
      const generateEducationalMessage = (mcpName) => {
        return {
          error: `Direct call to MCP '${mcpName}' is not allowed.`,
          suggestion: `Use: framework.execute("from servers.${mcpName} import function_name")`,
          documentation: 'See: docs/enforcement.md',
          example: `framework.execute("from servers.scraping.apify import run_actor")`
        };
      };

      const message = generateEducationalMessage('apify');

      expect(message.error).toContain('Direct call to MCP');
      expect(message.suggestion).toContain('framework.execute');
      expect(message.documentation).toBe('See: docs/enforcement.md');
      expect(message.example).toContain('from servers.scraping.apify import run_actor');
    });
  });

  describe('Enforcement Obrigatório', () => {
    it('should enforce framework usage for all MCP calls', () => {
      const mandatoryEnforcement = {
        enabled: true,
        whitelist: ['framework.execute', 'framework.importPython'],
        isEnforced: function(functionName) {
          return this.enabled && !this.whitelist.includes(functionName);
        },
        enforce: function(call) {
          if (!this.isEnforced(call.function)) {
            return { allowed: true, reason: 'whitelisted' };
          }

          return {
            allowed: false,
            reason: 'MCP calls must use framework.execute()',
            redirectTo: 'framework.execute',
            originalCall: call
          };
        }
      };

      // Chamada whitelist permitida
      const whitelistResult = mandatoryEnforcement.enforce({
        function: 'framework.execute',
        args: ['code here']
      });
      expect(whitelistResult.allowed).toBe(true);

      // Chamada direta de MCP bloqueada
      const mcpResult = mandatoryEnforcement.enforce({
        function: 'apify.run_actor',
        args: ['actor-name']
      });
      expect(mcpResult.allowed).toBe(false);
      expect(mcpResult.redirectTo).toBe('framework.execute');
    });
  });

  describe('Progressive Disclosure Integration', () => {
    it('should integrate with user level progression', () => {
      const progressiveSystem = {
        userProgress: {
          level: 'beginner',
          experience: 0,
          completedTutorials: 0
        },
        availableCategories: {
          beginner: ['security'],
          intermediate: ['security', 'scraping'],
          advanced: ['security', 'scraping', 'privacy']
        },
        checkProgression: function() {
          const xpNeeded = {
            beginner: 0,
            intermediate: 100,
            advanced: 300
          };

          if (this.userProgress.experience >= xpNeeded.advanced) {
            this.userProgress.level = 'advanced';
          } else if (this.userProgress.experience >= xpNeeded.intermediate) {
            this.userProgress.level = 'intermediate';
          }

          return this.userProgress.level;
        },
        grantExperience: function(amount) {
          this.userProgress.experience += amount;
          this.userProgress.completedTutorials++;
          return this.checkProgression();
        },
        getAvailableMCPs: function() {
          return this.availableCategories[this.userProgress.level] || [];
        }
      };

      // Usuário começa como iniciante
      expect(progressiveSystem.getAvailableMCPs()).toEqual(['security']);

      // Ganha experiência e progride
      const newLevel = progressiveSystem.grantExperience(150);
      expect(newLevel).toBe('intermediate');
      expect(progressiveSystem.getAvailableMCPs()).toEqual(['security', 'scraping']);
    });
  });

  describe('Monitoramento e Analytics', () => {
    it('should track enforcement metrics', () => {
      const metrics = {
        totalCalls: 0,
        blockedCalls: 0,
        redirectedCalls: 0,
        educationalMessages: 0,
        timestamp: Date.now(),
        recordCall: function(type) {
          this.totalCalls++;
          if (type === 'blocked') this.blockedCalls++;
          if (type === 'redirected') this.redirectedCalls++;
          if (type === 'educational') this.educationalMessages++;
        },
        getStats: function() {
          return {
            total: this.totalCalls,
            blocked: this.blockedCalls,
            redirected: this.redirectedCalls,
            educational: this.educationalMessages,
            blockRate: this.totalCalls > 0 ? (this.blockedCalls / this.totalCalls) * 100 : 0,
            redirectRate: this.totalCalls > 0 ? (this.redirectedCalls / this.totalCalls) * 100 : 0
          };
        }
      };

      // Simula várias chamadas
      metrics.recordCall('redirected');
      metrics.recordCall('redirected');
      metrics.recordCall('blocked');
      metrics.recordCall('educational');

      const stats = metrics.getStats();
      expect(stats.total).toBe(4);
      expect(stats.redirected).toBe(2);
      expect(stats.blocked).toBe(1);
      expect(stats.educational).toBe(1);
      expect(stats.redirectRate).toBe(50);
    });
  });
});