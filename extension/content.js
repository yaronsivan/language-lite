// Content script - runs on every page
// Wrap in IIFE to avoid redeclaration errors when injected multiple times
(function() {
  // Check if already initialized
  if (window.__languageLiteInitialized) return;
  window.__languageLiteInitialized = true;

  let selectedText = '';
  let selectionRange = null;
  let processingInterval = null;
  let processingWordIndex = 0;
  const PROCESSING_WORDS = ['Reading', 'Analyzing', 'Modifying', 'Reviewing', 'Adapting', 'Highlighting'];

  // Language detection functions
  function detectPageLanguage() {
    // First try HTML lang attribute
    const htmlLang = document.documentElement.lang || document.querySelector('html')?.getAttribute('lang');
    if (htmlLang) {
      const langCode = htmlLang.split('-')[0].toLowerCase();
      const langName = mapLanguageCodeToName(langCode);
      if (langName) {
        console.log('Detected page language from HTML:', langName);
        return langName;
      }
    }

    // Try meta tags
    const metaLang = document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
                    document.querySelector('meta[name="language"]')?.getAttribute('content');
    if (metaLang) {
      const langCode = metaLang.split('-')[0].toLowerCase();
      const langName = mapLanguageCodeToName(langCode);
      if (langName) {
        console.log('Detected page language from meta:', langName);
        return langName;
      }
    }

    // Try to detect from selected text content
    if (selectedText) {
      const detectedLang = detectLanguageFromText(selectedText);
      if (detectedLang) {
        console.log('Detected page language from text content:', detectedLang);
        return detectedLang;
      }
    }

    console.log('Could not detect page language, using fallback');
    return null;
  }

  function mapLanguageCodeToName(code) {
    const langMap = {
      'he': 'Hebrew', 'ar': 'Arabic', 'es': 'Spanish', 'fr': 'French', 
      'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch',
      'pl': 'Polish', 'ru': 'Russian', 'uk': 'Ukrainian', 'cs': 'Czech',
      'ro': 'Romanian', 'hu': 'Hungarian', 'sv': 'Swedish', 'no': 'Norwegian',
      'da': 'Danish', 'fi': 'Finnish', 'el': 'Greek', 'tr': 'Turkish',
      'hi': 'Hindi', 'bn': 'Bengali', 'ur': 'Urdu', 'fa': 'Persian',
      'zh': 'Chinese (Simplified)', 'ja': 'Japanese', 'ko': 'Korean',
      'vi': 'Vietnamese', 'th': 'Thai', 'id': 'Indonesian', 'ms': 'Malay',
      'tl': 'Tagalog', 'sw': 'Swahili', 'yo': 'Yoruba', 'zu': 'Zulu',
      'am': 'Amharic', 'en': 'English'
    };
    return langMap[code] || null;
  }

  function detectLanguageFromText(text) {
    // Simple character-based detection for common scripts
    const hebrew = /[\u0590-\u05FF]/.test(text);
    const arabic = /[\u0600-\u06FF]/.test(text);
    const chinese = /[\u4E00-\u9FFF]/.test(text);
    const japanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
    const korean = /[\uAC00-\uD7AF]/.test(text);
    const cyrillic = /[\u0400-\u04FF]/.test(text);
    const greek = /[\u0370-\u03FF]/.test(text);
    const thai = /[\u0E00-\u0E7F]/.test(text);

    if (hebrew) return 'Hebrew';
    if (arabic) return 'Arabic';
    if (chinese) return 'Chinese (Simplified)';
    if (japanese) return 'Japanese';
    if (korean) return 'Korean';
    if (cyrillic) return 'Russian'; // Could be other Cyrillic languages
    if (greek) return 'Greek';
    if (thai) return 'Thai';

    return null; // Can't detect from text alone
  }

  // Helper function to check if extension context is valid
  function isExtensionContextValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (error) {
      return false;
    }
  }

  // Store selected text whenever selection changes
  document.addEventListener('selectionchange', () => {
    if (!isExtensionContextValid()) return;
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.length > 0) {
      selectedText = text;
      // Store in chrome storage for persistence
      try {
        chrome.storage.local.set({ lastSelectedText: text });
      } catch (error) {
        console.log('Extension context invalidated, skipping storage');
      }
    }
  });

  // Listen for text selection with mouse
  document.addEventListener('mouseup', () => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      if (!isExtensionContextValid()) {
        console.log('Extension context invalidated, skipping mouseup handler');
        return;
      }
      
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      console.log('Selection detected:', { textLength: text.length, text: text.substring(0, 50) });
      
      if (text && text.length > 10) {
        selectedText = text;
        selectionRange = selection.getRangeAt(0);
        try {
          chrome.storage.local.set({ lastSelectedText: text });
        } catch (error) {
          console.log('Extension context invalidated, skipping storage');
        }
        
        console.log('Showing adapt button for text:', text.substring(0, 30));
        // Show floating button near selection
        showAdaptButton(selection);
      } else {
        hideAdaptButton();
      }
    }, 100);
  });

  // Create floating button
  function showAdaptButton(selection) {
    console.log('showAdaptButton called');
    hideAdaptButton(); // Remove any existing button
    
    const button = document.createElement('div');
    button.id = 'language-lite-adapt-btn';
    button.innerHTML = '📚';
    button.title = 'Adapt with Language Lite';
    
    // Position button near selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    console.log('Button position:', { left: rect.left, top: rect.top });
    
    button.style.position = 'fixed';
    button.style.left = `${rect.left}px`;
    button.style.top = `${rect.top - 40}px`;
    button.style.zIndex = '999999';
    
    button.addEventListener('click', (e) => {
      console.log('Book button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      
      // Hide the button immediately and clear selection to prevent recreation
      hideAdaptButton();
      window.getSelection().removeAllRanges();
      
      // Show loading sidebar first
      showLoadingSidebar(selectedText);
      // Then send message to background to adapt
      if (isExtensionContextValid()) {
        try {
          chrome.runtime.sendMessage({
            action: 'adaptText',
            text: selectedText
          }, response => {
            console.log('Response from background:', response);
            console.log('Response success:', response?.success);
            console.log('Response adaptedText:', response?.adaptedText?.substring(0, 100));
            console.log('Response vocabulary:', response?.vocabulary);
            console.log('Response error:', response?.error);
            
            if (response && response.success) {
              showAdaptedContent(response.adaptedText, response.vocabulary);
            } else {
              // Handle error - show in sidebar
              const sidebarContent = document.querySelector('.ll-sidebar-content');
              if (sidebarContent) {
                sidebarContent.innerHTML = `
                  <div class="ll-error-container">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <p style="color: #dc2626; font-weight: 600;">Failed to adapt text</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Error: ${response?.error || 'Unknown error'}</p>
                  </div>
                `;
              }
            }
          });
        } catch (error) {
          console.log('Extension context invalidated, cannot send message');
        }
      }
    });
    
    document.body.appendChild(button);
    console.log('Button added to body:', button);
  }

  function hideAdaptButton() {
    const existingButton = document.getElementById('language-lite-adapt-btn');
    if (existingButton) {
      existingButton.remove();
    }
  }


  // Show loading sidebar
  function showLoadingSidebar(text) {
    // Remove existing sidebar if any
    const existing = document.getElementById('language-lite-sidebar');
    if (existing) {
      closeSidebar();
    }
    
    // Push page content to the left to make room for sidebar
    pushPageContent();
    
    const sidebar = document.createElement('div');
    sidebar.id = 'language-lite-sidebar';
    sidebar.innerHTML = `
      <div class="ll-sidebar-header">
        <span class="ll-logo">📚</span>
        <h3>Language Lite</h3>
        <button id="ll-close-sidebar">✕</button>
      </div>
      <div class="ll-sidebar-content">
        <div class="ll-loading-container">
          <div class="ll-processing-animation">
            <span id="ll-processing-word">Reading</span>
            <span class="ll-processing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
          <div class="ll-text-preview">${text.substring(0, 150)}${text.length > 150 ? '...' : ''}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(sidebar);
    
    // Start processing animation
    startProcessingAnimation();
    
    // Add close functionality
    document.getElementById('ll-close-sidebar').addEventListener('click', () => {
      closeSidebar();
    });
  }

  // Push page content to make room for sidebar
  function pushPageContent() {
    const body = document.body;
    const html = document.documentElement;
    
    // Add transition for smooth animation
    body.style.transition = 'margin-right 0.3s ease';
    html.style.transition = 'margin-right 0.3s ease';
    
    // Push content left by sidebar width (400px)
    body.style.marginRight = '400px';
    
    // Also handle fixed elements that might not move with body margin
    const fixedElements = document.querySelectorAll('*');
    fixedElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      if (styles.position === 'fixed') {
        el.style.transition = 'transform 0.3s ease';
        el.style.transform = 'translateX(-400px)';
        el.classList.add('ll-shifted-element');
      }
    });
  }

  // Restore page layout
  function restorePageContent() {
    const body = document.body;
    const html = document.documentElement;
    
    // Restore original margins
    body.style.marginRight = '';
    
    // Restore fixed elements
    const shiftedElements = document.querySelectorAll('.ll-shifted-element');
    shiftedElements.forEach(el => {
      el.style.transform = '';
      el.style.transition = '';
      el.classList.remove('ll-shifted-element');
    });
    
    // Remove transitions after animation completes
    setTimeout(() => {
      body.style.transition = '';
      html.style.transition = '';
    }, 300);
  }

  // Close sidebar and restore layout
  function closeSidebar() {
    stopProcessingAnimation();
    const sidebar = document.getElementById('language-lite-sidebar');
    if (sidebar) {
      sidebar.remove();
    }
    restorePageContent();
  }

  // Start processing animation
  function startProcessingAnimation() {
    processingWordIndex = 0;
    processingInterval = setInterval(() => {
      const wordElement = document.getElementById('ll-processing-word');
      if (wordElement) {
        processingWordIndex = (processingWordIndex + 1) % PROCESSING_WORDS.length;
        wordElement.textContent = PROCESSING_WORDS[processingWordIndex];
      }
    }, 800);
  }

  // Stop processing animation
  function stopProcessingAnimation() {
    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
    }
  }

  // Show adapted content with vocabulary highlighting
  function showAdaptedContent(adaptedText, vocabulary) {
    stopProcessingAnimation();
    
    const sidebarContent = document.querySelector('.ll-sidebar-content');
    if (!sidebarContent) {
      // If no sidebar exists, create one first
      showLoadingSidebar('Loading...');
      setTimeout(() => showAdaptedContent(adaptedText, vocabulary), 100);
      return;
    }
    
    // Process text to highlight vocabulary
    let highlightedText = adaptedText;
    const vocabMap = {};
    
    if (vocabulary && vocabulary.length > 0) {
      console.log('Processing vocabulary:', vocabulary);
      vocabulary.forEach(item => {
        vocabMap[item.word.toLowerCase()] = item.translation;
        
        // Escape special regex characters in the word
        const escapedWord = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // For RTL languages (Hebrew/Arabic), we need more flexible word boundaries
        // Hebrew: [\u0590-\u05FF], Arabic: [\u0600-\u06FF]
        const isRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(item.word);
        
        let regex;
        if (isRTL) {
          // For RTL languages, use simpler pattern (no word boundaries)
          // This is less precise but more compatible
          regex = new RegExp(escapedWord, 'gi');
        } else {
          // For LTR languages, use standard word boundaries
          regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        }
        
        console.log(`Highlighting word "${item.word}" (RTL: ${isRTL})`);
        
        highlightedText = highlightedText.replace(regex, match => {
          console.log(`Found match for "${item.word}": "${match}"`);
          return `<span class="ll-vocab-word" data-translation="${item.translation.replace(/"/g, '&quot;')}">${match}</span>`;
        });
      });
    }
    
    // Detect if the adapted text is RTL
    const isTextRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(adaptedText);
    const textDirection = isTextRTL ? 'rtl' : 'ltr';
    
    sidebarContent.innerHTML = `
      <div class="ll-section">
        <div class="ll-adapted ll-text-with-vocab" dir="${textDirection}" style="text-align: ${isTextRTL ? 'right' : 'left'}">${highlightedText}</div>
      </div>
      ${vocabulary && vocabulary.length > 0 ? `
        <div class="ll-section">
          <h4>New Vocabulary</h4>
          <ul class="ll-vocabulary">
            ${vocabulary.map(word => `
              <li>
                <strong>${word.word}</strong>
                <span class="ll-translation">${word.translation}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    `;
    
    // Add hover tooltips to vocabulary words
    const vocabWords = sidebarContent.querySelectorAll('.ll-vocab-word');
    vocabWords.forEach(word => {
      word.addEventListener('mouseenter', (e) => {
        showTooltip(e.target, e.target.dataset.translation);
      });
      word.addEventListener('mouseleave', () => {
        hideTooltip();
      });
    });
  }

  // Show tooltip
  function showTooltip(element, text) {
    hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'll-vocab-tooltip';
    tooltip.className = 'll-vocab-tooltip';
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Check if we're in RTL context
    const isRTL = window.getComputedStyle(element).direction === 'rtl';
    
    let left = rect.left;
    let top = rect.top - tooltipRect.height - 5;
    
    // Adjust positioning for RTL languages
    if (isRTL) {
      left = rect.right - tooltipRect.width;
    }
    
    // Make sure tooltip stays within viewport
    if (left < 0) left = 5;
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 5;
    }
    if (top < 0) {
      top = rect.bottom + 5; // Show below if no space above
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  // Hide tooltip
  function hideTooltip() {
    const tooltip = document.getElementById('ll-vocab-tooltip');
    if (tooltip) tooltip.remove();
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
      sendResponse({ text: selectedText });
    } else if (request.action === 'hideFloatingButton') {
      hideAdaptButton();
    } else if (request.action === 'showLoadingSidebar') {
      showLoadingSidebar(request.originalText || selectedText);
    } else if (request.action === 'showAdaptedText') {
      showAdaptedContent(request.adaptedText, request.vocabulary);
    } else if (request.action === 'detectPageLanguage') {
      const detectedLanguage = detectPageLanguage();
      console.log('Page language detection requested, result:', detectedLanguage);
      sendResponse({ language: detectedLanguage });
    }
  });

  // Clean up on page navigation
  window.addEventListener('beforeunload', () => {
    hideAdaptButton();
    closeSidebar();
  });

})(); // End IIFE wrapper