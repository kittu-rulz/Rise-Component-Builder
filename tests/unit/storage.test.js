import { beforeEach, describe, expect, test } from 'vitest';
import {
  buildProject, clearDraft, deleteProject, duplicateProject, getProject, importProjectJson,
  loadDraft, loadFavorites, loadProjects, loadSettings, renameProject, saveDraft, saveFavorites,
  saveProject, saveSettings, validateProject
} from '../../js/storage.js';
import { createMediaReference } from '../../js/media.js';
import { cleanTheme, componentConfig, memoryLocalStorage, validProject } from '../fixtures/index.js';

describe('versioned project persistence', () => {
  beforeEach(() => { globalThis.localStorage = memoryLocalStorage(); });

  test('new, save, update, open, rename, duplicate, and delete lifecycle', () => {
    const created = buildProject({ name: 'New Project', componentId: 'accordion', config: componentConfig(), activeTheme: cleanTheme });
    expect(loadProjects()).toEqual([]);
    saveProject(created);
    expect(getProject(created.id).name).toBe('New Project');
    saveProject({ ...created, name: 'Updated', updatedAt: new Date().toISOString() });
    expect(getProject(created.id).name).toBe('Updated');
    expect(renameProject(created.id, 'Renamed').name).toBe('Renamed');
    const duplicate = duplicateProject(created.id);
    expect(duplicate.id).not.toBe(created.id);
    expect(duplicate.name).toContain('Copy');
    expect(deleteProject(created.id)).toBe(true);
    expect(getProject(created.id)).toBeNull();
  });

  test('valid JSON imports with a new identity and invalid JSON is rejected', () => {
    const imported = importProjectJson(JSON.stringify(validProject()));
    expect(imported.id).not.toBe('fixture-project');
    expect(getProject(imported.id)).not.toBeNull();
    expect(() => importProjectJson('{bad')).toThrow(/not valid JSON/i);
    expect(() => importProjectJson(JSON.stringify({ schemaVersion: 2 }))).toThrow();
  });

  test('unsupported project schema versions are rejected', () => {
    const result = validateProject({ ...validProject(), schemaVersion: 999 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/supports version/i);
  });

  test('settings, favorites, themes, and drafts survive serialization', () => {
    saveSettings({ defaultFont: 'Roboto', exportFormat: 'zip', autosave: false, aiEnabled: true });
    saveFavorites(new Set(['accordion', 'tab-blocks']));
    saveDraft(validProject({ uiTheme: 'dark' }));
    expect(loadSettings()).toEqual({ defaultFont: 'Roboto', exportFormat: 'zip', autosave: false, aiEnabled: true });
    expect(loadFavorites()).toEqual(['accordion', 'tab-blocks']);
    expect(loadDraft().theme.id).toBe(cleanTheme.id);
    expect(loadDraft().uiTheme).toBe('dark');
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  test('media references remain JSON-safe when projects are reopened', () => {
    const reference = createMediaReference({
      id: 'media-1', schemaVersion: 1, kind: 'image', name: 'image.png', mimeType: 'image/png',
      size: 100, createdAt: '2026-01-01T00:00:00.000Z', duration: null
    });
    const project = validProject({ config: componentConfig([{ title: 'Image', content: reference }]) });
    saveProject(project);
    expect(getProject(project.id).config.items[0].content).toEqual(reference);
    expect(JSON.stringify(getProject(project.id))).not.toContain('objectUrl');
  });

  test('version-1 projects migrate their visual settings into theme overrides', () => {
    const current = validProject();
    const legacy = { ...current, schemaVersion: 1, theme: 'dark' };
    delete legacy.uiTheme;
    delete legacy.componentOverrides;
    expect(validateProject(legacy)).toMatchObject({
      valid: true,
      project: { schemaVersion: 2, uiTheme: 'dark', componentOverrides: { primary: current.config.colorPrimary } }
    });
  });
});
