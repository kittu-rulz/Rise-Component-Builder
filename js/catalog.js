import { getEditorSchema } from './editor-schemas.js';

export const componentCatalog = [
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
      id: 'multiple-select',
      title: 'Multiple Select Check',
      desc: 'Select-all-that-apply knowledge check where more than one answer option can be correct.',
      category: 'knowledge',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><path d="M5 6.5l1 1 2-2"></path><rect x="14" y="3" width="7" height="7" rx="1"></rect><path d="M16 6.5l1 1 2-2"></path><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`
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

componentCatalog.forEach(component => {
  component.editorSchema = getEditorSchema(component.id);
});

export function filterCatalog(catalog, { activeCategory, searchQuery, favorites }) {
  let filtered = activeCategory === 'favorites'
    ? catalog.filter(item => favorites.has(item.id))
    : catalog.filter(item => item.category === activeCategory);

  if (searchQuery) {
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(searchQuery) ||
      item.desc.toLowerCase().includes(searchQuery)
    );
  }
  return filtered;
}

export function createCatalogCard(component, onSelect) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'component-select-card';
  card.setAttribute('aria-label', `${component.title}: ${component.desc}`);
  card.innerHTML = `
    <div class="card-icon-container" aria-hidden="true">${component.icon}</div>
    <h3>${component.title}</h3>
    <p>${component.desc}</p>
    <div class="card-footer">
      <span class="card-tag">${component.category}</span>
      <span class="card-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
    </div>`;
  card.addEventListener('click', () => onSelect(component));
  return card;
}
