/**
 * @fileoverview Loading Strategies - Preloading & Lazy Loading
 * @module core/loading-strategies
 * @description Gerencia estratégias inteligentes de carregamento de skills
 * @author Claude AI (Model A)
 * @version 1.0.0
 * @since FASE 7.4
 */

const { EventEmitter } = require('events');

/**
 * Loading Strategies Manager
 *
 * Implementa três estratégias de carregamento:
 * 1. Preloading: Carrega skills frequentes no startup
 * 2. Lazy Loading: Carrega skills sob demanda
 * 3. Smart Prefetching: Prevê e carrega skills com base em padrões de uso
 *
 * @class LoadingStrategiesManager
 * @extends EventEmitter
 */
class LoadingStrategiesManager extends EventEmitter {
  /**
   * @param {Object} skillsManager - Instância do SkillsManager
   * @param {Object} options - Opções de configuração
   */
  constructor(skillsManager, options = {}) {
    super();

    if (!skillsManager) {
      throw new Error('SkillsManager is required for LoadingStrategiesManager');
    }

    this.skillsManager = skillsManager;
    this.options = {
      // Preloading
      enablePreloading: options.enablePreloading !== false,
      preloadList: options.preloadList || [],
      preloadOnStartup: options.preloadOnStartup !== false,
      preloadConcurrency: options.preloadConcurrency || 2,

      // Lazy Loading
      enableLazyLoading: options.enableLazyLoading !== false,
      lazyLoadThreshold: options.lazyLoadThreshold || 3, // Load after 3 accesses

      // Smart Prefetching
      enablePrefetching: options.enablePrefetching !== false,
      prefetchThreshold: options.prefetchThreshold || 5, // Prefetch after 5 uses
      maxPrefetchQueue: options.maxPrefetchQueue || 3,

      ...options
    };

    // Usage tracking for smart prefetching
    this.usageStats = new Map(); // skillName -> { count, lastUsed, loadTime }
    this.accessPatterns = []; // Historical access patterns
    this.prefetchQueue = [];

    // Preloading state
    this.preloadedSkills = new Set();
    this.preloadInProgress = false;

    // Stats
    this.stats = {
      preloadedCount: 0,
      lazyLoadedCount: 0,
      prefetchedCount: 0,
      preloadTime: 0,
      cacheHitsFromPreload: 0
    };
  }

  /**
   * FASE 7.4: Preload frequent skills on startup
   *
   * @returns {Promise<Object>} Preload results
   */
  async preloadFrequentSkills() {
    if (!this.options.enablePreloading) {
      console.log('[LoadingStrategies] Preloading disabled');
      return { preloaded: 0, failed: 0, time: 0 };
    }

    if (this.preloadInProgress) {
      console.log('[LoadingStrategies] Preload already in progress');
      return { preloaded: 0, failed: 0, time: 0 };
    }

    this.preloadInProgress = true;
    console.log('[LoadingStrategies] Starting preload of frequent skills...');

    const startTime = Date.now();
    const results = {
      preloaded: 0,
      failed: 0,
      skills: []
    };

    try {
      // Get skills to preload
      const skillsToPreload = await this._getSkillsToPreload();

      if (skillsToPreload.length === 0) {
        console.log('[LoadingStrategies] No skills to preload');
        this.preloadInProgress = false;
        return { ...results, time: 0 };
      }

      console.log(`[LoadingStrategies] Preloading ${skillsToPreload.length} skills...`);

      // Preload in batches (controlled concurrency)
      for (let i = 0; i < skillsToPreload.length; i += this.options.preloadConcurrency) {
        const batch = skillsToPreload.slice(i, i + this.options.preloadConcurrency);

        const batchResults = await Promise.allSettled(
          batch.map(skillName => this._preloadSkill(skillName))
        );

        batchResults.forEach((result, idx) => {
          const skillName = batch[idx];
          if (result.status === 'fulfilled') {
            results.preloaded++;
            results.skills.push(skillName);
            this.preloadedSkills.add(skillName);
            this.emit('skill:preloaded', { skillName });
          } else {
            results.failed++;
            console.error(`[LoadingStrategies] Failed to preload ${skillName}:`, result.reason?.message);
            this.emit('skill:preload-failed', { skillName, error: result.reason });
          }
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      this.stats.preloadedCount = results.preloaded;
      this.stats.preloadTime = totalTime;

      console.log(`[LoadingStrategies] Preloaded ${results.preloaded}/${skillsToPreload.length} skills in ${totalTime}ms`);

      return {
        ...results,
        time: totalTime
      };
    } catch (error) {
      console.error('[LoadingStrategies] Preload error:', error);
      throw error;
    } finally {
      this.preloadInProgress = false;
    }
  }

  /**
   * Get list of skills to preload
   *
   * @private
   * @returns {Promise<Array<string>>} Skill names to preload
   */
  async _getSkillsToPreload() {
    const skills = [];

    // 1. Add explicitly configured skills
    if (this.options.preloadList && this.options.preloadList.length > 0) {
      skills.push(...this.options.preloadList);
    }

    // 2. Add high-priority skills from registry
    try {
      const allSkills = await this.skillsManager.listSkills();
      const highPrioritySkills = allSkills
        .filter(s => s.priority === 1 || s.priority === 'high')
        .map(s => s.name);

      highPrioritySkills.forEach(name => {
        if (!skills.includes(name)) {
          skills.push(name);
        }
      });
    } catch (error) {
      console.warn('[LoadingStrategies] Could not get high-priority skills:', error.message);
    }

    // 3. Add frequently used skills from usage stats
    const frequentSkills = this._getFrequentlyUsedSkills(5);
    frequentSkills.forEach(name => {
      if (!skills.includes(name)) {
        skills.push(name);
      }
    });

    return skills;
  }

  /**
   * Preload a single skill
   *
   * @private
   * @param {string} skillName - Skill to preload
   * @returns {Promise<Object>} Skill metadata
   */
  async _preloadSkill(skillName) {
    const startTime = Date.now();

    try {
      const metadata = await this.skillsManager.loadSkill(skillName);
      const loadTime = Date.now() - startTime;

      // Track in usage stats
      this.usageStats.set(skillName, {
        count: 0,
        lastUsed: Date.now(),
        loadTime,
        preloaded: true
      });

      return metadata;
    } catch (error) {
      throw new Error(`Failed to preload ${skillName}: ${error.message}`);
    }
  }

  /**
   * FASE 7.4: Track skill usage for smart prefetching
   *
   * @param {string} skillName - Skill that was used
   */
  trackUsage(skillName) {
    const now = Date.now();

    // Update usage stats
    const stats = this.usageStats.get(skillName) || { count: 0, lastUsed: 0, loadTime: 0 };
    stats.count++;
    stats.lastUsed = now;
    this.usageStats.set(skillName, stats);

    // Add to access pattern history
    this.accessPatterns.push({
      skillName,
      timestamp: now
    });

    // Keep only recent history (last 100 accesses)
    if (this.accessPatterns.length > 100) {
      this.accessPatterns.shift();
    }

    // Emit usage event
    this.emit('skill:used', { skillName, count: stats.count });

    // Check if should trigger prefetch
    if (this.options.enablePrefetching) {
      this._checkPrefetchTrigger(skillName);
    }
  }

  /**
   * Check if usage pattern suggests prefetching related skills
   *
   * @private
   * @param {string} skillName - Recently used skill
   */
  _checkPrefetchTrigger(skillName) {
    const stats = this.usageStats.get(skillName);

    // Trigger prefetch if skill is used frequently
    if (stats && stats.count >= this.options.prefetchThreshold) {
      // Predict next likely skill based on patterns
      const predictedSkills = this._predictNextSkills(skillName);

      predictedSkills.forEach(predicted => {
        this._addToPrefetchQueue(predicted);
      });
    }
  }

  /**
   * Predict next skills based on access patterns
   *
   * @private
   * @param {string} currentSkill - Current skill
   * @returns {Array<string>} Predicted skill names
   */
  _predictNextSkills(currentSkill) {
    const predictions = new Map(); // skillName -> frequency

    // Analyze patterns: what skills came after currentSkill?
    for (let i = 0; i < this.accessPatterns.length - 1; i++) {
      if (this.accessPatterns[i].skillName === currentSkill) {
        const nextSkill = this.accessPatterns[i + 1].skillName;
        predictions.set(nextSkill, (predictions.get(nextSkill) || 0) + 1);
      }
    }

    // Sort by frequency and return top predictions
    return Array.from(predictions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name]) => name);
  }

  /**
   * Add skill to prefetch queue
   *
   * @private
   * @param {string} skillName - Skill to prefetch
   */
  _addToPrefetchQueue(skillName) {
    // Skip if already loaded or in queue
    if (this.skillsManager.loadedSkills.has(skillName)) {
      return;
    }

    if (this.prefetchQueue.includes(skillName)) {
      return;
    }

    // Add to queue (limit size)
    if (this.prefetchQueue.length < this.options.maxPrefetchQueue) {
      this.prefetchQueue.push(skillName);
      this.emit('skill:queued-for-prefetch', { skillName });

      // Start background prefetch
      this._processPrefetchQueue();
    }
  }

  /**
   * Process prefetch queue in background
   *
   * @private
   */
  async _processPrefetchQueue() {
    if (this.prefetchQueue.length === 0) {
      return;
    }

    const skillName = this.prefetchQueue.shift();

    try {
      console.log(`[LoadingStrategies] Prefetching ${skillName}...`);
      await this.skillsManager.loadSkill(skillName);

      this.stats.prefetchedCount++;
      this.emit('skill:prefetched', { skillName });

      console.log(`[LoadingStrategies] ✅ Prefetched ${skillName}`);
    } catch (error) {
      console.warn(`[LoadingStrategies] Failed to prefetch ${skillName}:`, error.message);
      this.emit('skill:prefetch-failed', { skillName, error });
    }

    // Continue processing queue
    if (this.prefetchQueue.length > 0) {
      setTimeout(() => this._processPrefetchQueue(), 100);
    }
  }

  /**
   * Get frequently used skills
   *
   * @private
   * @param {number} limit - Max number of skills to return
   * @returns {Array<string>} Skill names
   */
  _getFrequentlyUsedSkills(limit = 5) {
    return Array.from(this.usageStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([name]) => name);
  }

  /**
   * Get loading strategy stats
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      preloadedSkills: Array.from(this.preloadedSkills),
      prefetchQueueSize: this.prefetchQueue.length,
      trackedSkills: this.usageStats.size,
      mostUsedSkills: this._getFrequentlyUsedSkills(5).map(name => ({
        name,
        ...this.usageStats.get(name)
      }))
    };
  }

  /**
   * Check if a skill was preloaded
   *
   * @param {string} skillName - Skill name
   * @returns {boolean} True if preloaded
   */
  isPreloaded(skillName) {
    return this.preloadedSkills.has(skillName);
  }

  /**
   * Reset all stats and state
   */
  reset() {
    this.usageStats.clear();
    this.accessPatterns = [];
    this.prefetchQueue = [];
    this.preloadedSkills.clear();

    this.stats = {
      preloadedCount: 0,
      lazyLoadedCount: 0,
      prefetchedCount: 0,
      preloadTime: 0,
      cacheHitsFromPreload: 0
    };
  }
}

module.exports = LoadingStrategiesManager;
