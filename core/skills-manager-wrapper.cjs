/**
 * CommonJS wrapper for SkillsManager to support ES6 imports
 * This module provides a bridge between ES6 and CommonJS module systems
 */

const SkillsManager = require('./skills-manager.cjs');

module.exports = SkillsManager;