/* Rise Component Builder — Application Shell Logic */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const appState = {
    theme: localStorage.getItem('rise-builder-theme') || 'light',
    activeCategory: 'interactive',
    searchQuery: '',
    selectedComponent: null, // Component metadata when editing
    favorites: new Set(),
    settings: {
      defaultFont: 'Lato',
      exportFormat: 'web',
      autosave: true,
      aiEnabled: false
    },
    // Configuration values for active editor component
    config: {
      blockTitle: 'INTERACTIVE ACCORDION',
      blockHeadline: 'Explore the Core Dimensions',
      blockDesc: 'Click on the headers below to discover detailed insights.',
      colorPrimary: '#2563EB',
      colorAccent: '#F59E0B',
      colorBg: '#FFFFFF',
      colorText: '#1F2937',
      borderRadius: '12',
      shadowDepth: 'soft',
      borderOutline: true,
      accordionMulti: true,
      accordionAnimation: true,
      iconStyle: 'chevron',
      trackCompletion: false,
      completionMsg: 'Activity Complete!',
      items: [
        { title: 'Understanding User Intent', content: 'Instructional design begins by identifying the core learning objectives and alignment with business outcomes.' },
        { title: 'Designing for Engagement', content: 'Modern eLearning relies on micro-interactions, clean visual layouts, and bite-sized chunks of information.' },
        { title: 'SCORM and Tracking Analytics', content: 'Export clean standard elements to trace course completion, custom interaction states, and score cards.' }
      ]
    }
  };

  // ==========================================
  // DATABASE OF COMPONENT ARCHETYPES
  // ==========================================
  const componentCatalog = [
    {
      id: 'accordion',
      title: 'Responsive Accordion',
      desc: 'Collapsible vertically stacked headers. Best for structured concepts, FAQs, and expanding key details.',
      category: 'interactive',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line><polyline points="18 4 21 6 18 8"></polyline><polyline points="18 10 21 12 18 14"></polyline><polyline points="18 16 21 18 18 20"></polyline></svg>`
    },
    {
      id: 'flip-cards',
      title: '3D Flip Cards',
      desc: 'Interactive double-sided cards that flip on click. Great for definitions, vocabulary, and card drills.',
      category: 'interactive',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"></rect><rect x="14" y="3" width="7" height="18" rx="1"></rect></svg>`
    },
    {
      id: 'tab-blocks',
      title: 'Horizontal Tabs',
      desc: 'Clean tabbed layout switching content panels horizontally. Perfect for organizing multi-step topics.',
      category: 'interactive',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="3" x2="9" y2="9"></line></svg>`
    },
    {
      id: 'hotspots',
      title: 'Interactive Hotspots',
      desc: 'Place interactive click indicators over custom images to reveal explanatory tooltips and annotations.',
      category: 'interactive',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line></svg>`
    },
    {
      id: 'button-list',
      title: 'Quick Link Buttons',
      desc: 'Curated list of customized buttons directing learners to external resources or course milestones.',
      category: 'navigation',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line></svg>`
    },
    {
      id: 'menu-list',
      title: 'Secondary Menu Drawer',
      desc: 'Expandable sub-lesson links or glossary panels designed to sit natively inside your custom Rise blocks.',
      category: 'navigation',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`
    },
    {
      id: 'multiple-choice',
      title: 'Multiple Choice Check',
      desc: 'Self-correcting interactive knowledge check card. Supports feedback answers and custom status.',
      category: 'knowledge',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 12l2 2 4-4"></path></svg>`
    },
    {
      id: 'sorting-activity',
      title: 'Sorting Drag-and-Drop',
      desc: 'Let learners sort concept cards into category columns with instant matching indicator flags.',
      category: 'knowledge',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`
    },
    {
      id: 'fill-blank',
      title: 'Fill-in-the-Blank',
      desc: 'Interactive sentence checks. Great for verification of terminology, syntax, or statements.',
      category: 'knowledge',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="18" x2="19" y2="18"></line><line x1="5" y1="6" x2="19" y2="6"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
    },
    {
      id: 'vertical-timeline',
      title: 'Vertical Step Timeline',
      desc: 'Elegant step indicators moving vertically. Designed with micro-animations on scroll/click.',
      category: 'timelines',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><circle cx="12" cy="5" r="3"></circle><circle cx="12" cy="12" r="3"></circle><circle cx="12" cy="19" r="3"></circle></svg>`
    },
    {
      id: 'horizontal-timeline',
      title: 'Horizontal Journey Map',
      desc: 'Interactive slider card demonstrating chronological milestones, histories, or developmental processes.',
      category: 'timelines',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><circle cx="5" cy="12" r="3"></circle><circle cx="12" cy="12" r="3"></circle><circle cx="19" cy="12" r="3"></circle></svg>`
    },
    {
      id: 'process-flow',
      title: 'Step-by-Step Flow',
      desc: 'Process block that hides future steps until the learner clicks "Next Step" to progress.',
      category: 'process',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`
    },
    {
      id: 'scenario',
      title: 'Branching Scenario Card',
      desc: 'Interactive mini-simulation where learner selections route to customized response dialogue paths.',
      category: 'process',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`
    },
    {
      id: 'profile-cards',
      title: 'Modern Profile Grid',
      desc: 'Two-column interactive biography grids. Great for team intros, characters, or subject-matter experts.',
      category: 'cards',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
    },
    {
      id: 'info-grid',
      title: 'Multi-Column Info Grid',
      desc: 'A flexible cards layout with beautiful SVG icons, description headers, and rounded card styling.',
      category: 'cards',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`
    },
    {
      id: 'pricing-comparison',
      title: 'Product Matrix Cards',
      desc: 'Interactive table matrix cards highlighting differences in programs, paths, or pricing packages.',
      category: 'cards',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
    },
    {
      id: 'audio-player',
      title: 'Circular Audio Player',
      desc: 'Minimalist customized audio player block showing transcription texts and timeline seek bars.',
      category: 'media',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
    },
    {
      id: 'video-frame',
      title: 'Custom Video Embed',
      desc: 'Sleek video player frame featuring custom overlay buttons and chapters list overlays.',
      category: 'media',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><polygon points="10 8 16 11.5 10 15 10 8"></polygon></svg>`
    },
    {
      id: 'image-gallery',
      title: 'Grid Photo Gallery',
      desc: 'Responsive photo gallery with beautiful modal popups and image detail descriptions.',
      category: 'media',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
    },
    {
      id: 'ai-generator',
      title: 'AI Scenario Generator',
      desc: 'Generate complete multi-decision branching scenario blocks powered by AI within seconds.',
      category: 'ai',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 12 17.19 16.5 19.79"></polyline><polyline points="7.5 12 12 14.6 16.5 12"></polyline></svg>`
    },
    {
      id: 'ai-quiz-maker',
      title: 'AI Quiz generator',
      desc: 'Prompt an assessment topic and generate comprehensive mock quiz question structures instantly.',
      category: 'ai',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
    }
  ];

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

  // Modals elements
  const modalTriggers = {
    'btn-new': 'modal-save', // redirect new to save for name selection
    'btn-open': 'modal-open',
    'btn-save': 'modal-save',
    'btn-export': 'modal-export',
    'btn-settings': 'modal-settings'
  };
  const modalOverlays = document.querySelectorAll('.modal-overlay');

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    // 1. Load theme state
    setTheme(appState.theme);
    
    // 2. Render initial category catalog
    renderCatalog();
    
    // 3. Update Favorites count
    updateFavoritesBadge();

    // 4. Hook up live sync for values in Form Inputs
    setupFormListeners();
    
    // 5. Build dynamic items initially
    renderDynamicItems();

    // 6. Build the initial interactive preview
    updateLivePreview();
  }

  // ==========================================
  // THEME MANAGEMENT
  // ==========================================
  function setTheme(theme) {
    appState.theme = theme;
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('rise-builder-theme', theme);
    
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
    setTheme(appState.theme === 'light' ? 'dark' : 'light');
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
    
    let filtered = componentCatalog;
    
    // Filter by Active Category (unless we are checking Favorites)
    if (appState.activeCategory === 'favorites') {
      filtered = filtered.filter(item => appState.favorites.has(item.id));
    } else {
      filtered = filtered.filter(item => item.category === appState.activeCategory);
    }
    
    // Filter by Search Query
    if (appState.searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(appState.searchQuery) ||
        item.desc.toLowerCase().includes(appState.searchQuery)
      );
    }

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
      const card = document.createElement('div');
      card.className = 'component-select-card';
      card.innerHTML = `
        <div class="card-icon-container">
          ${comp.icon}
        </div>
        <h3>${comp.title}</h3>
        <p>${comp.desc}</p>
        <div class="card-footer">
          <span class="card-tag">${comp.category}</span>
          <span class="card-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        loadComponentToEditor(comp);
      });
      
      componentsGrid.appendChild(card);
    });
  }

  // ==========================================
  // COMPONENT LOADER & EDITOR STATE
  // ==========================================
  function loadComponentToEditor(component) {
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
    
    // Render dynamic item list inputs
    renderDynamicItems();

    // Show Editor Layout
    showState('editor');
    
    // Force live preview frame refresh
    updateLivePreview();
  }

  function setupComponentFields(id) {
    // Generate specialized items for the selected component
    if (id === 'multiple-choice') {
      appState.config.items = [
        { label: 'Option A (Correct)', content: 'Micro-learning helps memory retention.', correct: true },
        { label: 'Option B', content: 'Courses must be at least 1 hour long.', correct: false },
        { label: 'Option C', content: 'Instructional text should be very dense.', correct: false }
      ];
    } else if (id === 'flip-cards') {
      appState.config.items = [
        { title: 'Front Side A', content: 'Hover to reveal definition.' },
        { title: 'Back Side A', content: 'Definitions should be concise.' },
        { title: 'Front Side B', content: 'Mobile compatibility check.' },
        { title: 'Back Side B', content: 'Rise blocks fit full width.' }
      ];
    } else if (id === 'vertical-timeline' || id === 'horizontal-timeline') {
      appState.config.items = [
        { title: 'Phase 1: Research', content: 'Collect data assets, requirements, and verify targets.' },
        { title: 'Phase 2: Build Layout', content: 'Configure colors, fonts, margins, and borders in the tool.' },
        { title: 'Phase 3: Export HTML', content: 'Copy custom block and import inside Articulate Rise blocks.' }
      ];
    } else if (id === 'tab-blocks') {
      appState.config.items = [
        { title: 'Tab 1: Overview', content: 'A high-level explanation of the subject matter, laying a strong conceptual foundation.' },
        { title: 'Tab 2: Details', content: 'In-depth description of procedures, parameters, and design metrics.' },
        { title: 'Tab 3: Summary', content: 'Key takeaways and visual summaries to reinforce memory retention.' }
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
    
    if (appState.activeCategory === 'favorites') {
      renderCatalog();
    }
  });

  function updateFavoritesBadge() {
    favoritesCountBadge.innerText = appState.favorites.size;
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
    editorTabs.forEach(t => t.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));
    
    const activeTab = document.querySelector(`.editor-tab[data-tab="${tabId}"]`);
    const activePane = document.getElementById(`tab-${tabId}`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activePane) activePane.classList.add('active');
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
      picker.addEventListener('input', (e) => {
        text.value = e.target.value.toUpperCase();
        appState.config[stateKey] = e.target.value;
        updateLivePreview();
      });
      
      text.addEventListener('input', (e) => {
        let val = e.target.value;
        if (val.match(/^#[0-9A-F]{6}$/i)) {
          picker.value = val;
          appState.config[stateKey] = val;
          updateLivePreview();
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
      appState.config.borderRadius = e.target.value;
      updateLivePreview();
    });

    // 4. Select dropdowns
    selectShadow.addEventListener('change', (e) => {
      appState.config.shadowDepth = e.target.value;
      updateLivePreview();
    });

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
  function renderDynamicItems() {
    dynamicItemsContainer.innerHTML = '';
    
    appState.config.items.forEach((item, index) => {
      const isQuiz = appState.selectedComponent?.id === 'multiple-choice';
      const isFlip = appState.selectedComponent?.id === 'flip-cards';
      
      let titleLabel = isFlip 
        ? (index % 2 === 0 ? `Card ${Math.floor(index/2)+1} Front` : `Card ${Math.floor(index/2)+1} Back`) 
        : `Item Title / Header`;
        
      const itemCard = document.createElement('div');
      itemCard.className = 'dynamic-item-card';
      
      itemCard.innerHTML = `
        <div class="item-card-header">
          <span class="item-number">Item #${index + 1}</span>
          <button type="button" class="item-delete-btn" data-index="${index}" title="Remove Item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        
        <div class="input-wrapper">
          <label>${titleLabel}</label>
          <input type="text" class="item-title-input" data-index="${index}" value="${item.title || item.label || ''}" placeholder="Enter heading...">
        </div>
        
        <div class="input-wrapper">
          <label>Item Description / Content</label>
          <textarea class="item-content-input" data-index="${index}" placeholder="Enter descriptions...">${item.content || ''}</textarea>
        </div>
        
        ${isQuiz ? `
          <div class="checkbox-wrapper" style="margin-top: 4px;">
            <input type="checkbox" class="item-correct-check" data-index="${index}" ${item.correct ? 'checked' : ''} id="correct-${index}">
            <label for="correct-${index}">Correct Answer</label>
          </div>
        ` : ''}
      `;
      
      // Input event wiring
      const titleInput = itemCard.querySelector('.item-title-input');
      titleInput.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        if (isQuiz) {
          appState.config.items[idx].label = e.target.value;
        } else {
          appState.config.items[idx].title = e.target.value;
        }
        updateLivePreview();
      });

      const contentInput = itemCard.querySelector('.item-content-input');
      contentInput.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        appState.config.items[idx].content = e.target.value;
        updateLivePreview();
      });

      if (isQuiz) {
        const correctCheck = itemCard.querySelector('.item-correct-check');
        correctCheck.addEventListener('change', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'));
          
          // If mutual exclusive choice, clear others
          appState.config.items.forEach((it, i) => {
            it.correct = (i === idx) ? e.target.checked : false;
            // update dom checkboxes visually
            const check = dynamicItemsContainer.querySelector(`#correct-${i}`);
            if (check && i !== idx) check.checked = false;
          });
          
          updateLivePreview();
        });
      }
      
      // Delete wire
      const delBtn = itemCard.querySelector('.item-delete-btn');
      delBtn.addEventListener('click', (e) => {
        const idx = parseInt(delBtn.getAttribute('data-index'));
        appState.config.items.splice(idx, 1);
        renderDynamicItems();
        updateLivePreview();
      });

      dynamicItemsContainer.appendChild(itemCard);
    });
  }

  btnAddItem.addEventListener('click', () => {
    const isQuiz = appState.selectedComponent?.id === 'multiple-choice';
    if (isQuiz) {
      appState.config.items.push({ label: 'New Option', content: 'Option feedback text.', correct: false });
    } else {
      appState.config.items.push({ title: 'New Item Header', content: 'Customize this description content inside the builder panel.' });
    }
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
    const previewHtml = generateIframeContent();
    const newWindow = window.open();
    newWindow.document.write(previewHtml);
    newWindow.document.close();
  });

  // ==========================================
  // MODALS HANDLING
  // ==========================================
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
        
        modalElem.style.display = 'flex';
      });
    }
  });

  // Close modals
  modalOverlays.forEach(overlay => {
    const card = overlay.querySelector('.modal-card');
    const closeBtns = overlay.querySelectorAll('.modal-close-btn, .modal-cancel-btn');
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    });
  });

  // Save Confirm
  const btnConfirmSave = document.getElementById('btn-confirm-save');
  if (btnConfirmSave) {
    btnConfirmSave.addEventListener('click', () => {
      const nameInput = document.getElementById('save-component-name');
      alert(`"${nameInput.value}" successfully saved to local workspace!`);
      document.getElementById('modal-save').style.display = 'none';
    });
  }

  // Settings Save
  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const selectFont = document.getElementById('settings-default-font');
      const selectExport = document.getElementById('settings-export-format');
      const checkAutosave = document.getElementById('settings-enable-autosave');
      const checkAi = document.getElementById('settings-enable-ai');
      
      appState.settings.defaultFont = selectFont.value;
      appState.settings.exportFormat = selectExport.value;
      appState.settings.autosave = checkAutosave.checked;
      appState.settings.aiEnabled = checkAi.checked;
      
      alert('Settings applied successfully!');
      document.getElementById('modal-settings').style.display = 'none';
      
      // Re-render live preview to apply base font
      updateLivePreview();
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
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(target.textContent || target.innerText).then(() => {
          const origText = btn.innerText;
          btn.innerText = 'Copied!';
          btn.style.backgroundColor = 'var(--success)';
          btn.style.color = '#FFFFFF';
          
          setTimeout(() => {
            btn.innerText = origText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
          }, 2000);
        });
      });
    }
  }

  function setupExportModalContent() {
    const html = generateIframeContent();
    const htmlFragment = generateHtmlFragment(html);
    
    // Standard HTML-encode helper for srcdoc attribute safety
    const escapedHtml = html
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // Iframe Embed Code using self-contained srcdoc
    const iframeCode = document.getElementById('export-iframe-code');
    iframeCode.textContent = `<iframe srcdoc="${escapedHtml}" width="100%" height="500px" style="border:none;" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"></iframe>`;
    
    // Paste-friendly HTML fragment for custom HTML blocks
    const htmlCode = document.getElementById('export-html-code');
    htmlCode.textContent = htmlFragment;
  }

  function generateHtmlFragment(fullHtml) {
    const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/i);
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const styleBlock = styleMatch ? `<style>\n${styleMatch[1].trim()}\n</style>` : '';
    const bodyBlock = bodyMatch ? bodyMatch[1].trim() : fullHtml;
    return [styleBlock, bodyBlock].filter(Boolean).join('\n\n');
  }

  function downloadTextFile(filename, text, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const btnDownloadHtml = document.getElementById('btn-download-html');
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener('click', () => {
      const title = appState.selectedComponent?.title || 'rise-component';
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rise-component'}.html`;
      downloadTextFile(filename, generateIframeContent(), 'text/html;charset=utf-8');
    });
  }

  const btnDownloadZip = document.getElementById('btn-download-zip');
  if (btnDownloadZip) {
    btnDownloadZip.addEventListener('click', () => {
      alert('SCORM package export is not available in this local beta yet. Use the iframe embed or download the standalone HTML file.');
    });
  }

  // ==========================================
  // LIVE PREVIEW COMPILER & GENERATOR
  // ==========================================
  let lastActiveComponentId = null;
  function updateLivePreview() {
    if (!livePreviewIframe) return;
    
    const iframeDoc = livePreviewIframe.contentDocument || livePreviewIframe.contentWindow.document;
    const iframeWin = livePreviewIframe.contentWindow;
    
    const compId = appState.selectedComponent ? appState.selectedComponent.id : 'accordion';
    if (compId !== lastActiveComponentId) {
      if (iframeWin) {
        iframeWin.viewedItems = new Set();
        iframeWin.activeProcessIndex = 0;
        iframeWin.sortingChoices = {};
      }
      lastActiveComponentId = compId;
    }
    
    const generatedHtml = generateIframeContent();
    
    iframeDoc.open();
    iframeDoc.write(generatedHtml);
    iframeDoc.close();
  }

  function generateIframeContent() {
    const c = appState.config;
    const compId = appState.selectedComponent ? appState.selectedComponent.id : 'accordion';
    const toRgba = (color, alpha, fallback) => {
      const value = (color || '').trim();
      const shortHex = /^#([0-9a-f]{3})$/i.exec(value);
      const longHex = /^#([0-9a-f]{6})$/i.exec(value);
      let hex = longHex ? longHex[1] : null;
      if (!hex && shortHex) {
        hex = shortHex[1].split('').map(ch => ch + ch).join('');
      }
      if (!hex) return fallback || `rgba(31, 41, 55, ${alpha})`;
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Custom Rise Styles based on customization inputs
    const shadowStyle = {
      'none': 'none',
      'soft': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
      'medium': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
      'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
    }[c.shadowDepth];

    const bodyBg = c.colorBg;
    const textMain = c.colorText;
    const textMuted = toRgba(c.colorText, 0.72);
    const cardBg = c.colorBg;
    const borderColor = c.borderOutline ? toRgba(c.colorText, 0.16) : 'transparent';
    const cardBorder = c.borderOutline ? '1px solid var(--border-color)' : 'none';
    const fontStack = appState.settings.defaultFont;
    const primaryLight = toRgba(c.colorPrimary, 0.12, 'rgba(37, 99, 235, 0.12)');
    const primaryTint = toRgba(c.colorPrimary, 0.05, 'rgba(37, 99, 235, 0.05)');
    const focusRing = toRgba(c.colorPrimary, 0.16, 'rgba(37, 99, 235, 0.16)');
    const accentLight = toRgba(c.colorAccent, 0.14, 'rgba(245, 158, 11, 0.14)');
    const accentTint = toRgba(c.colorAccent, 0.07, 'rgba(245, 158, 11, 0.07)');

    // Component-Specific HTML Generator
    let componentHtml = '';
    
    if (compId === 'multiple-choice') {
      componentHtml = `
        <div class="quiz-block">
          ${c.items.map((item, idx) => `
            <div class="quiz-option" data-idx="${idx}">
              <div class="option-check-circle"></div>
              <div class="option-text">${item.title || item.label || 'Option Label'}</div>
            </div>
          `).join('')}
          <button class="quiz-submit-btn">Submit Answer</button>
          <div id="quiz-feedback-box" class="quiz-feedback" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'flip-cards') {
      // Group items into pairs of two (Front / Back)
      const cards = [];
      for (let i = 0; i < c.items.length; i += 2) {
        if (c.items[i]) {
          cards.push({
            front: c.items[i],
            back: c.items[i+1] || { title: 'Back Side Label', content: 'Back side description text.' }
          });
        }
      }
      
      componentHtml = `
        <div class="flip-cards-grid">
          ${cards.map((card, idx) => `
            <div class="flip-card">
              <div class="flip-card-inner">
                <div class="flip-card-front">
                  <div class="card-icon-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <h3>${card.front.title || 'Front Title'}</h3>
                  <p>${card.front.content || 'Click to reveal definition.'}</p>
                </div>
                <div class="flip-card-back">
                  <h3>${card.back.title || 'Back Title'}</h3>
                  <p>${card.back.content || 'Back description content goes here.'}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'vertical-timeline') {
      componentHtml = `
        <div class="vertical-timeline-container">
          ${c.items.map((item, idx) => `
            <div class="timeline-step">
              <div class="step-marker">
                <span class="step-num">${idx + 1}</span>
              </div>
              <div class="step-card">
                <h4>${item.title || 'Step Title'}</h4>
                <p>${item.content || 'Step content description details go here.'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'tab-blocks') {
      componentHtml = `
        <div class="tabs-container">
          <div class="tabs-header">
            ${c.items.map((item, idx) => `
              <button class="tab-btn ${idx === 0 ? 'active' : ''}">
                ${item.title || 'Tab'}
              </button>
            `).join('')}
          </div>
          <div class="tabs-content-wrapper">
            ${c.items.map((item, idx) => `
              <div class="tab-panel ${idx === 0 ? 'active' : ''}" id="tab-panel-${idx}">
                <p>${item.content || ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (compId === 'hotspots') {
      componentHtml = `
        <div class="hotspots-container">
          <div class="hotspot-img-wrapper">
            <svg viewBox="0 0 800 450" class="hotspot-schematic-svg">
              <rect width="100%" height="100%" fill="#F1F5F9" rx="12"></rect>
              <circle cx="400" cy="225" r="100" fill="none" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="10 10"></circle>
              <line x1="100" y1="225" x2="700" y2="225" stroke="#E2E8F0" stroke-width="2"></line>
              <line x1="400" y1="50" x2="400" y2="400" stroke="#E2E8F0" stroke-width="2"></line>
              <text x="400" y="230" text-anchor="middle" fill="#94A3B8" font-size="16" font-weight="600">SCHEMATIC PATHWAY MAP</text>
            </svg>
            ${c.items.map((item, idx) => `
              <div class="hotspot-pin" style="left: ${item.x || '50'}%; top: ${item.y || '50'}%;" data-idx="${idx}">
                <span class="pulse"></span>
                <span class="pin-dot">${idx + 1}</span>
                <div class="hotspot-tooltip" id="hotspot-tooltip-${idx}">
                  <h5>${item.title || 'Indicator'}</h5>
                  <p>${item.content || 'Details...'}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (compId === 'button-list') {
      componentHtml = `
        <div class="buttons-container">
          ${c.items.map((item, idx) => `
            <a href="${item.content || '#'}" target="_blank" class="link-button-item" data-idx="${idx}">
              <span>${item.title || 'Launch Link'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          `).join('')}
        </div>
      `;
    } else if (compId === 'menu-list') {
      componentHtml = `
        <div class="menu-drawer-list">
          ${c.items.map((item, idx) => `
            <div class="menu-drawer-item" data-idx="${idx}">
              <div class="menu-item-summary">
                <div class="menu-item-left">
                  <span class="menu-num">0${idx+1}</span>
                  <span class="menu-title">${item.title || 'Lesson Segment'}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="menu-arrow"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div class="menu-item-desc">
                <p>${item.content || 'Description content details...'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'sorting-activity') {
      const categories = [...new Set(c.items.map(it => it.category || 'Category'))];
      componentHtml = `
        <div class="sorting-activity-container">
          <div class="sorting-card-pool">
            ${c.items.map((item, idx) => `
              <div class="sorting-draggable" id="sort-card-${idx}" data-category="${item.category || ''}">
                <div class="drag-handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                </div>
                <div class="drag-text">${item.title || 'Sorting Card'}</div>
                <div class="sorting-targets-row">
                  ${categories.map(cat => `
                    <button class="target-btn" data-idx="${idx}" data-cat="${cat}">Move to ${cat}</button>
                  `).join('')}
                </div>
                <div class="sort-status-indicator"></div>
              </div>
            `).join('')}
          </div>
          <div class="sorting-categories-columns">
            ${categories.map(cat => `
              <div class="sorting-column" data-column-cat="${cat}">
                <div class="column-header">${cat}</div>
                <div class="column-dropzone" id="zone-${cat}"></div>
              </div>
            `).join('')}
          </div>
          <button class="quiz-submit-btn">Verify Sorting</button>
          <div id="sorting-feedback-box" class="quiz-feedback" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'fill-blank') {
      componentHtml = `
        <div class="fill-blank-container">
          ${c.items.map((item, idx) => {
            const sentence = item.title || '';
            const blanked = sentence.replace(/\[blank\]/gi, `<input type="text" class="blank-input" data-index="${idx}" placeholder="...">`);
            return `
              <div class="blank-sentence-card">
                <span class="sentence-num">${idx + 1}</span>
                <div class="blank-sentence-content">${blanked}</div>
              </div>
            `;
          }).join('')}
          <button class="quiz-submit-btn">Check Answers</button>
          <div id="blank-feedback-box" class="quiz-feedback" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'horizontal-timeline') {
      componentHtml = `
        <div class="horizontal-timeline-container">
          <div class="timeline-nodes-row">
            ${c.items.map((item, idx) => `
              <div class="timeline-node ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
                <div class="node-marker"></div>
                <span class="node-label">${item.title || 'Step'}</span>
              </div>
            `).join('')}
          </div>
          <div class="timeline-slider-box">
            ${c.items.map((item, idx) => `
              <div class="timeline-slide ${idx === 0 ? 'active' : ''}" id="timeline-slide-${idx}">
                <h4>${item.title || 'Phase Header'}</h4>
                <p>${item.content || 'Milestone description goes here.'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (compId === 'process-flow') {
      componentHtml = `
        <div class="process-steps-container">
          <div class="process-progress-header">
            <span class="step-badge">Step <span id="current-process-num">1</span> of ${c.items.length}</span>
            <div class="process-dots">
              ${c.items.map((_, idx) => `<span class="p-dot ${idx === 0 ? 'active' : ''}"></span>`).join('')}
            </div>
          </div>
          <div class="process-slides-wrapper">
            ${c.items.map((item, idx) => `
              <div class="process-slide ${idx === 0 ? 'active' : ''}" id="process-slide-${idx}">
                <h3>${item.title || 'Step Headline'}</h3>
                <p>${item.content || 'Step content description details go here.'}</p>
              </div>
            `).join('')}
          </div>
          <div class="process-controls-row">
            <button class="btn btn-secondary btn-small" id="btn-process-prev" disabled>Previous</button>
            <button class="btn btn-primary btn-small" id="btn-process-next">Next Step</button>
          </div>
        </div>
      `;
    } else if (compId === 'scenario') {
      const q = c.items[0] || { title: 'Dialogue prompt', content: 'What should we do?' };
      const choices = c.items.slice(1);
      componentHtml = `
        <div class="scenario-container">
          <div class="scenario-avatar-row">
            <div class="char-avatar-img">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="scenario-bubble">
              <div class="speaker-name">CHRIS (TEAM LEAD)</div>
              <div class="speech-text" id="scenario-speech">${q.title}</div>
            </div>
          </div>
          <div class="scenario-choices-list" id="scenario-choices-box">
            ${choices.map((ch, idx) => `
              <button class="scenario-choice-btn" data-choice-idx="${idx}" data-feedback="${ch.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
                ${ch.title || 'Choice Option'}
              </button>
            `).join('')}
          </div>
          <div id="scenario-feedback-card" class="scenario-feedback-balloon" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'profile-cards') {
      componentHtml = `
        <div class="profiles-grid">
          ${c.items.map((item, idx) => `
            <div class="profile-card-item">
              <div class="profile-avatar-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div class="profile-card-content">
                <h4>${item.title || 'Expert Name'}</h4>
                <p>${item.content || 'Professional background summary bio.'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'info-grid') {
      componentHtml = `
        <div class="info-grid-container">
          ${c.items.map((item, idx) => `
            <div class="info-grid-item">
              <div class="info-grid-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>
              </div>
              <h4>${item.title || 'Feature Key'}</h4>
              <p>${item.content || 'Description layout parameters.'}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'pricing-comparison') {
      componentHtml = `
        <div class="pricing-table-container">
          ${c.items.map((item, idx) => `
            <div class="pricing-card-item ${idx === 1 ? 'premium-highlight' : ''}">
              ${idx === 1 ? `<div class="popular-ribbon">RECOMMENDED</div>` : ''}
              <div class="pricing-tier-header">
                <h4>${item.title || 'Service Plan'}</h4>
              </div>
              <div class="pricing-features-list">
                ${item.content.split('•').map(feat => `
                  <div class="pricing-feature-line">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="tick-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>${feat.trim()}</span>
                  </div>
                `).join('')}
              </div>
              <button class="pricing-action-btn">Choose Plan</button>
            </div>
          `).join('')}
        </div>
      `;
    } else if (compId === 'audio-player') {
      const src = c.items[0]?.content || '';
      componentHtml = `
        <div class="audio-player-block">
          <div class="audio-info">
            <div class="audio-art">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <div class="audio-text-labels">
              <h5>${c.items[0]?.title || 'Instructional Audio Segment'}</h5>
              <p>Duration: 3m 42s</p>
            </div>
          </div>
          <div class="audio-controls-row">
            <button class="audio-play-btn">
              <svg class="play-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <svg class="pause-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            </button>
            <div class="audio-scrub-bar">
              <div class="scrub-fill" style="width: 25%;"></div>
            </div>
            <span class="audio-timer">0:56</span>
          </div>
          <audio id="html5-audio-element" src="${src}" style="display:none;"></audio>
        </div>
      `;
    } else if (compId === 'video-frame') {
      const src = c.items[0]?.content || '';
      componentHtml = `
        <div class="video-player-block">
          <div class="video-wrapper">
            <video id="html5-video-element" poster="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800" width="100%" height="auto">
              <source src="${src}" type="video/mp4">
            </video>
            <div class="video-overlay-play">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
          <div class="video-control-strip">
            <button class="video-mini-play">Play</button>
            <div class="video-timeline-scrub">
              <div class="video-fill" style="width: 0%;"></div>
            </div>
          </div>
        </div>
      `;
    } else if (compId === 'image-gallery') {
      componentHtml = `
        <div class="gallery-grid">
          ${c.items.map((item, idx) => `
            <div class="gallery-item-card" data-img="${item.content}">
              <img src="${item.content}" alt="${item.title}">
              <div class="gallery-caption-overlay">
                <span>${item.title || 'View Layout'}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div id="gallery-lightbox" class="lightbox-overlay" style="display:none;">
          <span class="lightbox-close">&times;</span>
          <img class="lightbox-img" id="lightbox-expanded-img" src="" alt="Lightbox image">
          <div class="lightbox-caption" id="lightbox-expanded-caption">Caption details</div>
        </div>
      `;
    } else if (compId === 'ai-generator' || compId === 'ai-quiz-maker') {
      const promptText = c.items[0]?.title || 'Create custom template blocks';
      const isQuiz = compId === 'ai-quiz-maker';
      componentHtml = `
        <div class="ai-generator-preview">
          <div class="ai-badge-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ai-spark-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>Rise AI Assistant Prompt</span>
          </div>
          <div class="ai-prompt-display">"${promptText}"</div>
          <button class="ai-generate-run-btn" data-is-quiz="${isQuiz}">Generate eLearning Layout</button>
          
          <div class="ai-output-area" style="display:none;">
            <div class="ai-loading-indicator">
              <div class="spinner"></div>
              <span>AI Engine analyzing layout constraints...</span>
            </div>
            
            <div class="ai-results-wrapper" style="display:none;">
              <div class="ai-success-marker">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <strong>AI Generation Successful!</strong>
              </div>
              <div class="ai-results-list">
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Default: Accordion
      const iconSvg = c.iconStyle === 'chevron' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="acc-arrow"><polyline points="6 9 12 15 18 9"></polyline></svg>`
        : c.iconStyle === 'plus-minus'
          ? `<div class="acc-plus-minus"></div>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="acc-arrow"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

      componentHtml = `
        <div class="accordion-group">
          ${c.items.map((item, idx) => `
            <div class="accordion-item" id="item-${idx}">
              <button class="accordion-trigger" data-idx="${idx}">
                <span>${item.title || 'Item Title Header'}</span>
                ${iconSvg}
              </button>
              <div class="accordion-content">
                <div class="accordion-body">
                  <p>${item.content || 'Customize accordion body descriptions.'}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    const trackableCount = compId === 'flip-cards'
      ? Math.max(Math.ceil(c.items.length / 2), 1)
      : compId === 'scenario'
        ? Math.max(c.items.length - 1, 1)
        : ['audio-player', 'video-frame', 'ai-generator', 'ai-quiz-maker', 'fill-blank'].includes(compId)
          ? 1
          : Math.max(c.items.length, 1);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=${fontStack.replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${c.colorPrimary};
      --accent: ${c.colorAccent};
      --bg-body: ${bodyBg};
      --bg-card: ${cardBg};
      --text-main: ${textMain};
      --text-muted: ${textMuted};
      --border-color: ${borderColor};
      --border-radius: ${c.borderRadius}px;
      --border-style: ${cardBorder};
      --shadow-style: ${shadowStyle};
      --font-family: '${fontStack}', sans-serif;
      --primary-light: ${primaryLight};
      --primary-tint: ${primaryTint};
      --focus-ring: ${focusRing};
      --accent-light: ${accentLight};
      --accent-tint: ${accentTint};
      --success: #10B981;
      --danger: #EF4444;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
      --shadow-lg: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--font-family);
      background-color: var(--bg-body);
      color: var(--text-main);
      padding: 30px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      transition: background-color 0.2s ease;
    }
    
    /* Interactive Block Shell */
    .rise-block-wrapper {
      width: 100%;
      max-width: 740px;
      margin: 0 auto;
    }
    
    .block-header {
      margin-bottom: 24px;
      text-align: left;
    }
    
    .block-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .block-headline {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.3;
    }
    
    .block-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.5;
    }
    
    /* Dynamic Components UI */
    
    /* 1. Accordion Styles */
    .accordion-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .accordion-item {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    
    .accordion-trigger {
      width: 100%;
      background: transparent;
      border: none;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      color: var(--text-main);
      outline: none;
    }
    
    .accordion-trigger:focus-visible {
      box-shadow: 0 0 0 3px var(--focus-ring);
    }
    
    .acc-arrow {
      transition: transform 0.25s ease;
      color: var(--text-muted);
    }
    
    .accordion-item.active .acc-arrow {
      transform: rotate(180deg);
      color: var(--accent);
    }

    .accordion-item.active {
      border-color: var(--accent);
    }
    
    .acc-plus-minus {
      position: relative;
      width: 14px;
      height: 14px;
    }
    
    .acc-plus-minus::before, .acc-plus-minus::after {
      content: '';
      position: absolute;
      background-color: var(--text-muted);
      transition: transform 0.25s ease;
    }
    
    /* Horizontal rule */
    .acc-plus-minus::before {
      top: 6px;
      left: 0;
      right: 0;
      height: 2px;
    }
    
    /* Vertical rule */
    .acc-plus-minus::after {
      top: 0;
      bottom: 0;
      left: 6px;
      width: 2px;
    }
    
    .accordion-item.active .acc-plus-minus::after {
      transform: rotate(90deg);
      opacity: 0;
    }
    .accordion-item.active .acc-plus-minus::before,
    .accordion-item.active .acc-plus-minus::after {
      background-color: var(--accent);
    }
    
    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    
    .accordion-body {
      padding: 0 20px 20px 20px;
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    
    /* 2. Multiple Choice Quiz Styles */
    .quiz-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .quiz-option {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .quiz-option:hover {
      border-color: var(--primary);
    }
    
    .quiz-option.selected {
      border-color: var(--accent);
      background-color: var(--accent-tint);
    }
    
    .option-check-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--text-muted);
      position: relative;
      transition: all 0.2s ease;
    }
    
    .quiz-option.selected .option-check-circle {
      border-color: var(--accent);
      background-color: var(--accent);
    }
    
    .quiz-option.selected .option-check-circle::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #FFFFFF;
    }
    
    .option-text {
      font-size: 13px;
      font-weight: 500;
    }
    
    .quiz-submit-btn {
      align-self: flex-start;
      margin-top: 10px;
      padding: 10px 24px;
      border-radius: var(--border-radius);
      border: none;
      background-color: var(--primary);
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .quiz-submit-btn:hover {
      opacity: 0.9;
    }
    
    .quiz-feedback {
      margin-top: 14px;
      padding: 16px;
      border-radius: var(--border-radius);
      font-size: 13px;
      line-height: 1.5;
      animation: fadeIn 0.3s ease;
    }
    
    .quiz-feedback.correct {
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #065F46;
    }
    
    .quiz-feedback.wrong {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #991B1B;
    }

    /* 3. 3D Flip Card Styles */
    .flip-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .flip-card {
      background-color: transparent;
      height: 180px;
      perspective: 1000px;
      cursor: pointer;
    }
    
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    
    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg);
    }
    
    .flip-card-front, .flip-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      border-radius: var(--border-radius);
      border: var(--border-style);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    
    .flip-card-front {
      background-color: var(--bg-card);
      color: var(--text-main);
    }
    
    .card-icon-badge {
      color: var(--accent);
      margin-bottom: 4px;
    }
    
    .flip-card-front h3, .flip-card-back h3 {
      font-size: 15px;
      font-weight: 600;
    }
    
    .flip-card-front p, .flip-card-back p {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    
    .flip-card-back {
      background-color: var(--primary);
      color: #FFFFFF;
      transform: rotateY(180deg);
    }
    
    .flip-card-back h3 {
      color: #FFFFFF;
    }
    
    .flip-card-back p {
      color: rgba(255, 255, 255, 0.85);
    }

    /* 4. Vertical Timeline Styles */
    .vertical-timeline-container {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 32px;
    }
    
    .vertical-timeline-container::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background-color: var(--accent);
      opacity: 0.2;
    }
    
    .timeline-step {
      position: relative;
      margin-bottom: 24px;
      cursor: pointer;
    }
    
    .step-marker {
      position: absolute;
      left: -32px;
      top: 4px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background-color: var(--accent-light);
      border: 2px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    
    .step-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
    }
    
    .step-card {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 16px 20px;
    }
    
    .step-card h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .step-card p {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .timeline-step.active .step-marker {
      background-color: var(--accent);
    }
    .timeline-step.active .step-num {
      color: #FFFFFF;
    }
    .timeline-step.active .step-card {
      border-color: var(--accent);
    }

    /* Completion Tracker Bar */
    .completion-tracker {
      margin-top: 30px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }
    
    .progress-bar-container {
      height: 8px;
      width: 100%;
      background-color: var(--bg-body);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .progress-fill {
      height: 100%;
      background-color: var(--accent);
      width: 0%;
      transition: width 0.3s ease;
    }

    /* 5. Tabs Block Styles */
    .tabs-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      overflow: hidden;
    }
    .tabs-header {
      display: flex;
      border-bottom: var(--border-style);
      background-color: rgba(0,0,0,0.02);
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 14px 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .tabs-content-wrapper {
      padding: 20px;
    }
    .tab-panel {
      display: none;
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-muted);
      animation: fadeIn 0.3s ease;
    }
    .tab-panel.active {
      display: block;
    }

    /* 6. Hotspot Styles */
    .hotspots-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 12px;
    }
    .hotspot-img-wrapper {
      position: relative;
      width: 100%;
      border-radius: calc(var(--border-radius) - 4px);
      overflow: hidden;
    }
    .hotspot-schematic-svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .hotspot-pin {
      position: absolute;
      width: 28px;
      height: 28px;
      background-color: var(--accent);
      border: 2px solid #FFFFFF;
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transform: translate(-50%, -50%);
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 10;
    }
    .hotspot-pin .pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--accent);
      animation: pinPulse 2s infinite;
      z-index: -1;
    }
    .hotspot-tooltip {
      position: absolute;
      bottom: 38px;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      width: 220px;
      background-color: #0F172A;
      color: #F1F5F9;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      display: none;
      z-index: 20;
      pointer-events: none;
      text-align: left;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
    }
    .hotspot-pin.active .hotspot-tooltip {
      display: block;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .hotspot-tooltip h5 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #FFFFFF;
    }
    .hotspot-tooltip p {
      font-size: 11px;
      line-height: 1.4;
      color: #94A3B8;
    }
    @keyframes pinPulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* 7. Button List Styles */
    .buttons-container {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: flex-start;
    }
    .link-button-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: var(--primary);
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      border: var(--border-style);
    }
    .link-button-item:hover {
      transform: translateY(-2px);
      opacity: 0.95;
    }

    /* 8. Menu List Styles */
    .menu-drawer-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .menu-drawer-item {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }
    .menu-item-summary {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .menu-item-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .menu-num {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
    }
    .menu-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
    }
    .menu-arrow {
      color: var(--text-muted);
      transition: transform 0.2s;
    }
    .menu-drawer-item.active .menu-arrow {
      transform: rotate(180deg);
      color: var(--accent);
    }
    .menu-item-desc {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease-out;
      background-color: rgba(0,0,0,0.01);
    }
    .menu-item-desc p {
      padding: 0 20px 20px 48px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-muted);
    }
    .menu-drawer-item.active .menu-item-desc {
      max-height: 200px;
    }

    /* 9. Sorting Activity Styles */
    .sorting-activity-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .sorting-card-pool {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sorting-draggable {
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      transition: all 0.2s;
    }
    .drag-handle {
      color: var(--text-muted);
      cursor: grab;
      margin-right: 12px;
      display: flex;
    }
    .drag-text {
      flex: 1;
      font-weight: 500;
    }
    .sorting-targets-row {
      display: flex;
      gap: 8px;
    }
    .target-btn {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .target-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .target-btn.active {
      border-color: var(--accent);
      background-color: var(--accent);
      color: #FFFFFF;
    }
    .sorting-categories-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .sorting-column {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 16px;
    }
    .column-header {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--accent);
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .column-dropzone {
      min-height: 80px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sorted-item-badge {
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      animation: fadeIn 0.2s ease;
    }
    .sort-status-indicator {
      font-size: 11px;
      font-weight: 600;
      margin-left: 10px;
    }

    /* 10. Fill in the Blank Styles */
    .fill-blank-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .blank-sentence-card {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 14px;
    }
    .blank-sentence-card:last-child {
      border-bottom: none;
    }
    .sentence-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--accent-light);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .blank-sentence-content {
      font-size: 13px;
      line-height: 1.8;
    }
    .blank-input {
      border: none;
      border-bottom: 2px solid var(--text-muted);
      background-color: transparent;
      outline: none;
      padding: 0 4px;
      font-weight: 600;
      color: var(--text-main);
      width: 100px;
      text-align: center;
      transition: border-bottom-color 0.2s;
    }
    .blank-input:focus {
      border-bottom-color: var(--accent);
    }

    /* 11. Horizontal Timeline Styles */
    .horizontal-timeline-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .timeline-nodes-row {
      display: flex;
      justify-content: space-between;
      position: relative;
      padding-bottom: 12px;
    }
    .timeline-nodes-row::before {
      content: '';
      position: absolute;
      left: 10px;
      right: 10px;
      top: 10px;
      height: 2px;
      background-color: var(--border-color);
      z-index: 1;
    }
    .timeline-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      z-index: 2;
      flex: 1;
    }
    .node-marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background-color: var(--bg-card);
      border: 3px solid var(--border-color);
      transition: all 0.2s;
      box-shadow: var(--shadow-sm);
    }
    .timeline-node.active .node-marker {
      border-color: var(--accent);
      background-color: var(--accent);
      transform: scale(1.1);
    }
    .node-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 8px;
      text-align: center;
      transition: color 0.2s;
    }
    .timeline-node.active .node-label {
      color: var(--accent);
    }
    .timeline-slider-box {
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      min-height: 100px;
    }
    .timeline-slide {
      display: none;
      animation: fadeIn 0.3s ease;
    }
    .timeline-slide.active {
      display: block;
    }
    .timeline-slide h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .timeline-slide p {
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-muted);
    }

    /* 12. Process Flow Styles */
    .process-steps-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .process-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .step-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      background-color: var(--accent-light);
      padding: 3px 10px;
      border-radius: 20px;
    }
    .process-dots {
      display: flex;
      gap: 6px;
    }
    .p-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--border-color);
      transition: all 0.2s;
    }
    .p-dot.active {
      background-color: var(--accent);
      transform: scale(1.1);
    }
    .process-slides-wrapper {
      min-height: 120px;
      padding: 8px 0;
    }
    .process-slide {
      display: none;
      animation: fadeIn 0.3s ease;
    }
    .process-slide.active {
      display: block;
    }
    .process-slide h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .process-slide p {
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .process-controls-row {
      display: flex;
      justify-content: space-between;
    }

    /* 13. Branching Scenario Styles */
    .scenario-container {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .scenario-avatar-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .char-avatar-img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--accent-light);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 2px solid var(--accent);
      box-shadow: var(--shadow-sm);
    }
    .scenario-bubble {
      flex: 1;
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px 18px;
      position: relative;
    }
    .scenario-bubble::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 18px;
      border-width: 8px 8px 8px 0;
      border-style: solid;
      border-color: transparent var(--border-color) transparent transparent;
    }
    .scenario-bubble::after {
      content: '';
      position: absolute;
      left: -7px;
      top: 18px;
      border-width: 8px 8px 8px 0;
      border-style: solid;
      border-color: transparent var(--bg-body) transparent transparent;
    }
    .speaker-name {
      font-size: 10px;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.6px;
      margin-bottom: 2px;
    }
    .speech-text {
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-main);
    }
    .scenario-choices-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }
    .scenario-choice-btn {
      width: 100%;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 12px 16px;
      border-radius: 8px;
      text-align: left;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .scenario-choice-btn:hover {
      border-color: var(--accent);
      background-color: var(--accent-tint);
    }
    .scenario-feedback-balloon {
      background-color: rgba(0,0,0,0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      line-height: 1.5;
      animation: fadeIn 0.3s ease;
    }

    /* 14. Profile Grid Styles */
    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .profile-card-item {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      transition: border-color 0.2s;
    }
    .profile-card-item:hover {
      border-color: var(--accent);
    }
    .profile-card-item.active {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .profile-avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: var(--accent-light);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid var(--border-color);
    }
    .profile-card-content h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .profile-card-content p {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* 15. Info Grid Styles */
    .info-grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .info-grid-item {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 20px;
      transition: all 0.2s;
    }
    .info-grid-item:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .info-grid-item.active {
      border-color: var(--accent);
      background-color: var(--accent-tint);
    }
    .info-grid-icon {
      color: var(--accent);
      margin-bottom: 12px;
    }
    .info-grid-item h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .info-grid-item p {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* 16. Pricing Comparison Styles */
    .pricing-table-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      align-items: stretch;
    }
    .pricing-card-item {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.2s;
    }
    .pricing-card-item.premium-highlight {
      border-color: var(--accent);
      box-shadow: var(--shadow-lg);
    }
    .pricing-card-item.selected {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .popular-ribbon {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--accent);
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .pricing-tier-header {
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }
    .pricing-tier-header h4 {
      font-size: 15px;
      font-weight: 600;
    }
    .pricing-features-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      margin-bottom: 20px;
    }
    .pricing-feature-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .tick-icon {
      color: var(--accent);
      flex-shrink: 0;
    }
    .pricing-action-btn {
      width: 100%;
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: calc(var(--border-radius) - 4px);
      padding: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pricing-card-item.premium-highlight .pricing-action-btn {
      background-color: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    .pricing-action-btn:hover {
      opacity: 0.95;
    }

    /* 17. Audio Player Styles */
    .audio-player-block {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .audio-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .audio-art {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background-color: var(--accent-light);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .audio-text-labels h5 {
      font-size: 12px;
      font-weight: 600;
    }
    .audio-text-labels p {
      font-size: 10px;
      color: var(--text-muted);
    }
    .audio-controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .audio-play-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--primary);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .audio-play-btn:hover {
      transform: scale(1.05);
    }
    .audio-scrub-bar {
      flex: 1;
      height: 6px;
      border-radius: 4px;
      background-color: var(--bg-body);
      cursor: pointer;
      position: relative;
    }
    .scrub-fill {
      height: 100%;
      border-radius: 4px;
      background-color: var(--accent);
    }
    .audio-timer {
      font-size: 11px;
      color: var(--text-muted);
      width: 30px;
      text-align: right;
    }

    /* 18. Video Player Styles */
    .video-player-block {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .video-wrapper {
      position: relative;
      width: 100%;
      border-radius: calc(var(--border-radius) - 4px);
      overflow: hidden;
      background-color: #000;
    }
    .video-wrapper video {
      display: block;
    }
    .video-overlay-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: rgba(15, 23, 42, 0.7);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .video-wrapper:hover .video-overlay-play {
      background-color: var(--accent);
    }
    .video-control-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px;
    }
    .video-mini-play {
      background: transparent;
      border: none;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      color: var(--accent);
    }
    .video-timeline-scrub {
      flex: 1;
      height: 6px;
      background-color: var(--bg-body);
      border-radius: 4px;
      position: relative;
    }
    .video-fill {
      height: 100%;
      background-color: var(--accent);
      border-radius: 4px;
    }

    /* 19. Photo Gallery Styles */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .gallery-item-card {
      position: relative;
      border-radius: var(--border-radius);
      border: var(--border-style);
      box-shadow: var(--shadow-style);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 4/3;
    }
    .gallery-item-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .gallery-item-card:hover img {
      transform: scale(1.05);
    }
    .gallery-caption-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(0deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 100%);
      padding: 10px;
      color: white;
      font-size: 11px;
      font-weight: 500;
    }
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.9);
      z-index: 200;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .lightbox-img {
      max-width: 90%;
      max-height: 80%;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .lightbox-caption {
      color: #94A3B8;
      font-size: 13px;
      margin-top: 16px;
      text-align: center;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 32px;
      cursor: pointer;
    }

    /* 20. AI Generator Styles */
    .ai-generator-preview {
      background-color: var(--bg-card);
      border: var(--border-style);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-style);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px dashed var(--accent);
      background: linear-gradient(180deg, var(--bg-card) 0%, var(--accent-tint) 100%);
    }
    .ai-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--accent);
    }
    .ai-spark-icon {
      color: var(--accent);
    }
    .ai-prompt-display {
      font-size: 13px;
      font-style: italic;
      color: var(--text-muted);
      border-left: 3px solid var(--accent);
      padding-left: 12px;
      line-height: 1.5;
    }
    .ai-generate-run-btn {
      align-self: flex-start;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: calc(var(--border-radius) - 4px);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px var(--accent-light);
      transition: all 0.2s;
    }
    .ai-generate-run-btn:hover {
      box-shadow: 0 6px 12px var(--accent-light);
      opacity: 0.95;
    }
    .ai-output-area {
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }
    .ai-loading-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid var(--accent-light);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .ai-success-marker {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #065F46;
      margin-bottom: 12px;
    }
    .ai-results-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ai-result-card {
      background-color: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 12px;
      line-height: 1.4;
      animation: fadeIn 0.3s ease;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  
  <div class="rise-block-wrapper">
    <div class="block-header">
      <div class="block-label">${c.blockTitle}</div>
      <div class="block-headline">${c.blockHeadline}</div>
      <div class="block-desc">${c.blockDesc}</div>
    </div>
    
    <div class="block-content">
      ${componentHtml}
    </div>

    ${c.trackCompletion ? `
      <div class="completion-tracker">
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600;">
          <span>Progress Completion</span>
          <span id="completion-text">0%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
    ` : ''}
  </div>

  <script>
    // Live JS Interactions inside emulated Rise lesson block
    
    // 1. Accordion trigger
    var multiOpen = ${c.accordionMulti};
    var allowAnimation = ${c.accordionAnimation};
    var viewedItems = window.viewedItems || new Set();
    var totalItems = ${trackableCount};

    function toggleAccordion(index) {
      const item = document.getElementById('item-' + index);
      const isCurrentlyActive = item.classList.contains('active');
      
      if (!multiOpen) {
        // Close all others
        document.querySelectorAll('.accordion-item').forEach(el => {
          el.classList.remove('active');
          const panel = el.querySelector('.accordion-content');
          if (panel) panel.style.maxHeight = null;
        });
      }
      
      const contentPanel = item.querySelector('.accordion-content');
      
      if (isCurrentlyActive) {
        item.classList.remove('active');
        contentPanel.style.maxHeight = null;
      } else {
        item.classList.add('active');
        contentPanel.style.maxHeight = contentPanel.scrollHeight + "px";
        
        // Track viewed
        viewedItems.add(index);
        updateProgress();
      }
    }

    // 2. Quiz trigger
    var selectedOptionIndex = null;
    var quizOptions = ${JSON.stringify(c.items)};

    function selectQuizOption(index, element) {
      selectedOptionIndex = index;
      document.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
    }

    function submitQuiz() {
      if (selectedOptionIndex === null) {
        alert('Please select an option first!');
        return;
      }
      
      const feedback = document.getElementById('quiz-feedback-box');
      const selection = quizOptions[selectedOptionIndex];
      const isCorrect = selection.correct;
      
      feedback.style.display = 'block';
      feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'wrong');
      
      if (isCorrect) {
        feedback.innerHTML = '<strong>Correct!</strong> ' + (selection.content || 'Excellent choices.');
        updateTrackerComplete();
      } else {
        feedback.innerHTML = '<strong>Incorrect.</strong> Try reviewing the source documentation again.';
      }
    }

    // 3. Flip card tracking is wired by initializeRiseBlockInteractions.

    // 4. Progress tracker updating
    function updateProgress() {
      const trackEnabled = ${c.trackCompletion};
      if (!trackEnabled) return;
      
      const percent = Math.min(Math.round((viewedItems.size / totalItems) * 100), 100);
      
      const txt = document.getElementById('completion-text');
      const bar = document.getElementById('progress-fill');
      
      if (txt && bar) {
        txt.textContent = percent + '%';
        bar.style.width = percent + '%';
      }
      
      if (percent === 100) {
        // Send status back to parent frame if SCORM
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage({ type: 'RISE_BLOCK_COMPLETE', status: 'completed' }, '*');
        }
      }
    }

    function updateTrackerComplete() {
      const trackEnabled = ${c.trackCompletion};
      if (!trackEnabled) return;
      
      const txt = document.getElementById('completion-text');
      const bar = document.getElementById('progress-fill');
      
      if (txt && bar) {
        txt.textContent = '100%';
        bar.style.width = '100%';
      }
    }

    // 5. Tabs Block
    function selectTab(index, button) {
      const container = button.closest('.tabs-container');
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      button.classList.add('active');
      container.querySelector('#tab-panel-' + index).classList.add('active');
      
      viewedItems.add(index);
      updateProgress();
    }

    // 6. Hotspots
    function toggleHotspot(index, pin) {
      const isCurrentlyActive = pin.classList.contains('active');
      document.querySelectorAll('.hotspot-pin').forEach(p => p.classList.remove('active'));
      
      if (!isCurrentlyActive) {
        pin.classList.add('active');
        viewedItems.add(index);
        updateProgress();
      }
    }

    // 7. Button links
    function trackLinkClick(index) {
      viewedItems.add(index);
      updateProgress();
    }

    // 8. Menu Drawer links
    function toggleMenuDrawer(index, item) {
      const isCurrentlyActive = item.classList.contains('active');
      document.querySelectorAll('.menu-drawer-item').forEach(el => el.classList.remove('active'));
      
      if (!isCurrentlyActive) {
        item.classList.add('active');
        viewedItems.add(index);
        updateProgress();
      }
    }

    // 9. Sorting Activity
    var sortingChoices = window.sortingChoices || {};
    function assignCategory(idx, cat, btn) {
      sortingChoices[idx] = cat;
      
      // Update visual indicator
      var card = document.getElementById('sort-card-' + idx);
      var indicator = card.querySelector('.sort-status-indicator');
      indicator.textContent = '-> assigned to ' + cat;
      indicator.style.color = 'var(--primary)';

      document.querySelectorAll('.target-btn[data-idx="' + idx + '"]').forEach(function(targetBtn) {
        targetBtn.classList.toggle('active', targetBtn === btn);
      });

      document.querySelectorAll('.sorted-item-badge[data-card-idx="' + idx + '"]').forEach(function(badge) {
        badge.remove();
      });

      var targetZone = null;
      document.querySelectorAll('.sorting-column').forEach(function(column) {
        if (column.getAttribute('data-column-cat') === cat) {
          targetZone = column.querySelector('.column-dropzone');
        }
      });

      if (targetZone) {
        var badge = document.createElement('div');
        badge.className = 'sorted-item-badge';
        badge.setAttribute('data-card-idx', idx);
        badge.textContent = card.querySelector('.drag-text').textContent;
        targetZone.appendChild(badge);
      }
      
      viewedItems.add(idx);
      updateProgress();
    }

    function checkSorting() {
      var allCorrect = true;
      var originalCards = ${JSON.stringify(c.items)};
      
      originalCards.forEach((item, idx) => {
        const choice = sortingChoices[idx];
        const card = document.getElementById('sort-card-' + idx);
        const indicator = card.querySelector('.sort-status-indicator');
        
        if (choice === item.category) {
          indicator.textContent = 'Correct';
          indicator.style.color = 'var(--success)';
        } else {
          allCorrect = false;
          indicator.textContent = 'Incorrect';
          indicator.style.color = 'var(--danger)';
        }
      });
      
      const feedback = document.getElementById('sorting-feedback-box');
      feedback.style.display = 'block';
      if (allCorrect) {
        feedback.className = 'quiz-feedback correct';
        feedback.innerHTML = '<strong>Superb!</strong> All items sorted correctly.';
        updateTrackerComplete();
      } else {
        feedback.className = 'quiz-feedback wrong';
        feedback.innerHTML = '<strong>Try again.</strong> Some items are not in their correct categories.';
      }
    }

    // 10. Fill in the blanks
    function checkBlanks() {
      var blanks = document.querySelectorAll('.blank-input');
      var allCorrect = true;
      var solutions = ${JSON.stringify(c.items)};
      
      blanks.forEach(input => {
        const idx = parseInt(input.getAttribute('data-index'));
        const userVal = input.value.trim().toLowerCase();
        const correctVal = solutions[idx].content.trim().toLowerCase();
        
        if (userVal === correctVal) {
          input.style.borderBottomColor = 'var(--success)';
          input.style.color = 'var(--success)';
        } else {
          allCorrect = false;
          input.style.borderBottomColor = 'var(--danger)';
          input.style.color = 'var(--danger)';
        }
      });
      
      const feedback = document.getElementById('blank-feedback-box');
      feedback.style.display = 'block';
      if (allCorrect) {
        feedback.className = 'quiz-feedback correct';
        feedback.innerHTML = '<strong>Excellent!</strong> All answers are correct.';
        updateTrackerComplete();
      } else {
        feedback.className = 'quiz-feedback wrong';
        feedback.innerHTML = '<strong>Incorrect blanks.</strong> Review and adjust input answers.';
      }
      
      viewedItems.add(0);
      updateProgress();
    }

    // 11. Horizontal Timeline
    function selectTimelineNode(index, node) {
      const container = node.closest('.horizontal-timeline-container');
      container.querySelectorAll('.timeline-node').forEach(n => n.classList.remove('active'));
      container.querySelectorAll('.timeline-slide').forEach(s => s.classList.remove('active'));
      
      node.classList.add('active');
      container.querySelector('#timeline-slide-' + index).classList.add('active');
      
      viewedItems.add(index);
      updateProgress();
    }

    // 12. Process Step-by-Step Flow
    var activeProcessIndex = window.activeProcessIndex || 0;
    var totalProcessSteps = ${c.items.length};
    function moveProcessStep(direction) {
      const nextIdx = activeProcessIndex + direction;
      if (nextIdx < 0 || nextIdx >= totalProcessSteps) return;
      
      document.querySelectorAll('.process-slide').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.p-dot').forEach(d => d.classList.remove('active'));
      
      activeProcessIndex = nextIdx;
      
      document.getElementById('process-slide-' + activeProcessIndex).classList.add('active');
      document.querySelectorAll('.p-dot')[activeProcessIndex].classList.add('active');
      document.getElementById('current-process-num').textContent = activeProcessIndex + 1;
      
      // Toggle disabled states
      document.getElementById('btn-process-prev').disabled = (activeProcessIndex === 0);
      document.getElementById('btn-process-next').disabled = (activeProcessIndex === totalProcessSteps - 1);
      
      viewedItems.add(activeProcessIndex);
      updateProgress();
    }

    // 13. Branching Scenario Choice
    function selectScenarioChoice(choiceIdx, feedback) {
      const feedbackCard = document.getElementById('scenario-feedback-card');
      feedbackCard.style.display = 'block';
      feedbackCard.innerHTML = '<strong>Chris:</strong> "' + feedback + '"';
      
      viewedItems.add(choiceIdx);
      updateProgress();
      
      if (feedback.toLowerCase().includes('correct') || feedback.toLowerCase().includes('spot on')) {
        updateTrackerComplete();
      }
    }

    // 17. Audio Player controls
    function toggleAudioPlayback(btn) {
      const audio = document.getElementById('html5-audio-element');
      const playSvg = btn.querySelector('.play-svg');
      const pauseSvg = btn.querySelector('.pause-svg');
      
      if (audio.paused) {
        audio.play().catch(e => console.log('Audio autoplay blocked or invalid source URL'));
        playSvg.style.display = 'none';
        pauseSvg.style.display = 'block';
        btn.style.backgroundColor = 'var(--accent)';
      } else {
        audio.pause();
        playSvg.style.display = 'block';
        pauseSvg.style.display = 'none';
        btn.style.backgroundColor = 'var(--primary)';
      }
      viewedItems.add(0);
      updateProgress();
    }
    
    function scrubAudio(event) {
      const bar = event.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const percentage = (clickX / width) * 100;
      
      bar.querySelector('.scrub-fill').style.width = percentage + '%';
      viewedItems.add(0);
      updateProgress();
    }

    // 18. Video Player controls
    function toggleVideoPlayback(trigger) {
      const video = document.getElementById('html5-video-element');
      const overlayPlay = document.querySelector('.video-overlay-play');
      const playBtn = document.querySelector('.video-mini-play');
      
      if (video.paused) {
        video.play().catch(e => console.log('Video autoplay blocked or invalid source URL'));
        overlayPlay.style.display = 'none';
        playBtn.textContent = 'Pause';
      } else {
        video.pause();
        overlayPlay.style.display = 'flex';
        playBtn.textContent = 'Play';
      }
      viewedItems.add(0);
      updateProgress();
    }

    function scrubVideo(event) {
      const video = document.getElementById('html5-video-element');
      const bar = event.currentTarget;
      const rect = bar.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

      bar.querySelector('.video-fill').style.width = (percentage * 100) + '%';

      if (video && video.duration) {
        video.currentTime = video.duration * percentage;
      }

      viewedItems.add(0);
      updateProgress();
    }

    // 19. Lightbox Photo Gallery
    function openGalleryLightbox(index, src) {
      const lightbox = document.getElementById('gallery-lightbox');
      const img = document.getElementById('lightbox-expanded-img');
      const caption = document.getElementById('lightbox-expanded-caption');
      
      img.src = src;
      caption.textContent = 'Custom Asset #' + (index + 1);
      lightbox.style.display = 'flex';
      
      viewedItems.add(index);
      updateProgress();
    }

    // 20. AI Simulation Actions
    function triggerAiGeneration(btn, isQuiz) {
      const outputArea = document.querySelector('.ai-output-area');
      const loader = document.querySelector('.ai-loading-indicator');
      const results = document.querySelector('.ai-results-wrapper');
      const list = document.querySelector('.ai-results-list');
      
      btn.disabled = true;
      outputArea.style.display = 'block';
      loader.style.display = 'flex';
      results.style.display = 'none';
      
      setTimeout(() => {
        loader.style.display = 'none';
        results.style.display = 'block';
        
        list.innerHTML = isQuiz ? 
          '<div class="ai-result-card"><strong>[MCQ] Question 1:</strong> Which design system helps readability?<br><em>Correct Answer:</em> A curated SaaS structure (Vanilla CSS).</div>' +
          '<div class="ai-result-card"><strong>[MCQ] Question 2:</strong> What is a self-contained iframe block?<br><em>Correct Answer:</em> An iframe running srcdoc parameters directly.</div>'
         : 
          '<div class="ai-result-card"><strong>Step 1: Welcome</strong> - User enters and clicks option A.</div>' +
          '<div class="ai-result-card"><strong>Step 2: Conflict</strong> - Chris flags a custom notification.</div>' +
          '<div class="ai-result-card"><strong>Step 3: Outcome</strong> - Project is successfully complete!</div>';
        
        btn.disabled = false;
        viewedItems.add(0);
        updateProgress();
        updateTrackerComplete();
      }, 1500);
    }

    function initializeRiseBlockInteractions() {
      document.querySelectorAll('.accordion-trigger').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
          toggleAccordion(parseInt(trigger.getAttribute('data-idx'), 10));
        });
      });

      document.querySelectorAll('.quiz-block .quiz-option').forEach(function(option) {
        option.addEventListener('click', function() {
          selectQuizOption(parseInt(option.getAttribute('data-idx'), 10), option);
        });
      });

      var quizSubmitBtn = document.querySelector('.quiz-block .quiz-submit-btn');
      if (quizSubmitBtn) quizSubmitBtn.addEventListener('click', submitQuiz);

      document.querySelectorAll('.flip-card').forEach(function(card, idx) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('click', function() {
          card.classList.toggle('flipped');
          viewedItems.add(idx);
          updateProgress();
        });
        card.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
          }
        });
      });

      document.querySelectorAll('.tab-btn').forEach(function(button, idx) {
        button.addEventListener('click', function() {
          selectTab(idx, button);
        });
      });

      document.querySelectorAll('.hotspot-pin').forEach(function(pin) {
        pin.addEventListener('click', function(event) {
          event.stopPropagation();
          toggleHotspot(parseInt(pin.getAttribute('data-idx'), 10), pin);
        });
      });

      document.addEventListener('click', function(event) {
        if (!event.target.closest('.hotspot-pin')) {
          document.querySelectorAll('.hotspot-pin').forEach(function(pin) {
            pin.classList.remove('active');
          });
        }
      });

      document.querySelectorAll('.link-button-item').forEach(function(link) {
        link.addEventListener('click', function() {
          trackLinkClick(parseInt(link.getAttribute('data-idx'), 10));
        });
      });

      document.querySelectorAll('.menu-drawer-item').forEach(function(item) {
        item.addEventListener('click', function() {
          toggleMenuDrawer(parseInt(item.getAttribute('data-idx'), 10), item);
        });
      });

      document.querySelectorAll('.target-btn').forEach(function(button) {
        button.addEventListener('click', function() {
          assignCategory(parseInt(button.getAttribute('data-idx'), 10), button.getAttribute('data-cat'), button);
        });
      });

      var sortingSubmitBtn = document.querySelector('.sorting-activity-container > .quiz-submit-btn');
      if (sortingSubmitBtn) sortingSubmitBtn.addEventListener('click', checkSorting);

      var blanksSubmitBtn = document.querySelector('.fill-blank-container > .quiz-submit-btn');
      if (blanksSubmitBtn) blanksSubmitBtn.addEventListener('click', checkBlanks);

      document.querySelectorAll('.timeline-node').forEach(function(node) {
        node.addEventListener('click', function() {
          selectTimelineNode(parseInt(node.getAttribute('data-idx'), 10), node);
        });
      });

      document.querySelectorAll('.timeline-step').forEach(function(step, idx) {
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', function() {
          document.querySelectorAll('.timeline-step').forEach(function(item) {
            item.classList.remove('active');
          });
          step.classList.add('active');
          viewedItems.add(idx);
          updateProgress();
        });
      });

      var prevProcessBtn = document.getElementById('btn-process-prev');
      var nextProcessBtn = document.getElementById('btn-process-next');
      if (prevProcessBtn) prevProcessBtn.addEventListener('click', function() { moveProcessStep(-1); });
      if (nextProcessBtn) nextProcessBtn.addEventListener('click', function() { moveProcessStep(1); });
      if (document.querySelector('.process-steps-container')) {
        viewedItems.add(0);
        updateProgress();
      }

      document.querySelectorAll('.scenario-choice-btn').forEach(function(button) {
        button.addEventListener('click', function() {
          selectScenarioChoice(parseInt(button.getAttribute('data-choice-idx'), 10), button.getAttribute('data-feedback') || '');
        });
      });

      document.querySelectorAll('.profile-card-item, .info-grid-item').forEach(function(card, idx) {
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', function() {
          card.classList.toggle('active');
          viewedItems.add(idx);
          updateProgress();
        });
      });

      document.querySelectorAll('.pricing-action-btn').forEach(function(button, idx) {
        button.addEventListener('click', function() {
          document.querySelectorAll('.pricing-card-item').forEach(function(card) {
            card.classList.remove('selected');
          });
          document.querySelectorAll('.pricing-action-btn').forEach(function(btn) {
            btn.textContent = 'Choose Plan';
          });
          button.closest('.pricing-card-item').classList.add('selected');
          button.textContent = 'Selected';
          viewedItems.add(idx);
          updateProgress();
        });
      });

      var audioPlayBtn = document.querySelector('.audio-play-btn');
      if (audioPlayBtn) audioPlayBtn.addEventListener('click', function() { toggleAudioPlayback(audioPlayBtn); });
      var audioScrubBar = document.querySelector('.audio-scrub-bar');
      if (audioScrubBar) audioScrubBar.addEventListener('click', scrubAudio);

      var videoOverlay = document.querySelector('.video-overlay-play');
      var videoMiniPlay = document.querySelector('.video-mini-play');
      if (videoOverlay) videoOverlay.addEventListener('click', function() { toggleVideoPlayback(videoOverlay); });
      if (videoMiniPlay) videoMiniPlay.addEventListener('click', function() { toggleVideoPlayback(videoMiniPlay); });
      var videoScrubBar = document.querySelector('.video-timeline-scrub');
      if (videoScrubBar) videoScrubBar.addEventListener('click', scrubVideo);

      document.querySelectorAll('.gallery-item-card').forEach(function(card, idx) {
        card.addEventListener('click', function() {
          openGalleryLightbox(idx, card.getAttribute('data-img'));
        });
      });
      var lightbox = document.getElementById('gallery-lightbox');
      var lightboxClose = document.querySelector('.lightbox-close');
      if (lightboxClose) lightboxClose.addEventListener('click', function() {
        lightbox.style.display = 'none';
      });
      if (lightbox) {
        lightbox.addEventListener('click', function(event) {
          if (event.target === lightbox) lightbox.style.display = 'none';
        });
      }

      var aiGenerateBtn = document.querySelector('.ai-generate-run-btn');
      if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', function() {
          triggerAiGeneration(aiGenerateBtn, aiGenerateBtn.getAttribute('data-is-quiz') === 'true');
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeRiseBlockInteractions);
    } else {
      initializeRiseBlockInteractions();
    }
  </script>
</body>
</html>
    `;
  }

  // Run the initialization
  init();

});
