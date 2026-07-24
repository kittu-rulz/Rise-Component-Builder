import {
  escapeAttribute, escapeHTML, sanitizePreviewConfig, serializeForInlineScript
} from './utilities.js';
import { resolveMediaReferencesForPreview } from './media-storage.js';
import { applyThemeToConfig, getBuiltInTheme, resolveThemeTokens } from './themes.js';

function hexRgb(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(rgb) {
  const channels = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const a = luminance(hexRgb(first) || [0, 0, 0]);
  const b = luminance(hexRgb(second) || [255, 255, 255]);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function readableText(preferred, background) {
  if (contrastRatio(preferred, background) >= 4.5) return preferred;
  return contrastRatio('#000000', background) >= contrastRatio('#FFFFFF', background) ? '#000000' : '#FFFFFF';
}

function renderCustomItemArtwork(item, fallbackMarkup = '') {
  if (!item?.iconImage) return fallbackMarkup;
  const decorative = item.iconDecorative !== false;
  const fit = item.iconFit === 'cover' ? 'cover' : 'contain';
  return `<img class="custom-item-icon" src="${escapeAttribute(item.iconImage)}" alt="${decorative ? '' : escapeAttribute(item.iconAltText || '')}" ${decorative ? 'aria-hidden="true"' : ''} style="object-fit:${fit};">`;
}

export function writePreview(iframe, html) {
  if (!iframe) return;
  iframe.srcdoc = html;
}

export function openPreview(html) {
  const previewWindow = window.open();
  if (!previewWindow) return;
  previewWindow.opener = null;
  previewWindow.document.write(html);
  previewWindow.document.close();
}

export function generateIframeContent(appState, componentRegistry, colorToRgba) {
    const compId = appState.selectedComponent ? appState.selectedComponent.id : 'accordion';
    const theme = appState.activeTheme || getBuiltInTheme();
    const themedConfig = applyThemeToConfig(
      resolveMediaReferencesForPreview(appState.config), theme, appState.componentOverrides
    );
    const c = sanitizePreviewConfig(themedConfig, compId);
    const themeTokens = resolveThemeTokens(theme, appState.componentOverrides);
    const toRgba = colorToRgba;
    
    // Custom Rise Styles based on customization inputs
    const shadowStyle = {
      'none': 'none',
      'soft': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
      'medium': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
      'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
    }[c.shadowDepth];

    const bodyBg = themeTokens.background;
    const textMain = themeTokens.text;
    const textMuted = themeTokens.mutedText;
    const cardBg = themeTokens.surface;
    const borderColor = c.borderOutline ? themeTokens.border : 'transparent';
    const cardBorder = c.borderOutline ? '1px solid var(--border-color)' : 'none';
    const fontStack = themeTokens.fontFamily;
    const headingFontStack = themeTokens.headingFontFamily;
    const fontQuery = [...new Set([fontStack, headingFontStack])]
      .map(font => `family=${font.replaceAll(' ', '+')}:wght@300;400;500;600;700`).join('&amp;');
    const spacingScale = { compact: 0.82, comfortable: 1, spacious: 1.18 }[themeTokens.spacingDensity] || 1;
    const primaryLight = toRgba(c.colorPrimary, 0.12, 'rgba(37, 99, 235, 0.12)');
    const primaryTint = toRgba(c.colorPrimary, 0.05, 'rgba(37, 99, 235, 0.05)');
    const focusRing = toRgba(c.colorPrimary, 0.16, 'rgba(37, 99, 235, 0.16)');
    const accentLight = toRgba(c.colorAccent, 0.14, 'rgba(245, 158, 11, 0.14)');
    const accentTint = toRgba(c.colorAccent, 0.07, 'rgba(245, 158, 11, 0.07)');
    const onPrimary = themeTokens.surface;
    const onAccent = themeTokens.surface;

    // Component-Specific HTML Generator
    let componentHtml = '';
    
    const modularComponent = componentRegistry[compId];
    if (modularComponent) {
      componentHtml = modularComponent.generateHTML(c);
    } else if (compId === 'hotspots') {
      const hotspotImage = c.backgroundImage || '';
      componentHtml = `
        <div class="hotspots-container">
          <div class="hotspot-img-wrapper">
            ${hotspotImage ? `<img class="hotspot-background-image" src="${escapeAttribute(hotspotImage)}" alt="${c.backgroundDecorative ? '' : escapeAttribute(c.backgroundAltText || '')}" ${c.backgroundDecorative ? 'aria-hidden="true"' : ''} style="object-fit:${c.backgroundFit};object-position:${c.backgroundFocalX}% ${c.backgroundFocalY}%;">` : `<svg viewBox="0 0 800 450" class="hotspot-schematic-svg" role="img" aria-label="Schematic pathway map">
              <rect width="100%" height="100%" fill="#F1F5F9" rx="12"></rect>
              <circle cx="400" cy="225" r="100" fill="none" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="10 10"></circle>
              <line x1="100" y1="225" x2="700" y2="225" stroke="#E2E8F0" stroke-width="2"></line>
              <line x1="400" y1="50" x2="400" y2="400" stroke="#E2E8F0" stroke-width="2"></line>
              <text x="400" y="230" text-anchor="middle" fill="#94A3B8" font-size="16" font-weight="600">SCHEMATIC PATHWAY MAP</text>
            </svg>`}
            ${c.items.map((item, idx) => `
              <span class="hotspot-point" style="left: ${item.x || '50'}%; top: ${item.y || '50'}%;">
                <button type="button" class="hotspot-pin" data-idx="${idx}" aria-expanded="false" aria-controls="hotspot-tooltip-${idx}" aria-label="Hotspot ${idx + 1}: ${escapeAttribute(item.title || 'Indicator')}">
                  <span class="pulse" aria-hidden="true"></span>
                  <span class="pin-dot" aria-hidden="true">${idx + 1}</span>
                </button>
                <span class="hotspot-tooltip" id="hotspot-tooltip-${idx}" role="region" aria-label="Hotspot details" aria-hidden="true">
                  <span class="hotspot-tooltip-title">${escapeHTML(item.title || 'Indicator')}</span>
                  <span class="hotspot-tooltip-content">${item.content || 'Details...'}</span>
                </span>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    } else if (compId === 'button-list') {
      componentHtml = `
        <div class="buttons-container">
          ${c.items.map((item, idx) => `
            <a href="${escapeAttribute(item.content || '#')}" target="_blank" rel="noopener noreferrer" class="link-button-item" data-idx="${idx}">
              <span>${escapeHTML(item.title || 'Launch Link')}</span>
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
                  <span class="menu-title">${escapeHTML(item.title || 'Lesson Segment')}</span>
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
        <div class="sorting-activity-container" aria-describedby="sorting-instructions">
          <p id="sorting-instructions" class="sr-only">For each item, choose its category. Then verify the sorting.</p>
          <div class="sorting-card-pool" role="group" aria-label="Items to sort">
            ${c.items.map((item, idx) => `
              <div class="sorting-draggable" id="sort-card-${idx}" data-category="${escapeAttribute(item.category || '')}" role="group" aria-labelledby="sort-label-${idx}">
                <div class="drag-handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                </div>
                <div class="drag-text" id="sort-label-${idx}">${escapeHTML(item.title || 'Sorting Card')}</div>
                <div class="sorting-targets-row">
                  ${categories.map(cat => `
                    <button type="button" class="target-btn" data-idx="${idx}" data-cat="${escapeAttribute(cat)}" aria-pressed="false">Move to ${escapeHTML(cat)}</button>
                  `).join('')}
                </div>
                <div class="sort-status-indicator" role="status" aria-live="polite"></div>
              </div>
            `).join('')}
          </div>
          <div class="sorting-categories-columns">
            ${categories.map((cat, catIdx) => `
              <div class="sorting-column" data-column-cat="${escapeAttribute(cat)}" role="group" aria-labelledby="sorting-column-${catIdx}">
                <div class="column-header" id="sorting-column-${catIdx}">${escapeHTML(cat)}</div>
                <div class="column-dropzone" id="sorting-zone-${catIdx}" aria-live="polite"></div>
              </div>
            `).join('')}
          </div>
          <button type="button" class="quiz-submit-btn">Verify Sorting</button>
          <div id="sorting-feedback-box" class="quiz-feedback" role="status" aria-live="polite" aria-atomic="true" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'fill-blank') {
      componentHtml = `
        <div class="fill-blank-container" aria-describedby="blank-instructions">
          <p id="blank-instructions" class="sr-only">Fill in each blank, then check your answers.</p>
          ${c.items.map((item, idx) => {
            const sentence = item.title || '';
            const blanked = sentence.replace(/\[blank\]/gi, `<input type="text" class="blank-input" data-index="${idx}" aria-label="Answer for sentence ${idx + 1}" aria-describedby="blank-status-${idx}" autocomplete="off">`);
            return `
              <div class="blank-sentence-card">
                <span class="sentence-num">${idx + 1}</span>
                <div class="blank-sentence-content">${blanked}<span id="blank-status-${idx}" class="sr-only" role="status"></span></div>
              </div>
            `;
          }).join('')}
          <button type="button" class="quiz-submit-btn">Check Answers</button>
          <div id="blank-feedback-box" class="quiz-feedback" role="status" aria-live="polite" aria-atomic="true" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'horizontal-timeline') {
      componentHtml = `
        <div class="horizontal-timeline-container">
          <div class="timeline-nodes-row" role="tablist" aria-label="Timeline steps">
            ${c.items.map((item, idx) => `
              <div class="timeline-node ${idx === 0 ? 'active' : ''}" id="timeline-tab-${idx}" data-idx="${idx}" role="tab" tabindex="${idx === 0 ? '0' : '-1'}" aria-selected="${idx === 0}" aria-controls="timeline-slide-${idx}">
                <div class="node-marker"></div>
                <span class="node-label">${escapeHTML(item.title || 'Step')}</span>
              </div>
            `).join('')}
          </div>
          <div class="timeline-slider-box">
            ${c.items.map((item, idx) => `
              <div class="timeline-slide ${idx === 0 ? 'active' : ''}" id="timeline-slide-${idx}" role="tabpanel" aria-labelledby="timeline-tab-${idx}" tabindex="0" ${idx === 0 ? '' : 'hidden'}>
                <h4>${escapeHTML(item.title || 'Phase Header')}</h4>
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
            <span class="step-badge" aria-live="polite" aria-atomic="true">Step <span id="current-process-num">1</span> of ${c.items.length}</span>
            <div class="process-dots">
              ${c.items.map((_, idx) => `<span class="p-dot ${idx === 0 ? 'active' : ''}" aria-hidden="true"></span>`).join('')}
            </div>
          </div>
          <div class="process-slides-wrapper">
            ${c.items.map((item, idx) => `
              <div class="process-slide ${idx === 0 ? 'active' : ''}" id="process-slide-${idx}" role="group" aria-roledescription="step" aria-label="Step ${idx + 1} of ${c.items.length}" tabindex="-1" ${idx === 0 ? '' : 'hidden'}>
                <h3>${escapeHTML(item.title || 'Step Headline')}</h3>
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
              <div class="speech-text" id="scenario-speech">${escapeHTML(q.title)}</div>
            </div>
          </div>
          <div class="scenario-choices-list" id="scenario-choices-box">
            ${choices.map((ch, idx) => `
              <button class="scenario-choice-btn" data-choice-idx="${idx}" data-feedback="${escapeAttribute(ch.content)}">
                ${escapeHTML(ch.title || 'Choice Option')}
              </button>
            `).join('')}
          </div>
          <div id="scenario-feedback-card" class="scenario-feedback-balloon" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" style="display:none;"></div>
        </div>
      `;
    } else if (compId === 'profile-cards') {
      componentHtml = `
        <div class="profiles-grid">
          ${c.items.map((item, idx) => `
            <div class="profile-card-item">
              <div class="profile-avatar-circle ${item.imageCrop === 'square' ? 'square' : ''}">
                ${item.image ? `<img src="${escapeAttribute(item.image)}" alt="${item.decorative ? '' : escapeAttribute(item.altText || '')}" ${item.decorative ? 'aria-hidden="true"' : ''}>` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`}
              </div>
              <div class="profile-card-content">
                <h4>${escapeHTML(item.title || 'Expert Name')}</h4>
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
                ${renderCustomItemArtwork(item, '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>')}
              </div>
              <h4>${escapeHTML(item.title || 'Feature Key')}</h4>
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
                <h4>${escapeHTML(item.title || 'Service Plan')}</h4>
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
      const transcript = c.items[0]?.transcript || '';
      const duration = appState.config.items?.[0]?.contentDuration ?? appState.config.items?.[0]?.content?.duration;
      componentHtml = `
        <div class="audio-player-block">
          <div class="audio-info">
            <div class="audio-art">
              ${renderCustomItemArtwork(c.items[0], '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>')}
            </div>
            <div class="audio-text-labels">
              <h5>${escapeHTML(c.items[0]?.title || 'Instructional Audio Segment')}</h5>
              <p>${Number.isFinite(duration) ? `Duration: ${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s` : 'Duration available after media loads'}</p>
            </div>
          </div>
          <div class="audio-controls-row">
            <button type="button" class="audio-play-btn" aria-label="Play audio" aria-pressed="false">
              <svg class="play-svg" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <svg class="pause-svg" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            </button>
            <div class="audio-scrub-bar" role="slider" tabindex="0" aria-label="Audio position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25" aria-valuetext="25 percent">
              <div class="scrub-fill" style="width: 25%;"></div>
            </div>
            <span class="audio-timer" aria-live="off">0:56</span>
          </div>
          <audio id="html5-audio-element" src="${escapeAttribute(src)}" preload="metadata" style="display:none;"></audio>
          ${transcript ? `<details class="media-transcript"><summary>Transcript</summary><div>${transcript}</div></details>` : '<p class="media-alternative-note sr-only">No transcript has been supplied for this audio.</p>'}
        </div>
      `;
    } else if (compId === 'video-frame') {
      const src = c.items[0]?.content || '';
      const captionsUrl = c.items[0]?.captionsUrl || '';
      const audioDescription = c.items[0]?.audioDescription || '';
      const poster = c.items[0]?.posterImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800';
      componentHtml = `
        <div class="video-player-block">
          <div class="video-wrapper">
            <video id="html5-video-element" poster="${escapeAttribute(poster)}" width="100%" height="auto" controls aria-label="${escapeAttribute(c.items[0]?.title || 'Instructional video')}">
              <source src="${escapeAttribute(src)}" type="video/mp4">
              ${captionsUrl ? `<track kind="captions" src="${escapeAttribute(captionsUrl)}" srclang="en" label="English" default>` : ''}
            </video>
            <button type="button" class="video-overlay-play" aria-label="Play video">
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
          </div>
          <div class="video-control-strip">
            <button type="button" class="video-mini-play" aria-label="Play video" aria-pressed="false">Play</button>
            <div class="video-timeline-scrub" role="slider" tabindex="0" aria-label="Video position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 percent">
              <div class="video-fill" style="width: 0%;"></div>
            </div>
          </div>
          ${audioDescription ? `<details class="media-transcript"><summary>Visual description</summary><div>${audioDescription}</div></details>` : '<p class="media-alternative-note sr-only">No visual description has been supplied for this video.</p>'}
        </div>
      `;
    } else if (compId === 'image-gallery') {
      componentHtml = `
        <div class="gallery-grid">
          ${c.items.map((item, idx) => `
            <button type="button" class="gallery-item-card" data-img="${escapeAttribute(item.content)}" data-caption="${escapeAttribute(item.caption || item.title || `Image ${idx + 1}`)}" data-alt="${item.decorative ? '' : escapeAttribute(item.altText || '')}" aria-haspopup="dialog" aria-controls="gallery-lightbox" aria-label="Open image: ${escapeAttribute(item.title || `Image ${idx + 1}`)}">
              <img src="${escapeAttribute(item.content)}" alt="${item.decorative ? '' : escapeAttribute(item.altText || '')}" ${item.decorative ? 'aria-hidden="true"' : ''} style="object-fit:${item.imageFit === 'contain' ? 'contain' : 'cover'};">
              <div class="gallery-caption-overlay">
                <span>${escapeHTML(item.title || 'View Layout')}</span>
              </div>
            </button>
          `).join('')}
        </div>
        <div id="gallery-lightbox" class="lightbox-overlay" role="dialog" aria-modal="true" aria-labelledby="lightbox-expanded-caption" tabindex="-1" style="display:none;">
          <button type="button" class="lightbox-close" aria-label="Close image dialog">&times;</button>
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
          <div class="ai-prompt-display">"${escapeHTML(promptText)}"</div>
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
                <span>${escapeHTML(item.title || 'Item Title Header')}</span>
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' http: https: data: blob:; media-src 'self' http: https: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'">
  <link href="https://fonts.googleapis.com/css2?${fontQuery}&amp;display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${c.colorPrimary};
      --accent: ${c.colorAccent};
      --primary-hover: ${themeTokens.primaryHover};
      --bg-body: ${bodyBg};
      --bg-card: ${cardBg};
      --text-main: ${textMain};
      --text-muted: ${textMuted};
      --border-color: ${borderColor};
      --border-radius: ${c.borderRadius}px;
      --button-radius: ${themeTokens.buttonRadius}px;
      --border-style: ${cardBorder};
      --shadow-style: ${shadowStyle};
      --font-family: '${fontStack}', sans-serif;
      --heading-font-family: '${headingFontStack}', sans-serif;
      --spacing-scale: ${spacingScale};
      --animation-speed: ${themeTokens.animationSpeed}ms;
      --primary-light: ${primaryLight};
      --primary-tint: ${primaryTint};
      --focus-ring: ${focusRing};
      --accent-light: ${accentLight};
      --accent-tint: ${accentTint};
      --success: ${themeTokens.success};
      --warning: ${themeTokens.warning};
      --danger: ${themeTokens.danger};
      --on-primary: ${onPrimary};
      --on-accent: ${onAccent};
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
      --shadow-lg: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--font-family);
      background-color: var(--bg-body);
      color: var(--text-main);
      padding: calc(30px * var(--spacing-scale));
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      transition: background-color var(--animation-speed) ease;
    }

    button { border-radius: var(--button-radius); }
    
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
      white-space: pre-line;
    }
    
    .block-headline {
      font-family: var(--heading-font-family);
      white-space: pre-line;
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

    .quiz-options {
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
      border-radius: var(--button-radius);
      border: none;
      background-color: var(--primary);
      color: var(--on-primary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--animation-speed);
    }
    
    .quiz-submit-btn:hover {
      background-color: var(--primary-hover);
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

    .card-icon-badge .custom-item-icon {
      width: 32px;
      height: 32px;
      border-radius: calc(var(--border-radius) / 2);
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
      color: var(--on-primary);
      transform: rotateY(180deg);
    }
    
    .flip-card-back h3 {
      color: var(--on-primary);
    }
    
    .flip-card-back p {
      color: var(--on-primary);
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
      color: var(--on-accent);
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
    .hotspot-background-image {
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      display: block;
      background: var(--bg-body);
    }
    .hotspot-point {
      position: absolute;
      width: 28px;
      height: 28px;
      transform: translate(-50%, -50%);
      z-index: 10;
    }
    .hotspot-pin {
      position: relative;
      width: 28px;
      height: 28px;
      background-color: var(--accent);
      border: 2px solid #FFFFFF;
      color: var(--on-accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 1;
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
    .hotspot-pin.active + .hotspot-tooltip {
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
    .hotspot-tooltip-title {
      display: block;
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
    .hotspot-tooltip-content {
      display: block;
      font-size: 11px;
      line-height: 1.4;
      color: #CBD5E1;
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
      color: var(--on-primary);
      padding: 12px 20px;
      border-radius: var(--button-radius);
      box-shadow: var(--shadow-style);
      font-size: 13px;
      font-weight: 600;
      transition: all var(--animation-speed);
      border: var(--border-style);
    }
    .link-button-item:hover {
      transform: translateY(-2px);
      background-color: var(--primary-hover);
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
      color: var(--on-accent);
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
      overflow: hidden;
    }
    .profile-avatar-circle.square { border-radius: calc(var(--border-radius) / 2); }
    .profile-avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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
    .info-grid-icon .custom-item-icon {
      width: 42px;
      height: 42px;
      border-radius: calc(var(--border-radius) / 2);
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
      color: var(--on-accent);
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
      transition: all var(--animation-speed);
    }
    .pricing-card-item.premium-highlight .pricing-action-btn {
      background-color: var(--primary);
      border-color: var(--primary);
      color: var(--on-primary);
    }
    .pricing-action-btn:hover {
      border-color: var(--primary-hover);
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
      overflow: hidden;
    }
    .audio-art .custom-item-icon { width: 100%; height: 100%; }
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
      color: var(--on-primary);
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

    [hidden] { display: none !important; }

    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    :where(button, [href], input, [tabindex]:not([tabindex="-1"])):focus-visible {
      outline: 3px solid var(--primary);
      outline-offset: 3px;
      box-shadow: 0 0 0 2px var(--bg-card);
    }

    .gallery-item-card,
    .video-overlay-play {
      padding: 0;
      font: inherit;
    }
    .gallery-item-card { background: var(--bg-card); color: inherit; }
    .video-overlay-play { border: 0; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      .flip-card-inner { transform: none !important; }
      .flip-card-front, .flip-card-back { transition: none !important; }
      .flip-card.flipped .flip-card-front { display: none; }
      .flip-card:not(.flipped) .flip-card-back { display: none; }
      .hotspot-pin .pulse { display: none; }
    }

    @media (forced-colors: active) {
      :where(button, [role="button"], [role="radio"], [role="tab"], input) { border: 1px solid ButtonText; }
      :where(button, [role="button"], [role="radio"], [role="tab"], input):focus-visible { outline: 3px solid Highlight; }
      .progress-fill, .scrub-fill, .video-fill { background: Highlight; }
    }
  </style>
</head>
<body>
  
  <main class="rise-block-wrapper" aria-labelledby="block-headline">
    <div class="block-header">
      <div class="block-label">${escapeHTML(c.blockTitle)}</div>
      <h1 class="block-headline" id="block-headline">${escapeHTML(c.blockHeadline)}</h1>
      <div class="block-desc">${escapeHTML(c.blockDesc)}</div>
    </div>
    
    <div class="block-content">
      ${componentHtml}
    </div>

    ${c.trackCompletion ? `
      <div class="completion-tracker" aria-labelledby="completion-label">
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:600;">
          <span id="completion-label">Progress Completion</span>
          <span id="completion-text" aria-hidden="true">0%</span>
        </div>
        <div class="progress-bar-container" role="progressbar" aria-labelledby="completion-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 percent complete">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
    ` : ''}
    <div id="interaction-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  </main>

  <script>
    // Live JS Interactions inside emulated Rise lesson block
    
    // 1. Accordion trigger
    var multiOpen = ${c.accordionMulti};
    var allowAnimation = ${c.accordionAnimation};
    var viewedItems = window.viewedItems || new Set();
    var totalItems = ${trackableCount};
    var completionAnnounced = false;
    var completionMessage = ${serializeForInlineScript(c.completionMsg || 'Activity complete!')};

    function announce(message) {
      const status = document.getElementById('interaction-status');
      if (!status) return;
      status.textContent = '';
      window.setTimeout(function() { status.textContent = message; }, 20);
    }

    function setProgressAccessibility(percent) {
      const progress = document.querySelector('.progress-bar-container[role="progressbar"]');
      if (progress) {
        progress.setAttribute('aria-valuenow', String(percent));
        progress.setAttribute('aria-valuetext', percent + ' percent complete');
      }
      if (percent === 100 && !completionAnnounced) {
        completionAnnounced = true;
        announce(completionMessage);
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage({ type: 'RISE_BLOCK_COMPLETE', status: 'completed' }, '*');
        }
      }
    }

    function toggleAccordion(index) {
      const item = document.getElementById('item-' + index);
      const isCurrentlyActive = item.classList.contains('active');
      
      if (!multiOpen) {
        // Close all others
        document.querySelectorAll('.accordion-item').forEach(el => {
          el.classList.remove('active');
          const panel = el.querySelector('.accordion-content');
          const trigger = el.querySelector('.accordion-trigger');
          if (panel) {
            panel.style.maxHeight = null;
            panel.setAttribute('aria-hidden', 'true');
          }
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
      
      const contentPanel = item.querySelector('.accordion-content');
      
      if (isCurrentlyActive) {
        item.classList.remove('active');
        contentPanel.style.maxHeight = null;
        contentPanel.setAttribute('aria-hidden', 'true');
        item.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        contentPanel.style.maxHeight = contentPanel.scrollHeight + "px";
        contentPanel.setAttribute('aria-hidden', 'false');
        item.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'true');
        
        // Track viewed
        viewedItems.add(index);
        updateProgress();
      }
    }

    // 2. Quiz trigger
    var selectedOptionIndex = null;
    var quizOptions = ${serializeForInlineScript(c.items)};

    function selectQuizOption(index, element) {
      selectedOptionIndex = index;
      document.querySelectorAll('.quiz-option').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-checked', 'false');
        el.setAttribute('tabindex', '-1');
      });
      element.classList.add('selected');
      element.setAttribute('aria-checked', 'true');
      element.setAttribute('tabindex', '0');
    }

    function submitQuiz() {
      const feedback = document.getElementById('quiz-feedback-box');
      if (selectedOptionIndex === null) {
        feedback.style.display = 'block';
        feedback.className = 'quiz-feedback wrong';
        feedback.innerHTML = '<strong>Select an option first.</strong>';
        return;
      }
      
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
      setProgressAccessibility(percent);
      
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
      setProgressAccessibility(100);
    }

    // 5. Tabs Block
    function selectTab(index, button) {
      const container = button.closest('.tabs-container');
      container.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });
      container.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.hidden = true;
      });
      
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      button.setAttribute('tabindex', '0');
      const panel = container.querySelector('#tab-panel-' + index);
      panel.hidden = false;
      panel.classList.add('active');
      
      viewedItems.add(index);
      updateProgress();
    }

    // 6. Hotspots
    function toggleHotspot(index, pin) {
      const isCurrentlyActive = pin.classList.contains('active');
      document.querySelectorAll('.hotspot-pin').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-expanded', 'false');
        const tooltip = p.parentElement.querySelector('.hotspot-tooltip');
        if (tooltip) tooltip.setAttribute('aria-hidden', 'true');
      });
      
      if (!isCurrentlyActive) {
        pin.classList.add('active');
        pin.setAttribute('aria-expanded', 'true');
        const tooltip = pin.parentElement.querySelector('.hotspot-tooltip');
        if (tooltip) tooltip.setAttribute('aria-hidden', 'false');
        if (tooltip) announce(tooltip.textContent.trim());
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
        targetBtn.setAttribute('aria-pressed', String(targetBtn === btn));
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
      var originalCards = ${serializeForInlineScript(c.items)};
      
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
      var solutions = ${serializeForInlineScript(c.items)};
      
      blanks.forEach(input => {
        const idx = parseInt(input.getAttribute('data-index'));
        const userVal = input.value.trim().toLowerCase();
        const correctVal = solutions[idx].content.trim().toLowerCase();
        
        if (userVal === correctVal) {
          input.style.borderBottomColor = 'var(--success)';
          input.style.color = 'var(--success)';
          input.setAttribute('aria-invalid', 'false');
          document.getElementById('blank-status-' + idx).textContent = 'Correct';
        } else {
          allCorrect = false;
          input.style.borderBottomColor = 'var(--danger)';
          input.style.color = 'var(--danger)';
          input.setAttribute('aria-invalid', 'true');
          document.getElementById('blank-status-' + idx).textContent = 'Incorrect';
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
      
    }

    // 11. Horizontal Timeline
    function selectTimelineNode(index, node) {
      const container = node.closest('.horizontal-timeline-container');
      container.querySelectorAll('.timeline-node').forEach(n => {
        n.classList.remove('active');
        n.setAttribute('aria-selected', 'false');
        n.setAttribute('tabindex', '-1');
      });
      container.querySelectorAll('.timeline-slide').forEach(s => {
        s.classList.remove('active');
        s.hidden = true;
      });
      
      node.classList.add('active');
      node.setAttribute('aria-selected', 'true');
      node.setAttribute('tabindex', '0');
      const slide = container.querySelector('#timeline-slide-' + index);
      slide.hidden = false;
      slide.classList.add('active');
      
      viewedItems.add(index);
      updateProgress();
    }

    // 12. Process Step-by-Step Flow
    var activeProcessIndex = window.activeProcessIndex || 0;
    var totalProcessSteps = ${c.items.length};
    function moveProcessStep(direction) {
      const nextIdx = activeProcessIndex + direction;
      if (nextIdx < 0 || nextIdx >= totalProcessSteps) return;
      
      document.querySelectorAll('.process-slide').forEach(s => {
        s.classList.remove('active');
        s.hidden = true;
      });
      document.querySelectorAll('.p-dot').forEach(d => d.classList.remove('active'));
      
      activeProcessIndex = nextIdx;
      
      const activeSlide = document.getElementById('process-slide-' + activeProcessIndex);
      activeSlide.hidden = false;
      activeSlide.classList.add('active');
      document.querySelectorAll('.p-dot')[activeProcessIndex].classList.add('active');
      document.getElementById('current-process-num').textContent = activeProcessIndex + 1;
      
      // Toggle disabled states
      document.getElementById('btn-process-prev').disabled = (activeProcessIndex === 0);
      document.getElementById('btn-process-next').disabled = (activeProcessIndex === totalProcessSteps - 1);
      announce('Step ' + (activeProcessIndex + 1) + ' of ' + totalProcessSteps + ': ' + activeSlide.querySelector('h3').textContent);
      
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
        btn.setAttribute('aria-label', 'Pause audio');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        audio.pause();
        playSvg.style.display = 'block';
        pauseSvg.style.display = 'none';
        btn.style.backgroundColor = 'var(--primary)';
        btn.setAttribute('aria-label', 'Play audio');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
    
    function scrubAudio(event) {
      const bar = event.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const percentage = (clickX / width) * 100;
      
      bar.querySelector('.scrub-fill').style.width = percentage + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(percentage)));
      bar.setAttribute('aria-valuetext', Math.round(percentage) + ' percent');
      const audio = document.getElementById('html5-audio-element');
      if (audio && audio.duration) audio.currentTime = audio.duration * percentage / 100;
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
        playBtn.setAttribute('aria-label', 'Pause video');
        playBtn.setAttribute('aria-pressed', 'true');
      } else {
        video.pause();
        overlayPlay.style.display = 'flex';
        playBtn.textContent = 'Play';
        playBtn.setAttribute('aria-label', 'Play video');
        playBtn.setAttribute('aria-pressed', 'false');
      }
    }

    function scrubVideo(event) {
      const video = document.getElementById('html5-video-element');
      const bar = event.currentTarget;
      const rect = bar.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

      bar.querySelector('.video-fill').style.width = (percentage * 100) + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(percentage * 100)));
      bar.setAttribute('aria-valuetext', Math.round(percentage * 100) + ' percent');

      if (video && video.duration) {
        video.currentTime = video.duration * percentage;
      }

    }

    // 19. Lightbox Photo Gallery
    var galleryReturnFocus = null;
    function openGalleryLightbox(index, src, trigger) {
      const lightbox = document.getElementById('gallery-lightbox');
      const img = document.getElementById('lightbox-expanded-img');
      const caption = document.getElementById('lightbox-expanded-caption');
      
      img.src = src;
      img.alt = trigger ? trigger.getAttribute('data-alt') || '' : '';
      caption.textContent = trigger ? trigger.getAttribute('data-caption') || ('Image ' + (index + 1)) : ('Image ' + (index + 1));
      lightbox.style.display = 'flex';
      galleryReturnFocus = trigger || document.activeElement;
      lightbox.focus();
      
      viewedItems.add(index);
      updateProgress();
    }

    function closeGalleryLightbox() {
      const lightbox = document.getElementById('gallery-lightbox');
      if (!lightbox || lightbox.style.display === 'none') return;
      lightbox.style.display = 'none';
      if (galleryReturnFocus) galleryReturnFocus.focus();
    }

    function changeSliderByKeyboard(event, mediaType) {
      if (!['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const slider = event.currentTarget;
      let value = Number(slider.getAttribute('aria-valuenow')) || 0;
      if (event.key === 'Home') value = 0;
      else if (event.key === 'End') value = 100;
      else value += (event.key === 'ArrowRight' || event.key === 'ArrowUp') ? 5 : -5;
      value = Math.max(0, Math.min(100, value));
      slider.setAttribute('aria-valuenow', String(value));
      slider.setAttribute('aria-valuetext', value + ' percent');
      const fill = slider.querySelector(mediaType === 'audio' ? '.scrub-fill' : '.video-fill');
      if (fill) fill.style.width = value + '%';
      const media = document.getElementById(mediaType === 'audio' ? 'html5-audio-element' : 'html5-video-element');
      if (media && media.duration) media.currentTime = media.duration * value / 100;
    }

    function formatMediaTime(seconds) {
      if (!Number.isFinite(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      return minutes + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
    }

    function syncMediaProgress(media, slider, fill, timer) {
      if (!media || !slider || !media.duration) return;
      const value = Math.max(0, Math.min(100, media.currentTime / media.duration * 100));
      slider.setAttribute('aria-valuenow', String(Math.round(value)));
      slider.setAttribute('aria-valuetext', formatMediaTime(media.currentTime) + ' of ' + formatMediaTime(media.duration));
      if (fill) fill.style.width = value + '%';
      if (timer) timer.textContent = formatMediaTime(media.currentTime);
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
        option.addEventListener('keydown', function(event) {
          const options = Array.from(document.querySelectorAll('.quiz-block .quiz-option'));
          const current = options.indexOf(option);
          let next = current;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % options.length;
          else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + options.length) % options.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = options.length - 1;
          else if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            selectQuizOption(current, option);
            return;
          } else return;
          event.preventDefault();
          selectQuizOption(next, options[next]);
          options[next].focus();
        });
      });

      var quizSubmitBtn = document.querySelector('.quiz-block .quiz-submit-btn');
      if (quizSubmitBtn) quizSubmitBtn.addEventListener('click', submitQuiz);

      document.querySelectorAll('.flip-card').forEach(function(card, idx) {
        card.addEventListener('click', function() {
          card.classList.toggle('flipped');
          const flipped = card.classList.contains('flipped');
          card.setAttribute('aria-expanded', String(flipped));
          card.setAttribute('aria-label', (flipped ? 'Hide back of ' : 'Reveal back of ') + card.querySelector('.flip-card-front h3').textContent);
          card.querySelector('.flip-card-front').setAttribute('aria-hidden', String(flipped));
          card.querySelector('.flip-card-back').setAttribute('aria-hidden', String(!flipped));
          announce(flipped ? 'Card back revealed' : 'Card front shown');
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
        button.addEventListener('keydown', function(event) {
          const tabs = Array.from(button.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
          let next = idx;
          if (event.key === 'ArrowRight') next = (idx + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          selectTab(next, tabs[next]);
          tabs[next].focus();
        });
      });

      document.querySelectorAll('.hotspot-pin').forEach(function(pin) {
        pin.addEventListener('click', function(event) {
          event.stopPropagation();
          toggleHotspot(parseInt(pin.getAttribute('data-idx'), 10), pin);
        });
        pin.addEventListener('keydown', function(event) {
          if (event.key === 'Escape' && pin.classList.contains('active')) {
            event.preventDefault();
            toggleHotspot(parseInt(pin.getAttribute('data-idx'), 10), pin);
          }
        });
      });

      document.addEventListener('click', function(event) {
        if (!event.target.closest('.hotspot-pin')) {
          document.querySelectorAll('.hotspot-pin').forEach(function(pin) {
            pin.classList.remove('active');
            pin.setAttribute('aria-expanded', 'false');
            const tooltip = pin.parentElement.querySelector('.hotspot-tooltip');
            if (tooltip) tooltip.setAttribute('aria-hidden', 'true');
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
        node.addEventListener('keydown', function(event) {
          const nodes = Array.from(node.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
          const current = nodes.indexOf(node);
          let next = current;
          if (event.key === 'ArrowRight') next = (current + 1) % nodes.length;
          else if (event.key === 'ArrowLeft') next = (current - 1 + nodes.length) % nodes.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = nodes.length - 1;
          else return;
          event.preventDefault();
          selectTimelineNode(next, nodes[next]);
          nodes[next].focus();
        });
      });

      document.querySelectorAll('.timeline-step').forEach(function(step, idx) {
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', function() {
          document.querySelectorAll('.timeline-step').forEach(function(item) {
            item.classList.remove('active');
          });
          step.classList.add('active');
          document.querySelectorAll('.timeline-step').forEach(function(item) { item.setAttribute('aria-pressed', String(item === step)); });
          viewedItems.add(idx);
          updateProgress();
        });
        step.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            step.click();
          }
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
      var audioElement = document.getElementById('html5-audio-element');
      if (audioElement) audioElement.addEventListener('ended', function() { viewedItems.add(0); updateProgress(); });
      var audioScrubBar = document.querySelector('.audio-scrub-bar');
      if (audioScrubBar) audioScrubBar.addEventListener('click', scrubAudio);
      if (audioScrubBar) audioScrubBar.addEventListener('keydown', function(event) { changeSliderByKeyboard(event, 'audio'); });
      if (audioElement) audioElement.addEventListener('timeupdate', function() {
        syncMediaProgress(audioElement, audioScrubBar, audioScrubBar && audioScrubBar.querySelector('.scrub-fill'), document.querySelector('.audio-timer'));
      });
      if (audioElement) audioElement.addEventListener('ended', function() {
        if (audioPlayBtn) {
          audioPlayBtn.setAttribute('aria-label', 'Play audio');
          audioPlayBtn.setAttribute('aria-pressed', 'false');
        }
      });

      var videoOverlay = document.querySelector('.video-overlay-play');
      var videoMiniPlay = document.querySelector('.video-mini-play');
      var videoElement = document.getElementById('html5-video-element');
      if (videoOverlay) videoOverlay.addEventListener('click', function() { toggleVideoPlayback(videoOverlay); });
      if (videoMiniPlay) videoMiniPlay.addEventListener('click', function() { toggleVideoPlayback(videoMiniPlay); });
      var videoScrubBar = document.querySelector('.video-timeline-scrub');
      if (videoScrubBar) videoScrubBar.addEventListener('click', scrubVideo);
      if (videoScrubBar) videoScrubBar.addEventListener('keydown', function(event) { changeSliderByKeyboard(event, 'video'); });
      if (videoElement) videoElement.addEventListener('ended', function() { viewedItems.add(0); updateProgress(); });
      if (videoElement) videoElement.addEventListener('timeupdate', function() {
        syncMediaProgress(videoElement, videoScrubBar, videoScrubBar && videoScrubBar.querySelector('.video-fill'));
      });
      if (videoElement) videoElement.addEventListener('play', function() {
        if (videoOverlay) videoOverlay.style.display = 'none';
        if (videoMiniPlay) {
          videoMiniPlay.textContent = 'Pause';
          videoMiniPlay.setAttribute('aria-label', 'Pause video');
          videoMiniPlay.setAttribute('aria-pressed', 'true');
        }
      });
      if (videoElement) videoElement.addEventListener('pause', function() {
        if (videoOverlay && !videoElement.ended) videoOverlay.style.display = 'flex';
        if (videoMiniPlay) {
          videoMiniPlay.textContent = 'Play';
          videoMiniPlay.setAttribute('aria-label', 'Play video');
          videoMiniPlay.setAttribute('aria-pressed', 'false');
        }
      });

      document.querySelectorAll('.gallery-item-card').forEach(function(card, idx) {
        card.addEventListener('click', function() {
          openGalleryLightbox(idx, card.getAttribute('data-img'), card);
        });
      });
      var lightbox = document.getElementById('gallery-lightbox');
      var lightboxClose = document.querySelector('.lightbox-close');
      if (lightboxClose) lightboxClose.addEventListener('click', function() {
        closeGalleryLightbox();
      });
      if (lightbox) {
        lightbox.addEventListener('click', function(event) {
          if (event.target === lightbox) closeGalleryLightbox();
        });
        lightbox.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeGalleryLightbox();
          }
          if (event.key === 'Tab') {
            const close = lightbox.querySelector('.lightbox-close');
            event.preventDefault();
            close.focus();
          }
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
