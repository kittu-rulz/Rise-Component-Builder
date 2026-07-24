/* Rise Component Builder — Application Shell Logic */

import { appState, resetConfig } from './js/state.js';
import {
  buildProject, clearDraft, deleteProject, duplicateProject, getProject, importProjectJson,
  deleteCustomTheme, loadCustomThemes, loadDefaultThemeId, loadDraft, loadFavorites, loadProjects,
  loadSettings, loadUiTheme, renameProject, saveCustomTheme, saveDefaultThemeId, saveDraft,
  saveFavorites, saveProject, saveSettings, saveUiTheme
} from './js/storage.js';
import { componentCatalog, filterCatalog, createCatalogCard } from './js/catalog.js';
import { createSchemaItemEditor, switchEditorTab as activateEditorTab, addEditorItem, validateActiveComponent, validateSchemaField } from './js/editor.js';
import { writePreview, openPreview, generateIframeContent as compilePreview } from './js/preview.js';
import { buildExportPayload, downloadAssetManifest, downloadHtml, downloadProjectJson, prepareMediaExport } from './js/export.js';
import { copyTextToClipboard, toRgba as colorToRgba } from './js/utilities.js';
import { showToast } from './js/toast.js';
import { resolveMediaLimits, validateMediaAccessibility } from './js/media.js';
import { pruneMediaObjectURLs, releaseAllMediaObjectURLs, restoreMediaReferences } from './js/media-storage.js';
import {
  applyThemeToConfig, BUILT_IN_THEMES, createThemeFromCurrentStyling, DEFAULT_THEME_ID,
  duplicateTheme, importThemeJson, normalizeComponentOverrides, renameCustomTheme,
  serializeTheme, validateThemeContrast
} from './js/themes.js';
import * as accordion from './components/accordion.js';
import * as tabs from './components/tabs.js';
import * as flipCards from './components/flip-cards.js';
import * as verticalTimeline from './components/vertical-timeline.js';
import * as multipleChoice from './components/multiple-choice.js';
import * as multipleSelect from './components/multiple-select.js';

const componentRegistry = Object.fromEntries(
  [accordion, tabs, flipCards, verticalTimeline, multipleChoice, multipleSelect].map(component => [component.id, component])
);
const generateIframeContent = () => compilePreview(appState, componentRegistry, colorToRgba);

document.addEventListener('DOMContentLoaded', async () => {
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  appState.uiTheme = loadUiTheme();
  appState.settings = loadSettings();
  appState.favorites = new Set(loadFavorites());
  let customThemes = loadCustomThemes();
  let defaultThemeId = loadDefaultThemeId();
  const initialComponentTheme = [...BUILT_IN_THEMES, ...customThemes].find(theme => theme.id === defaultThemeId)
    || BUILT_IN_THEMES.find(theme => theme.id === DEFAULT_THEME_ID);
  appState.activeThemeId = initialComponentTheme.id;
  appState.activeTheme = structuredClone(initialComponentTheme);
  appState.componentOverrides = {};
  appState.config = applyThemeToConfig(appState.config, appState.activeTheme, appState.componentOverrides);

  // ==========================================
  // DATABASE OF COMPONENT ARCHETYPES
  // ==========================================
  // ==========================================
  // DOM ELEMENT REFERENCES
  // ==========================================
  const htmlRoot = document.documentElement;
  const btnTheme = document.getElementById('btn-theme');
  const themeIconLight = btnTheme.querySelector('.theme-icon-light');
  const themeIconDark = btnTheme.querySelector('.theme-icon-dark');
  
  const searchInput = document.getElementById('search-components');
  const navItems = document.querySelectorAll('.nav-item');
  const componentsGrid = document.getElementById('components-grid');
  
  const catalogState = document.getElementById('catalog-state');
  const editorState = document.getElementById('editor-state');
  
  const btnBackToCatalog = document.getElementById('btn-back-to-catalog');
  const activeComponentTitle = document.getElementById('active-component-title');
  const activeComponentCategory = document.getElementById('active-component-category');
  const btnFavoriteToggle = document.getElementById('btn-favorite-toggle');
  const favoritesCountBadge = document.getElementById('favorites-count-badge');
  
  // Editor Tabs
  const editorTabs = document.querySelectorAll('.editor-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Form Inputs
  const inputBlockTitle = document.getElementById('input-block-title');
  const inputBlockHeadline = document.getElementById('input-block-headline');
  const inputBlockDesc = document.getElementById('input-block-desc');
  const inputColorPrimary = document.getElementById('input-color-primary');
  const inputColorPrimaryText = document.getElementById('input-color-primary-text');
  const inputColorAccent = document.getElementById('input-color-accent');
  const inputColorAccentText = document.getElementById('input-color-accent-text');
  const inputColorBg = document.getElementById('input-color-bg');
  const inputColorBgText = document.getElementById('input-color-bg-text');
  const inputColorText = document.getElementById('input-color-text');
  const inputColorTextText = document.getElementById('input-color-text-text');
  const inputBorderRadius = document.getElementById('input-border-radius');
  const radiusVal = document.getElementById('radius-val');
  const selectShadow = document.getElementById('select-shadow');
  const inputBorderEnable = document.getElementById('input-border-enable');
  
  const inputBehaviorAccordionMulti = document.getElementById('input-behavior-accordion-multi');
  const inputBehaviorAccordionAnimation = document.getElementById('input-behavior-accordion-animation');
  const selectIconStyle = document.getElementById('select-icon-style');
  const inputTrackCompletion = document.getElementById('input-track-completion');
  const inputCompletionMsg = document.getElementById('input-completion-msg');
  
  // Dynamic Content Items
  const dynamicItemsContainer = document.getElementById('dynamic-items-container');
  const btnAddItem = document.getElementById('btn-add-item');
  
  // Preview
  const deviceButtons = document.querySelectorAll('.device-btn');
  const previewViewport = document.getElementById('preview-viewport');
  const btnPreviewRefresh = document.getElementById('btn-preview-refresh');
  const btnPreviewPopout = document.getElementById('btn-preview-popout');
  const livePreviewIframe = document.getElementById('live-preview-iframe');
  const savedComponentsList = document.getElementById('saved-components-list');
  const saveModal = document.getElementById('modal-save');
  const saveModalTitle = document.getElementById('save-modal-title');
  const saveNameInput = document.getElementById('save-component-name');
  const btnConfirmSaveAs = document.getElementById('btn-confirm-save-as');
  const importProjectFile = document.getElementById('import-project-file');
  const selectComponentFont = document.getElementById('select-component-font');
  const themeCards = document.getElementById('theme-cards');
  const importThemeFile = document.getElementById('import-theme-file');

  // Modals elements
  const modalTriggers = {
    'btn-export': 'modal-export',
    'btn-settings': 'modal-settings',
    'btn-theme-manager': 'modal-theme-manager',
    'btn-open-theme-manager-style': 'modal-theme-manager'
  };
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  modalOverlays.forEach(overlay => overlay.setAttribute('aria-hidden', 'true'));

  // ==========================================
  // INITIALIZATION
  // ==========================================
  async function init() {
    // 1. Load theme state
    setUiTheme(appState.uiTheme);
    
    // 2. Render initial category catalog
    renderCatalog();
    
    // 3. Update Favorites count
    updateFavoritesBadge();
    updateStorageMeter();

    // 4. Hook up live sync for values in Form Inputs
    setupFormListeners();
    
    // 5. Restore a valid draft, otherwise build the initial preview.
    syncSettingsControls();
    const draft = loadDraft();
    if (draft && await applyProject(draft, true)) {
      showToast(`Restored draft “${draft.name}”.`, 'success');
    } else {
      renderDynamicItems();
      updateLivePreview();
    }

    window.setInterval(saveCurrentDraft, 60000);
    window.setInterval(updateStorageMeter, 30000);
  }

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================
  function setUiTheme(theme) {
    appState.uiTheme = theme;
    htmlRoot.setAttribute('data-theme', theme);
    try { saveUiTheme(theme); }
    catch (error) { showToast(error.message, 'error'); }
    
    if (theme === 'dark') {
      themeIconLight.style.display = 'none';
      themeIconDark.style.display = 'block';
    } else {
      themeIconLight.style.display = 'block';
      themeIconDark.style.display = 'none';
    }
    
    // Notify preview frame if running
    updateLivePreview();
  }

  btnTheme.addEventListener('click', () => {
    setUiTheme(appState.uiTheme === 'light' ? 'dark' : 'light');
  });

  function getAvailableThemes() {
    return [...BUILT_IN_THEMES, ...customThemes];
  }

  function syncResolvedThemeConfig() {
    appState.componentOverrides = normalizeComponentOverrides(appState.componentOverrides);
    appState.config = applyThemeToConfig(appState.config, appState.activeTheme, appState.componentOverrides);
  }

  function updateThemeSourceIndicators() {
    const keys = ['primary', 'accent', 'background', 'text', 'borderRadius', 'shadow', 'fontFamily'];
    keys.forEach(key => {
      const badge = document.getElementById(`override-${key}-status`);
      if (!badge) return;
      const overridden = Object.hasOwn(appState.componentOverrides, key);
      badge.textContent = overridden ? 'Component override' : 'Theme value';
      badge.classList.toggle('is-override', overridden);
    });
    const activeLabel = document.getElementById('active-component-theme-name');
    if (activeLabel) activeLabel.textContent = appState.activeTheme.name;
  }

  function setComponentOverride(key, value) {
    appState.componentOverrides = { ...appState.componentOverrides, [key]: value };
    syncResolvedThemeConfig();
    updateThemeSourceIndicators();
    updateLivePreview();
  }

  function applyComponentTheme(theme, { clearOverrides = false } = {}) {
    appState.activeThemeId = theme.id;
    appState.activeTheme = structuredClone(theme);
    if (clearOverrides) appState.componentOverrides = {};
    syncResolvedThemeConfig();
    if (appState.selectedComponent) syncEditorControls();
    else updateThemeSourceIndicators();
    renderThemeManager();
    updateLivePreview();
  }

  function addThemeAction(container, label, handler, className = 'btn btn-text btn-small') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', handler);
    container.appendChild(button);
  }

  function renderContrastReport() {
    const container = document.getElementById('theme-contrast-report');
    container.replaceChildren();
    validateThemeContrast(appState.activeTheme).forEach(result => {
      const card = document.createElement('div');
      card.className = `contrast-result${result.normalText ? '' : ' fail'}`;
      const heading = document.createElement('div');
      heading.className = 'contrast-result-line';
      const name = document.createElement('strong');
      name.textContent = result.label;
      const ratio = document.createElement('span');
      ratio.textContent = `${result.ratio}:1`;
      heading.append(name, ratio);
      const levels = document.createElement('div');
      levels.className = 'contrast-result-line';
      const normal = document.createElement('span');
      normal.className = result.normalText ? 'contrast-pass' : 'contrast-fail';
      normal.textContent = `Normal: ${result.normalText ? 'Pass' : 'Fail'}`;
      const large = document.createElement('span');
      large.className = result.largeText ? 'contrast-pass' : 'contrast-fail';
      large.textContent = `Large: ${result.largeText ? 'Pass' : 'Fail'}`;
      levels.append(normal, large);
      card.append(heading, levels);
      if (result.suggested) {
        const suggestion = document.createElement('div');
        suggestion.className = 'contrast-suggestion';
        suggestion.textContent = `Suggested accessible ${result.foregroundToken}: ${result.suggested}. Review before applying.`;
        card.appendChild(suggestion);
      }
      container.appendChild(card);
    });
  }

  function renderThemeManager() {
    if (!themeCards) return;
    document.getElementById('theme-manager-active-name').textContent = appState.activeTheme.name;
    document.getElementById('theme-manager-default-label').textContent = appState.activeTheme.id === defaultThemeId ? 'Default theme' : '';
    themeCards.replaceChildren();
    getAvailableThemes().forEach(theme => {
      const card = document.createElement('article');
      card.className = `theme-card${theme.id === appState.activeThemeId ? ' is-active' : ''}`;
      const preview = document.createElement('div');
      preview.className = 'theme-card-preview';
      preview.style.background = theme.tokens.background;
      const title = document.createElement('div');
      title.className = 'theme-card-preview-title';
      title.style.background = theme.tokens.text;
      const copy = document.createElement('div');
      copy.className = 'theme-card-preview-copy';
      copy.style.background = theme.tokens.mutedText;
      const sampleButton = document.createElement('div');
      sampleButton.className = 'theme-card-preview-button';
      sampleButton.style.background = theme.tokens.primary;
      sampleButton.style.borderRadius = `${theme.tokens.buttonRadius}px`;
      preview.append(title, copy, sampleButton);

      const body = document.createElement('div');
      body.className = 'theme-card-body';
      const heading = document.createElement('div');
      heading.className = 'theme-card-heading';
      const name = document.createElement('strong');
      name.textContent = theme.name;
      const pill = document.createElement('span');
      pill.className = 'theme-pill';
      pill.textContent = theme.isLocked ? 'Company · Locked' : theme.isBuiltIn ? 'Built-in' : 'Custom';
      heading.append(name, pill);
      const meta = document.createElement('div');
      meta.className = 'theme-card-meta';
      meta.textContent = `${theme.organization}${theme.id === defaultThemeId ? ' · Default' : ''}`;
      const description = document.createElement('p');
      description.className = 'theme-card-description';
      description.textContent = theme.description;
      const actions = document.createElement('div');
      actions.className = 'theme-card-actions';
      addThemeAction(actions, theme.id === appState.activeThemeId ? 'Applied' : 'Apply', () => {
        applyComponentTheme(theme);
        showToast(`Applied “${theme.name}”.`, 'success');
      }, theme.id === appState.activeThemeId ? 'btn btn-secondary btn-small' : 'btn btn-primary btn-small');
      addThemeAction(actions, 'Duplicate', () => {
        try {
          const copyTheme = saveCustomTheme(duplicateTheme(theme));
          customThemes = loadCustomThemes();
          renderThemeManager();
          showToast(`Created editable copy “${copyTheme.name}”.`, 'success');
        } catch (error) { showToast(error.message, 'error'); }
      });
      addThemeAction(actions, 'Set Default', () => {
        try {
          defaultThemeId = saveDefaultThemeId(theme.id);
          renderThemeManager();
          showToast(`“${theme.name}” is now the default theme.`, 'success');
        } catch (error) { showToast(error.message, 'error'); }
      });
      if (!theme.isBuiltIn && !theme.isLocked) {
        addThemeAction(actions, 'Rename', async () => {
          const nextName = await openPromptDialog({ title: 'Rename Theme', label: 'Theme Name', initialValue: theme.name, confirmLabel: 'Rename' });
          if (nextName === null) return;
          try {
            const renamed = saveCustomTheme(renameCustomTheme(theme, nextName));
            customThemes = loadCustomThemes();
            if (appState.activeThemeId === renamed.id) appState.activeTheme = structuredClone(renamed);
            renderThemeManager();
            updateThemeSourceIndicators();
            showToast('Theme renamed.', 'success');
          } catch (error) { showToast(error.message, 'error'); }
        });
        addThemeAction(actions, 'Delete', async () => {
          const confirmed = await openConfirmDialog({ title: 'Delete Theme', message: `Delete “${theme.name}”? This cannot be undone.`, confirmLabel: 'Delete', danger: true });
          if (!confirmed) return;
          try {
            deleteCustomTheme(theme.id);
            customThemes = loadCustomThemes();
            defaultThemeId = loadDefaultThemeId();
            if (appState.activeThemeId === theme.id) {
              const fallback = getAvailableThemes().find(item => item.id === defaultThemeId)
                || BUILT_IN_THEMES.find(item => item.id === DEFAULT_THEME_ID);
              applyComponentTheme(fallback);
            } else renderThemeManager();
            showToast(`Deleted “${theme.name}”.`, 'success');
            updateStorageMeter();
          } catch (error) { showToast(error.message, 'error'); }
        });
      }
      body.append(heading, meta, description, actions);
      card.append(preview, body);
      themeCards.appendChild(card);
    });
    renderContrastReport();
  }

  function downloadTheme(theme) {
    const blob = new Blob([serializeTheme(theme)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'component-theme'}.theme.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.getElementById('btn-save-current-theme').addEventListener('click', async () => {
    const name = await openPromptDialog({ title: 'Save Theme', label: 'Theme Name', initialValue: `${appState.activeTheme.name} Custom`, confirmLabel: 'Save' });
    if (name === null) return;
    try {
      const theme = saveCustomTheme(createThemeFromCurrentStyling(name, appState.activeTheme, appState.componentOverrides));
      customThemes = loadCustomThemes();
      applyComponentTheme(theme, { clearOverrides: true });
      showToast(`Saved “${theme.name}”.`, 'success');
    } catch (error) { showToast(error.message, 'error'); }
  });
  document.getElementById('btn-import-theme').addEventListener('click', () => importThemeFile.click());
  importThemeFile.addEventListener('change', async () => {
    const file = importThemeFile.files?.[0];
    if (!file) return;
    try {
      const imported = saveCustomTheme(importThemeJson(await file.text()));
      customThemes = loadCustomThemes();
      applyComponentTheme(imported, { clearOverrides: true });
      showToast(`Imported “${imported.name}”.`, 'success');
    } catch (error) { showToast(`Theme import failed: ${error.message}`, 'error', 6000); }
    finally { importThemeFile.value = ''; }
  });
  document.getElementById('btn-export-theme').addEventListener('click', () => downloadTheme(appState.activeTheme));
  document.getElementById('btn-reset-active-theme').addEventListener('click', () => {
    const fallback = getAvailableThemes().find(theme => theme.id === defaultThemeId)
      || BUILT_IN_THEMES.find(theme => theme.id === DEFAULT_THEME_ID);
    applyComponentTheme(fallback, { clearOverrides: true });
    showToast(`Reset to “${fallback.name}” with no component overrides.`, 'success');
  });
  document.getElementById('btn-reset-component-overrides').addEventListener('click', () => {
    appState.componentOverrides = {};
    syncResolvedThemeConfig();
    syncEditorControls();
    updateLivePreview();
    showToast('Component overrides reset to theme values.', 'success');
  });

  // ==========================================
  // ROUTING & NAVIGATION
  // ==========================================
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      const category = item.getAttribute('data-category');
      appState.activeCategory = category;
      
      // Clear search
      searchInput.value = '';
      appState.searchQuery = '';
      
      // Go back to catalog view
      showState('catalog');
      renderCatalog();
    });
  });

  searchInput.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value.toLowerCase();
    
    // Ensure we are on the catalog view when searching
    showState('catalog');
    renderCatalog();
  });

  function showState(state) {
    if (state === 'catalog') {
      catalogState.style.display = 'flex';
      editorState.style.display = 'none';
    } else if (state === 'editor') {
      catalogState.style.display = 'none';
      editorState.style.display = 'flex';
      // Switch editor tabs back to the first 'content' tab
      switchEditorTab('content');
    }
  }

  // ==========================================
  // CATALOG RENDERING
  // ==========================================
  function renderCatalog() {
    componentsGrid.innerHTML = '';
    
    const filtered = filterCatalog(componentCatalog, appState);

    if (filtered.length === 0) {
      componentsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1/-1; text-align: center; padding: 48px; background-color: var(--bg-panel); border-radius: 12px; border: 1px dashed var(--border-color);">
          <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
          <h4 style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">No Components Found</h4>
          <p style="font-size: 13px; color: var(--text-muted);">Try a different query or select another category from the sidebar.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(comp => {
      componentsGrid.appendChild(createCatalogCard(comp, loadComponentToEditor));
    });
  }

  // ==========================================
  // COMPONENT LOADER & EDITOR STATE
  // ==========================================
  function loadComponentToEditor(component) {
    appState.currentProjectId = null;
    appState.currentProjectName = '';
    appState.selectedComponent = component;
    
    activeComponentTitle.innerText = component.title;
    activeComponentCategory.innerText = component.category.toUpperCase();
    
    // Sync block text items with defaults/reset if needed
    inputBlockTitle.value = component.title.toUpperCase();
    inputBlockHeadline.value = `Explore details about ${component.title}`;
    
    appState.config.blockTitle = inputBlockTitle.value;
    appState.config.blockHeadline = inputBlockHeadline.value;
    
    // Set Favorites icon look
    if (appState.favorites.has(component.id)) {
      btnFavoriteToggle.classList.add('favorited');
    } else {
      btnFavoriteToggle.classList.remove('favorited');
    }
    
    // Setup component-specific default fields
    setupComponentFields(component.id);
    (component.editorSchema?.componentFields || []).forEach(field => {
      appState.config[field.id] = structuredClone(field.default ?? '');
    });
    applyMissingSchemaDefaults(component);
    syncResolvedThemeConfig();
    
    // Render dynamic item list inputs
    renderDynamicItems();

    // Show Editor Layout
    showState('editor');
    
    // Force live preview frame refresh
    updateLivePreview();
  }

  function setupComponentFields(id) {
    const modularComponent = componentRegistry[id];
    if (modularComponent) {
      appState.config.items = structuredClone(modularComponent.defaultConfig.items);
      Object.entries(modularComponent.defaultConfig).forEach(([key, value]) => {
        if (key !== 'items') appState.config[key] = structuredClone(value);
      });
      return;
    }

    // Generate specialized items for the remaining legacy components.
    if (id === 'horizontal-timeline') {
      appState.config.items = [
        { title: 'Phase 1: Research', content: 'Collect data assets, requirements, and verify targets.' },
        { title: 'Phase 2: Build Layout', content: 'Configure colors, fonts, margins, and borders in the tool.' },
        { title: 'Phase 3: Export HTML', content: 'Copy custom block and import inside Articulate Rise blocks.' }
      ];
    } else if (id === 'hotspots') {
      appState.config.items = [
        { title: 'Engine Valve', content: 'Manages the fuel-air mixture entry.', x: '25', y: '40' },
        { title: 'Spark Plug', content: 'Triggers the combustion spark.', x: '50', y: '25' },
        { title: 'Piston Rod', content: 'Transmits linear force to rotational crankshaft torque.', x: '75', y: '65' }
      ];
    } else if (id === 'button-list') {
      appState.config.items = [
        { title: 'Launch Resource Hub', content: 'https://community.articulate.com' },
        { title: 'Download User Manual', content: 'https://github.com' }
      ];
    } else if (id === 'menu-list') {
      appState.config.items = [
        { title: 'Module 1: Getting Started', content: 'Introduction and setup basics.' },
        { title: 'Module 2: Advanced Design', content: 'Explore layouts, shadows, and spacing.' },
        { title: 'Module 3: Code Exporting', content: 'Embedding components inside SCORM courses.' }
      ];
    } else if (id === 'sorting-activity') {
      appState.config.items = [
        { title: 'Vibrant Colors', content: 'Design System', category: 'Design' },
        { title: 'Click Triggers', content: 'Interaction Logic', category: 'Logic' },
        { title: 'Rounded Corners', content: 'Design System', category: 'Design' },
        { title: 'Theme Toggles', content: 'Interaction Logic', category: 'Logic' }
      ];
    } else if (id === 'fill-blank') {
      appState.config.items = [
        { title: 'Articulate Rise uses [blank] to display custom interactive content.', content: 'iframes' },
        { title: 'To keep web builds lightweight, use [blank] CSS styles.', content: 'vanilla' }
      ];
    } else if (id === 'process-flow') {
      appState.config.items = [
        { title: 'Define Objectives', content: 'Align course content with measurable learner metrics.' },
        { title: 'Create Visual Wireframes', content: 'Draft templates in the Rise Component Builder UI.' },
        { title: 'Export SCORM Pack', content: 'Zip files and deploy directly inside the Rise lesson LMS.' }
      ];
    } else if (id === 'scenario') {
      appState.config.items = [
        { title: 'How should you write interactive eLearning scripts?', content: 'Short and conversational' },
        { title: 'Choice A: Write dense documents.', content: 'Character: "That makes learning boring!" (Incorrect)' },
        { title: 'Choice B: Write conversational steps.', content: 'Character: "Spot on! Keeps learners hooked!" (Correct)' }
      ];
    } else if (id === 'profile-cards') {
      appState.config.items = [
        { title: 'Sarah Jenkins', content: 'Lead Instructional Designer • Dedicated to creating engaging eLearning pathways.' },
        { title: 'Marcus Chen', content: 'UX Engineer • Expert in web layout rendering and responsive CSS frameworks.' }
      ];
    } else if (id === 'info-grid') {
      appState.config.items = [
        { title: 'SaaS Aesthetic', content: 'Vibrant custom colors, layered shadows, and large margins.' },
        { title: 'Fully Serverless', content: 'Direct srcdoc codes containing styles and scripts.' },
        { title: 'Responsive Shell', content: 'Adaptive grid layout structures for all target screens.' }
      ];
    } else if (id === 'pricing-comparison') {
      appState.config.items = [
        { title: 'Starter Plan', content: '1 User • 5 Components/mo • Community Support' },
        { title: 'Professional', content: 'Unlimited Builders • 20 Components/mo • Priority Support' },
        { title: 'Enterprise Suite', content: 'Custom Domains • Unlimited Builders • Dedicated Success Agent' }
      ];
    } else if (id === 'audio-player') {
      appState.config.items = [
        { title: 'Introduction Podcast (Audio Clip)', content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
      ];
    } else if (id === 'video-frame') {
      appState.config.items = [
        { title: 'Rise Builder Workspace Walkthrough', content: 'https://www.w3schools.com/html/mov_bbb.mp4' }
      ];
    } else if (id === 'image-gallery') {
      appState.config.items = [
        { title: 'Workspace Design System', content: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800' },
        { title: 'User Layout Journey', content: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800' }
      ];
    } else if (id === 'ai-generator') {
      appState.config.items = [
        { title: 'AI Branching Dialogue Prompt', content: 'Generate a customer conflict scenario for retail checkout.' }
      ];
    } else if (id === 'ai-quiz-maker') {
      appState.config.items = [
        { title: 'AI Assessment Topic Prompt', content: 'Create a 5-question multiple choice quiz on Cyber Security basics.' }
      ];
    } else {
      // Default Accordion structure
      appState.config.items = [
        { title: 'Understanding User Intent', content: 'Instructional design begins by identifying the core learning objectives and alignment with business outcomes.' },
        { title: 'Designing for Engagement', content: 'Modern eLearning relies on micro-interactions, clean visual layouts, and bite-sized chunks of information.' },
        { title: 'SCORM and Tracking Analytics', content: 'Export clean standard elements to trace course completion, custom interaction states, and score cards.' }
      ];
    }
  }

  function applyMissingSchemaDefaults(component) {
    const schema = component?.editorSchema;
    if (!schema) return;
    (schema.componentFields || []).forEach(field => {
      if (appState.config[field.id] === undefined) appState.config[field.id] = structuredClone(field.default ?? '');
    });
    appState.config.items.forEach(item => schema.itemFields.forEach(field => {
      if (item[field.id] === undefined) item[field.id] = structuredClone(field.default ?? '');
    }));
  }

  btnBackToCatalog.addEventListener('click', () => {
    showState('catalog');
    renderCatalog();
  });

  // Favorite toggle
  btnFavoriteToggle.addEventListener('click', () => {
    if (!appState.selectedComponent) return;
    
    const id = appState.selectedComponent.id;
    if (appState.favorites.has(id)) {
      appState.favorites.delete(id);
      btnFavoriteToggle.classList.remove('favorited');
    } else {
      appState.favorites.add(id);
      btnFavoriteToggle.classList.add('favorited');
    }
    
    updateFavoritesBadge();
    try { saveFavorites(appState.favorites); }
    catch (error) { showToast(error.message, 'error'); }
    
    if (appState.activeCategory === 'favorites') {
      renderCatalog();
    }
  });

  function updateFavoritesBadge() {
    favoritesCountBadge.innerText = appState.favorites.size;
  }

  function formatStorageBytes(bytes) {
    if (!Number.isFinite(bytes)) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
  }

  async function updateStorageMeter() {
    const label = document.getElementById('storage-usage-label');
    const bar = document.getElementById('storage-progress-bar');
    const track = bar?.closest('.storage-bar');
    if (!label || !bar || !track) return;

    if (!navigator.storage?.estimate) {
      label.textContent = 'Usage unavailable';
      bar.style.width = '0%';
      track.setAttribute('aria-valuenow', '0');
      return;
    }

    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      if (!quota) {
        label.textContent = 'Usage unavailable';
        bar.style.width = '0%';
        track.setAttribute('aria-valuenow', '0');
        return;
      }
      const percent = Math.min(100, Math.round((usage / quota) * 100));
      label.textContent = `${percent}% Used`;
      label.title = `${formatStorageBytes(usage)} of ${formatStorageBytes(quota)} used`;
      bar.style.width = `${percent}%`;
      track.setAttribute('aria-valuenow', String(percent));
      track.setAttribute('aria-label', `Local browser storage used: ${formatStorageBytes(usage)} of ${formatStorageBytes(quota)}`);
    } catch {
      label.textContent = 'Usage unavailable';
      bar.style.width = '0%';
      track.setAttribute('aria-valuenow', '0');
    }
  }

  // ==========================================
  // EDITOR TABS SWITCHING
  // ==========================================
  editorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      switchEditorTab(tabId);
    });
  });

  function switchEditorTab(tabId) {
    activateEditorTab(tabId, editorTabs, tabPanes);
  }

  // ==========================================
  // CONFIGURATION SYNC LISTENERS
  // ==========================================
  function setupFormListeners() {
    // 1. Text Inputs
    const syncText = (elem, stateKey) => {
      elem.addEventListener('input', (e) => {
        appState.config[stateKey] = e.target.value;
        updateLivePreview();
      });
    };
    
    syncText(inputBlockTitle, 'blockTitle');
    syncText(inputBlockHeadline, 'blockHeadline');
    syncText(inputBlockDesc, 'blockDesc');
    syncText(inputCompletionMsg, 'completionMsg');

    // 2. Color Sync (Picker <-> Text Input)
    const syncColor = (picker, text, stateKey) => {
      const overrideKey = {
        colorPrimary: 'primary', colorAccent: 'accent', colorBg: 'background', colorText: 'text'
      }[stateKey];
      picker.addEventListener('input', (e) => {
        text.value = e.target.value.toUpperCase();
        setComponentOverride(overrideKey, e.target.value);
      });
      
      text.addEventListener('input', (e) => {
        let val = e.target.value;
        if (val.match(/^#[0-9A-F]{6}$/i)) {
          picker.value = val;
          setComponentOverride(overrideKey, val);
        }
      });
    };

    syncColor(inputColorPrimary, inputColorPrimaryText, 'colorPrimary');
    syncColor(inputColorAccent, inputColorAccentText, 'colorAccent');
    syncColor(inputColorBg, inputColorBgText, 'colorBg');
    syncColor(inputColorText, inputColorTextText, 'colorText');

    // 3. Range Sliders
    inputBorderRadius.addEventListener('input', (e) => {
      radiusVal.innerText = `${e.target.value}px`;
      setComponentOverride('borderRadius', Number(e.target.value));
    });

    // 4. Select dropdowns
    selectShadow.addEventListener('change', (e) => {
      setComponentOverride('shadow', e.target.value);
    });

    selectComponentFont.addEventListener('change', (e) => setComponentOverride('fontFamily', e.target.value));

    selectIconStyle.addEventListener('change', (e) => {
      appState.config.iconStyle = e.target.value;
      updateLivePreview();
    });

    // 5. Checkboxes
    const syncCheckbox = (checkbox, stateKey) => {
      checkbox.addEventListener('change', (e) => {
        appState.config[stateKey] = e.target.checked;
        updateLivePreview();
      });
    };

    syncCheckbox(inputBorderEnable, 'borderOutline');
    syncCheckbox(inputBehaviorAccordionMulti, 'accordionMulti');
    syncCheckbox(inputBehaviorAccordionAnimation, 'accordionAnimation');
    syncCheckbox(inputTrackCompletion, 'trackCompletion');
  }

  // ==========================================
  // DYNAMIC ITEM EDITING
  // ==========================================
  const schemaItemEditor = createSchemaItemEditor({
    container: dynamicItemsContainer,
    onChange: updateLivePreview
  });

  function renderDynamicItems() {
    const schema = appState.selectedComponent?.editorSchema || componentCatalog[0].editorSchema;
    schemaItemEditor.render({ schema, items: appState.config.items, config: appState.config, limits: resolveMediaLimits(appState.settings.mediaLimitsMb) });
  }

  btnAddItem.addEventListener('click', () => {
    const schema = appState.selectedComponent?.editorSchema || componentCatalog[0].editorSchema;
    addEditorItem(appState, schema);
    renderDynamicItems();
    updateLivePreview();
  });

  // ==========================================
  // DEVICE VIEWPORT CONTROLS
  // ==========================================
  deviceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const device = btn.getAttribute('data-device');
      
      // Remove all sizes
      previewViewport.classList.remove('desktop', 'tablet', 'mobile');
      // Add new size
      previewViewport.classList.add(device);
    });
  });

  btnPreviewRefresh.addEventListener('click', () => {
    const spinner = btnPreviewRefresh.querySelector('svg');
    spinner.style.transform = 'rotate(360deg)';
    spinner.style.transition = 'transform 0.6s ease';
    
    setTimeout(() => {
      spinner.style.transform = 'rotate(0deg)';
      spinner.style.transition = 'none';
    }, 600);
    
    updateLivePreview();
  });

  btnPreviewPopout.addEventListener('click', () => {
    openPreview(generateIframeContent());
  });

  // ==========================================
  // MODALS HANDLING
  // ==========================================
  let saveDialogMode = 'save';
  let renameTargetId = null;
  let modalStack = [];
  const modalFocusReturn = new Map();
  const modalDefaultSettlers = new Map();

  function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (!modalFocusReturn.has(id)) modalFocusReturn.set(id, document.activeElement);
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modalStack = modalStack.filter(existing => existing !== id);
    modalStack.push(id);
    const focusable = getFocusableElements(modal.querySelector('.modal-card'));
    (focusable[0] || modal.querySelector('.modal-card'))?.focus();
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modalStack = modalStack.filter(existing => existing !== id);
    const trigger = modalFocusReturn.get(id);
    modalFocusReturn.delete(id);
    if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) trigger.focus();
    const settleAsDismissed = modalDefaultSettlers.get(id);
    if (settleAsDismissed) {
      modalDefaultSettlers.delete(id);
      settleAsDismissed();
    }
  }

  function openConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
    return new Promise(resolve => {
      document.getElementById('modal-confirm-title').textContent = title;
      document.getElementById('modal-confirm-message').textContent = message;
      const confirmBtn = document.getElementById('btn-confirm-dialog-action');
      const cancelBtn = document.getElementById('btn-confirm-dialog-cancel');
      confirmBtn.textContent = confirmLabel;
      confirmBtn.classList.toggle('btn-danger', danger);
      confirmBtn.classList.toggle('btn-primary', !danger);
      cancelBtn.textContent = cancelLabel;

      let settled = false;
      const settle = value => {
        if (settled) return;
        settled = true;
        confirmBtn.removeEventListener('click', onConfirm);
        resolve(value);
      };
      const onConfirm = () => {
        settle(true);
        closeModal('modal-confirm');
      };
      confirmBtn.addEventListener('click', onConfirm);
      modalDefaultSettlers.set('modal-confirm', () => settle(false));
      openModal('modal-confirm');
    });
  }

  function openPromptDialog({ title, message = '', label, initialValue = '', placeholder = '', confirmLabel = 'Save' }) {
    return new Promise(resolve => {
      document.getElementById('modal-prompt-title').textContent = title;
      const messageEl = document.getElementById('modal-prompt-message');
      messageEl.textContent = message;
      messageEl.hidden = !message;
      document.getElementById('modal-prompt-label').textContent = label;
      const input = document.getElementById('modal-prompt-input');
      input.value = initialValue;
      input.placeholder = placeholder;
      const confirmBtn = document.getElementById('btn-prompt-dialog-action');
      confirmBtn.textContent = confirmLabel;

      let settled = false;
      const settle = value => {
        if (settled) return;
        settled = true;
        confirmBtn.removeEventListener('click', onConfirm);
        input.removeEventListener('keydown', onKeydown);
        resolve(value);
      };
      const onConfirm = () => {
        settle(input.value);
        closeModal('modal-prompt');
      };
      const onKeydown = event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onConfirm();
        }
      };
      confirmBtn.addEventListener('click', onConfirm);
      input.addEventListener('keydown', onKeydown);
      modalDefaultSettlers.set('modal-prompt', () => settle(null));
      openModal('modal-prompt');
      input.focus();
      input.select();
    });
  }

  document.addEventListener('keydown', event => {
    if (!modalStack.length) return;
    const topId = modalStack[modalStack.length - 1];
    const modal = document.getElementById(topId);
    if (!modal) return;
    const card = modal.querySelector('.modal-card');

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(topId);
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusableElements(card);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !card.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !card.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function syncSettingsControls() {
    document.getElementById('settings-default-font').value = appState.settings.defaultFont;
    document.getElementById('settings-export-format').value = appState.settings.exportFormat;
    document.getElementById('settings-enable-autosave').checked = appState.settings.autosave;
    document.getElementById('settings-enable-ai').checked = appState.settings.aiEnabled;
    document.getElementById('settings-limit-image').value = appState.settings.mediaLimitsMb.image;
    document.getElementById('settings-limit-audio').value = appState.settings.mediaLimitsMb.audio;
    document.getElementById('settings-limit-video').value = appState.settings.mediaLimitsMb.video;
    document.getElementById('settings-limit-svg').value = appState.settings.mediaLimitsMb.svg;
  }

  function syncEditorControls() {
    syncResolvedThemeConfig();
    const config = appState.config;
    inputBlockTitle.value = config.blockTitle;
    inputBlockHeadline.value = config.blockHeadline;
    inputBlockDesc.value = config.blockDesc;
    [[inputColorPrimary, inputColorPrimaryText, 'colorPrimary'], [inputColorAccent, inputColorAccentText, 'colorAccent'],
      [inputColorBg, inputColorBgText, 'colorBg'], [inputColorText, inputColorTextText, 'colorText']]
      .forEach(([picker, text, key]) => { picker.value = config[key]; text.value = config[key].toUpperCase(); });
    inputBorderRadius.value = config.borderRadius;
    radiusVal.innerText = `${config.borderRadius}px`;
    selectShadow.value = config.shadowDepth;
    selectComponentFont.value = config.themeTokens.fontFamily;
    inputBorderEnable.checked = config.borderOutline;
    inputBehaviorAccordionMulti.checked = config.accordionMulti;
    inputBehaviorAccordionAnimation.checked = config.accordionAnimation;
    selectIconStyle.value = config.iconStyle;
    inputTrackCompletion.checked = config.trackCompletion;
    inputCompletionMsg.value = config.completionMsg;
    activeComponentTitle.innerText = appState.selectedComponent.title;
    activeComponentCategory.innerText = appState.selectedComponent.category.toUpperCase();
    btnFavoriteToggle.classList.toggle('favorited', appState.favorites.has(appState.selectedComponent.id));
    updateThemeSourceIndicators();
    renderDynamicItems();
  }

  async function applyProject(project, isDraft = false) {
    const component = componentCatalog.find(item => item.id === project.componentId);
    if (!component) {
      showToast(`Cannot open “${project.name}”: its component is not available.`, 'error');
      return false;
    }
    resetConfig();
    appState.config = { ...appState.config, ...structuredClone(project.config), items: structuredClone(project.config.items) };
    appState.currentProjectId = getProject(project.id) ? project.id : null;
    appState.currentProjectName = project.name;
    appState.selectedComponent = component;
    applyMissingSchemaDefaults(component);
    const mediaRestore = await restoreMediaReferences(appState.config);
    appState.settings = { ...project.settings };
    appState.activeTheme = structuredClone(project.theme);
    appState.activeThemeId = project.theme.id;
    appState.componentOverrides = normalizeComponentOverrides(project.componentOverrides);
    appState.uiTheme = project.uiTheme;
    syncResolvedThemeConfig();
    setUiTheme(project.uiTheme);
    syncSettingsControls();
    syncEditorControls();
    showState('editor');
    updateLivePreview();
    if (mediaRestore.missing.length) {
      showToast(`${mediaRestore.missing.length} uploaded media file${mediaRestore.missing.length === 1 ? ' is' : 's are'} missing from this browser.`, 'warning', 6000);
    }
    if (!isDraft) saveCurrentDraft();
    return true;
  }

  function buildCurrentProject(name, asNew = false) {
    if (!appState.selectedComponent) throw new Error('Choose a component before saving.');
    const existing = !asNew && appState.currentProjectId ? getProject(appState.currentProjectId) : null;
    return buildProject({
      id: existing?.id,
      createdAt: existing?.createdAt,
      name,
      componentId: appState.selectedComponent.id,
      config: appState.config,
      activeTheme: appState.activeTheme,
      componentOverrides: appState.componentOverrides,
      uiTheme: appState.uiTheme,
      settings: appState.settings
    });
  }

  function collectValidationErrors() {
    const schema = appState.selectedComponent?.editorSchema;
    if (!schema) return [];
    const items = Array.isArray(appState.config.items) ? appState.config.items : [];
    const errors = [];

    if (items.length < (schema.minItems || 0)) {
      errors.push(`Add at least ${schema.minItems} ${schema.itemLabel.toLowerCase()}${schema.minItems === 1 ? '' : 's'}.`);
    }
    (schema.componentFields || []).forEach(field => {
      errors.push(...validateSchemaField(field, appState.config[field.id], items));
    });
    items.forEach((item, index) => {
      (schema.itemFields || []).forEach(field => {
        validateSchemaField(field, item[field.id], items)
          .forEach(message => errors.push(`${schema.itemLabel} ${index + 1}: ${message}`));
      });
    });

    const componentResult = validateActiveComponent(appState, componentRegistry);
    if (!componentResult.valid) errors.push(...componentResult.errors);

    return errors;
  }

  function openSaveDialog(mode = 'save', projectId = null) {
    saveDialogMode = mode;
    renameTargetId = projectId;
    const isRename = mode === 'rename';
    const target = isRename ? getProject(projectId) : null;
    saveModalTitle.textContent = isRename ? 'Rename Project' : 'Save Project';
    saveNameInput.value = target?.name || appState.currentProjectName || appState.selectedComponent?.title || '';
    document.getElementById('btn-confirm-save').textContent = isRename ? 'Rename' : 'Save';
    btnConfirmSaveAs.style.display = isRename ? 'none' : '';
    openModal('modal-save');
    saveNameInput.focus();
    saveNameInput.select();
  }

  function performSave(asNew) {
    const name = saveNameInput.value.trim();
    if (!name) {
      showToast('Enter a project name.', 'error');
      saveNameInput.focus();
      return;
    }
    try {
      const saved = saveProject(buildCurrentProject(name, asNew));
      appState.currentProjectId = saved.id;
      appState.currentProjectName = saved.name;
      saveDraft(saved);
      closeModal('modal-save');
      showToast(`Saved “${saved.name}”.`, 'success');
      updateStorageMeter();
      const accessibilityWarnings = validateMediaAccessibility(appState.config, appState.selectedComponent.id);
      if (accessibilityWarnings.length) showToast(accessibilityWarnings[0], 'warning', 6000);
    } catch (error) {
      showToast(error.message, 'error', 5000);
    }
  }

  function renderStoredProjects() {
    savedComponentsList.innerHTML = '';
    const projects = loadProjects();
    if (!projects.length) {
      const empty = document.createElement('div');
      empty.className = 'saved-components-empty';
      empty.textContent = 'No saved projects yet. Save a component or import a project JSON file.';
      savedComponentsList.appendChild(empty);
      return;
    }

    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = `saved-component-card${project.id === appState.currentProjectId ? ' active-card' : ''}`;
      const details = document.createElement('div');
      details.className = 'sc-details';
      const name = document.createElement('div');
      name.className = 'sc-name';
      name.textContent = project.name;
      const meta = document.createElement('div');
      meta.className = 'sc-meta';
      const component = componentCatalog.find(item => item.id === project.componentId);
      meta.textContent = `Modified: ${new Date(project.updatedAt).toLocaleString()} • ${component?.title || project.componentId}`;
      details.append(name, meta);

      const actions = document.createElement('div');
      actions.className = 'sc-actions';
      const addAction = (label, handler) => {
        const button = document.createElement('button');
        button.className = 'btn btn-text btn-small';
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', handler);
        actions.appendChild(button);
      };
      addAction('Load', async () => {
        if (await applyProject(project)) {
          closeModal('modal-open');
          showToast(`Opened “${project.name}”.`, 'success');
        }
      });
      addAction('Rename', () => openSaveDialog('rename', project.id));
      addAction('Duplicate', () => {
        try { duplicateProject(project.id); renderStoredProjects(); showToast('Project duplicated.', 'success'); }
        catch (error) { showToast(error.message, 'error'); }
      });
      addAction('Export JSON', () => downloadProjectJson(project));
      addAction('Delete', async () => {
        const confirmed = await openConfirmDialog({ title: 'Delete Project', message: `Delete “${project.name}”? This cannot be undone.`, confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        try {
          deleteProject(project.id);
          if (appState.currentProjectId === project.id) appState.currentProjectId = null;
          renderStoredProjects();
          showToast(`Deleted “${project.name}”.`, 'success');
          updateStorageMeter();
        } catch (error) { showToast(error.message, 'error'); }
      });
      card.append(details, actions);
      savedComponentsList.appendChild(card);
    });
  }

  document.getElementById('btn-new').addEventListener('click', () => {
    clearDraft();
    resetConfig();
    const defaultTheme = getAvailableThemes().find(theme => theme.id === defaultThemeId)
      || BUILT_IN_THEMES.find(theme => theme.id === DEFAULT_THEME_ID);
    appState.activeThemeId = defaultTheme.id;
    appState.activeTheme = structuredClone(defaultTheme);
    appState.componentOverrides = {};
    syncResolvedThemeConfig();
    appState.currentProjectId = null;
    appState.currentProjectName = '';
    appState.selectedComponent = null;
    releaseAllMediaObjectURLs();
    showState('catalog');
    renderCatalog();
    showToast('New project started. Choose a component to begin.', 'success');
  });

  document.getElementById('btn-open').addEventListener('click', () => {
    renderStoredProjects();
    openModal('modal-open');
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    const validationErrors = collectValidationErrors();
    if (validationErrors.length) {
      switchEditorTab('content');
      showToast(validationErrors[0], 'error', 6000);
      return;
    }
    openSaveDialog('save');
  });

  document.getElementById('btn-import-project').addEventListener('click', () => importProjectFile.click());
  importProjectFile.addEventListener('change', async () => {
    const file = importProjectFile.files?.[0];
    if (!file) return;
    try {
      const imported = importProjectJson(await file.text());
      renderStoredProjects();
      showToast(`Imported “${imported.name}”.`, 'success');
    } catch (error) {
      showToast(`Import failed: ${error.message}`, 'error', 6000);
    } finally {
      importProjectFile.value = '';
    }
  });

  // Setup modal clicks
  Object.keys(modalTriggers).forEach(btnId => {
    const triggerBtn = document.getElementById(btnId);
    const modalId = modalTriggers[btnId];
    const modalElem = document.getElementById(modalId);
    
    if (triggerBtn && modalElem) {
      triggerBtn.addEventListener('click', () => {
        
        // Dynamic loading setup for Export modal
        if (modalId === 'modal-export') {
          setupExportModalContent();
        }
        if (modalId === 'modal-settings') syncSettingsControls();
        if (modalId === 'modal-theme-manager') renderThemeManager();

        openModal(modalId);
      });
    }
  });

  // Close modals
  modalOverlays.forEach(overlay => {
    const closeBtns = overlay.querySelectorAll('.modal-close-btn, .modal-cancel-btn');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(overlay.id);
      });
    });
  });

  const btnConfirmSave = document.getElementById('btn-confirm-save');
  btnConfirmSave.addEventListener('click', () => {
    if (saveDialogMode === 'rename') {
      const name = saveNameInput.value.trim();
      if (!name) return showToast('Enter a project name.', 'error');
      try {
        renameProject(renameTargetId, name);
        if (appState.currentProjectId === renameTargetId) {
          appState.currentProjectName = name;
          saveCurrentDraft();
        }
        closeModal('modal-save');
        renderStoredProjects();
        showToast('Project renamed.', 'success');
      }
      catch (error) { showToast(error.message, 'error'); }
      return;
    }
    performSave(false);
  });
  btnConfirmSaveAs.addEventListener('click', () => performSave(true));

  // Settings Save
  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const selectFont = document.getElementById('settings-default-font');
      const selectExport = document.getElementById('settings-export-format');
      const checkAutosave = document.getElementById('settings-enable-autosave');
      const checkAi = document.getElementById('settings-enable-ai');
      const limitImage = document.getElementById('settings-limit-image');
      const limitAudio = document.getElementById('settings-limit-audio');
      const limitVideo = document.getElementById('settings-limit-video');
      const limitSvg = document.getElementById('settings-limit-svg');

      try {
        appState.settings = saveSettings({
          defaultFont: selectFont.value,
          exportFormat: selectExport.value,
          autosave: checkAutosave.checked,
          aiEnabled: checkAi.checked,
          mediaLimitsMb: {
            image: Number(limitImage.value),
            audio: Number(limitAudio.value),
            video: Number(limitVideo.value),
            svg: Number(limitSvg.value)
          }
        });
        syncSettingsControls();
        if (!appState.settings.autosave) clearDraft();
        else saveCurrentDraft();
        showToast('Settings applied successfully.', 'success');
        closeModal('modal-settings');
        renderDynamicItems();
        updateLivePreview();
      } catch (error) {
        showToast(error.message, 'error', 5000);
      }
    });
  }

  // Export Tab Toggle Options
  const exportTabs = document.querySelectorAll('.export-tab');
  const exportPanes = document.querySelectorAll('.export-pane');
  exportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      exportTabs.forEach(t => t.classList.remove('active'));
      exportPanes.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const paneId = `pane-export-${tab.getAttribute('data-export-type')}`;
      document.getElementById(paneId).classList.add('active');
    });
  });

  // Code Copy Buttons
  setupCopyBtn('btn-copy-iframe', 'export-iframe-code');
  setupCopyBtn('btn-copy-html', 'export-html-code');

  function setupCopyBtn(btnId, targetId) {
    const btn = document.getElementById(btnId);
    const target = document.getElementById(targetId);
    if (btn && target) {
      btn.addEventListener('click', async () => {
        const code = target.textContent || '';
        const originalText = btn.textContent;
        btn.disabled = true;

        try {
          await copyTextToClipboard(code);
          btn.textContent = 'Copied!';
          btn.classList.add('copy-success');
          showToast('Code copied to the clipboard.', 'success');
        } catch (error) {
          btn.textContent = 'Copy failed';
          btn.classList.add('copy-error');
          showToast(error.message, 'error', 6000);
        }

        window.setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copy-success', 'copy-error');
          btn.disabled = false;
        }, 2000);
      });
    }
  }

  let currentExportBundle = null;
  async function prepareCurrentExport() {
    const prepared = await prepareMediaExport(appState.config);
    const exportState = { ...appState, config: prepared.config };
    const html = compilePreview(exportState, componentRegistry, colorToRgba);
    return { html, assets: prepared.assets, ...buildExportPayload(html, prepared) };
  }

  async function setupExportModalContent() {
    const warningBox = document.getElementById('export-media-warning');
    const manifestCode = document.getElementById('export-asset-manifest');
    if (warningBox) { warningBox.hidden = false; warningBox.textContent = 'Preparing media export…'; }
    try {
      currentExportBundle = await prepareCurrentExport();
    } catch (error) {
      currentExportBundle = null;
      if (warningBox) warningBox.textContent = `Export preparation failed: ${error.message}`;
      showToast(`Export preparation failed: ${error.message}`, 'error', 6000);
      return;
    }
    const payload = currentExportBundle;
    
    // Iframe Embed Code using self-contained srcdoc
    const iframeCode = document.getElementById('export-iframe-code');
    iframeCode.textContent = payload.iframe;
    
    // Paste-friendly HTML fragment for custom HTML blocks
    const htmlCode = document.getElementById('export-html-code');
    htmlCode.textContent = payload.fragment;
    if (warningBox) {
      warningBox.hidden = payload.warnings.length === 0;
      warningBox.textContent = payload.warnings.join(' ');
    }
    if (manifestCode) manifestCode.textContent = JSON.stringify(payload.manifest, null, 2);
  }

  const btnDownloadHtml = document.getElementById('btn-download-html');
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener('click', async () => {
      const title = appState.selectedComponent?.title || 'rise-component';
      const bundle = await prepareCurrentExport();
      if (bundle.warnings.length) {
        currentExportBundle = bundle;
        showToast('Single-file export is blocked because one or more uploaded assets require separate files. Use ZIP asset preparation.', 'warning', 7000);
        return;
      }
      downloadHtml(title, bundle.html);
    });
  }

  const btnDownloadZip = document.getElementById('btn-download-zip');
  if (btnDownloadZip) {
    btnDownloadZip.addEventListener('click', async () => {
      const title = appState.selectedComponent?.title || 'rise-component';
      const bundle = currentExportBundle || await prepareCurrentExport();
      downloadAssetManifest(title, bundle.manifest);
      showToast('Asset manifest prepared. ZIP packaging is not implemented yet.', 'warning', 6000);
    });
  }

  // ==========================================
  // LIVE PREVIEW COMPILER & GENERATOR
  // ==========================================
  let draftTimer = null;

  function saveCurrentDraft() {
    if (!appState.settings.autosave || !appState.selectedComponent) return;
    try {
      const existing = appState.currentProjectId ? getProject(appState.currentProjectId) : null;
      saveDraft(buildProject({
        id: existing?.id || 'draft',
        createdAt: existing?.createdAt,
        name: appState.currentProjectName || appState.selectedComponent.title,
        componentId: appState.selectedComponent.id,
        config: appState.config,
        activeTheme: appState.activeTheme,
        componentOverrides: appState.componentOverrides,
        uiTheme: appState.uiTheme,
        settings: appState.settings
      }));
    } catch (error) {
      showToast(`Draft autosave failed: ${error.message}`, 'error', 5000);
    }
  }

  function scheduleDraftSave() {
    if (!appState.settings.autosave || !appState.selectedComponent) return;
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveCurrentDraft, 700);
  }

  function updateLivePreview() {
    if (!livePreviewIframe) return;
    currentExportBundle = null;
    pruneMediaObjectURLs(appState.config);
    validateActiveComponent(appState, componentRegistry);
    writePreview(livePreviewIframe, generateIframeContent());
    scheduleDraftSave();
  }

  // Run the initialization
  window.addEventListener('beforeunload', releaseAllMediaObjectURLs);
  await init();

});
