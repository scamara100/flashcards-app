// ============================================================================
// Data Store - In-Memory Deck Management
// ============================================================================
class DeckStore {
  constructor() {
    this.decks = [
      { id: 1, name: 'Spanish Vocab', cardCount: 24 },
      { id: 2, name: 'French Phrases', cardCount: 18 },
      { id: 3, name: 'Math Formulas', cardCount: 32 }
    ];
    this.nextId = 4;
    this.currentDeckId = 1;
    this.observers = [];
  }

  subscribe(callback) {
    this.observers.push(callback);
  }

  notify() {
    this.observers.forEach(callback => callback(this.decks));
  }

  getDecks() {
    return this.decks;
  }

  getDeckById(id) {
    return this.decks.find(deck => deck.id === id);
  }

  createDeck(name, cardCount = 0) {
    const newDeck = {
      id: this.nextId++,
      name,
      cardCount
    };
    this.decks.push(newDeck);
    this.notify();
    return newDeck;
  }

  updateDeck(id, updates) {
    const deck = this.getDeckById(id);
    if (deck) {
      Object.assign(deck, updates);
      this.notify();
      return deck;
    }
    return null;
  }

  deleteDeck(id) {
    const index = this.decks.findIndex(deck => deck.id === id);
    if (index > -1) {
      this.decks.splice(index, 1);
      if (this.currentDeckId === id) {
        this.currentDeckId = this.decks[0]?.id || null;
      }
      this.notify();
      return true;
    }
    return false;
  }

  setCurrentDeck(id) {
    if (this.getDeckById(id)) {
      this.currentDeckId = id;
      return true;
    }
    return false;
  }

  getCurrentDeck() {
    return this.getDeckById(this.currentDeckId);
  }
}

// ============================================================================
// Accessible Modal Component
// ============================================================================
class AccessibleModal {
  constructor(options = {}) {
    this.isOpen = false;
    this.triggerElement = null;
    this.focusTrapElements = [];
    
    // Create modal elements
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-labelledby', options.titleId || 'modal-title');
    this.modal.setAttribute('aria-describedby', options.descId || 'modal-desc');

    this.header = document.createElement('div');
    this.header.className = 'modal-header';

    this.title = document.createElement('h2');
    this.title.className = 'modal-title';
    this.title.id = options.titleId || 'modal-title';
    this.title.textContent = options.title || 'Modal';

    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'modal-close-btn';
    this.closeBtn.setAttribute('aria-label', 'Close modal');
    this.closeBtn.innerHTML = '&times;';
    this.closeBtn.addEventListener('click', () => this.close());

    this.header.appendChild(this.title);
    this.header.appendChild(this.closeBtn);

    this.body = document.createElement('div');
    this.body.className = 'modal-body';
    this.body.id = options.descId || 'modal-desc';

    this.footer = document.createElement('div');
    this.footer.className = 'modal-footer';

    this.modal.appendChild(this.header);
    this.modal.appendChild(this.body);
    this.modal.appendChild(this.footer);

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Keyboard handlers
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  setTitle(text) {
    this.title.textContent = text;
  }

  setBody(content) {
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else {
      this.body.innerHTML = '';
      this.body.appendChild(content);
    }
  }

  setFooter(content) {
    if (typeof content === 'string') {
      this.footer.innerHTML = content;
    } else {
      this.footer.innerHTML = '';
      this.footer.appendChild(content);
    }
  }

  getFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not(:disabled)',
      'input:not(:disabled)',
      'textarea:not(:disabled)',
      'select:not(:disabled)',
      '[tabindex]:not([tabindex="-1"])'
    ];
    return Array.from(this.modal.querySelectorAll(focusableSelectors.join(', ')));
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }

  open(triggerElement = null) {
    if (this.isOpen) return;

    this.triggerElement = triggerElement || document.activeElement;
    this.isOpen = true;

    this.overlay.style.display = 'flex';
    this.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', this.handleKeydown);

    // Focus first focusable element or close button
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 0);
    } else {
      this.closeBtn.focus();
    }
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    document.removeEventListener('keydown', this.handleKeydown);

    // Return focus to trigger element
    if (this.triggerElement) {
      setTimeout(() => this.triggerElement.focus(), 0);
    }
  }

  destroy() {
    this.close();
    this.overlay.remove();
  }
}

// ============================================================================
// UI Controller
// ============================================================================
class UIController {
  constructor(deckStore) {
    this.store = deckStore;
    this.currentDeckElement = null;
    this.decksList = null;
    this.newDeckBtn = null;
    this.modal = null;

    this.init();
  }

  init() {
    this.cacheElements();
    this.attachEventListeners();
    this.store.subscribe(() => this.renderDecks());
    this.renderDecks();
  }

  cacheElements() {
    this.decksList = document.querySelector('.decks-list');
    this.newDeckBtn = document.querySelector('button:contains("New Deck")');
    
    // Find by text content if contains selector not available
    const headerNav = document.querySelector('.header-nav');
    const buttons = headerNav.querySelectorAll('button');
    this.newDeckBtn = buttons[0]; // First button is "New Deck"

    this.currentDeckElement = document.querySelector('.cards-header h2');
    this.cardProgressElement = document.querySelector('.card-progress');
    this.correctStatElement = document.querySelectorAll('.stat-value')[0];
    this.incorrectStatElement = document.querySelectorAll('.stat-value')[1];
  }

  attachEventListeners() {
    this.newDeckBtn.addEventListener('click', () => this.openCreateDeckModal());
    this.decksList.addEventListener('click', (e) => this.handleDeckSelection(e));
  }

  openCreateDeckModal() {
    this.modal = new AccessibleModal({
      title: 'Create New Deck',
      titleId: 'create-deck-title',
      descId: 'create-deck-desc'
    });

    const formHTML = `
      <form id="create-deck-form">
        <div class="form-group">
          <label for="deck-name">Deck Name:</label>
          <input type="text" id="deck-name" name="deckName" placeholder="e.g., Italian Vocabulary" required maxlength="50">
          <small>Max 50 characters</small>
        </div>
        <div class="form-group">
          <label for="card-count">Number of Cards:</label>
          <input type="number" id="card-count" name="cardCount" placeholder="0" min="0" max="500" value="0">
        </div>
      </form>
    `;

    this.modal.setBody(formHTML);

    const footerHTML = `
      <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
      <button class="btn btn-primary" id="create-btn">Create Deck</button>
    `;

    this.modal.setFooter(footerHTML);

    this.modal.open(this.newDeckBtn);

    // Attach form handlers
    const form = document.getElementById('create-deck-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const createBtn = document.getElementById('create-btn');

    cancelBtn.addEventListener('click', () => this.modal.close());

    createBtn.addEventListener('click', () => {
      const deckName = document.getElementById('deck-name').value.trim();
      const cardCount = parseInt(document.getElementById('card-count').value) || 0;

      if (!deckName) {
        alert('Please enter a deck name');
        return;
      }

      this.store.createDeck(deckName, cardCount);
      this.modal.close();
    });

    // Allow Enter to submit
    form.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        createBtn.click();
      }
    });
  }

  openDeleteDeckModal(deckId) {
    const deck = this.store.getDeckById(deckId);
    if (!deck) return;

    this.modal = new AccessibleModal({
      title: 'Delete Deck',
      titleId: 'delete-deck-title',
      descId: 'delete-deck-desc'
    });

    const bodyHTML = `
      <p>Are you sure you want to delete "<strong>${deck.name}</strong>"? This action cannot be undone.</p>
    `;

    this.modal.setBody(bodyHTML);

    const footerHTML = `
      <button class="btn btn-secondary" id="cancel-delete-btn">Cancel</button>
      <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
    `;

    this.modal.setFooter(footerHTML);

    this.modal.open();

    const cancelBtn = document.getElementById('cancel-delete-btn');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    cancelBtn.addEventListener('click', () => this.modal.close());
    confirmBtn.addEventListener('click', () => {
      this.store.deleteDeck(deckId);
      this.modal.close();
      this.selectDeck(this.store.currentDeckId);
    });
  }

  openEditDeckModal(deckId) {
    const deck = this.store.getDeckById(deckId);
    if (!deck) return;

    this.modal = new AccessibleModal({
      title: 'Edit Deck',
      titleId: 'edit-deck-title',
      descId: 'edit-deck-desc'
    });

    const formHTML = `
      <form id="edit-deck-form">
        <div class="form-group">
          <label for="edit-deck-name">Deck Name:</label>
          <input type="text" id="edit-deck-name" name="deckName" value="${deck.name}" required maxlength="50">
        </div>
        <div class="form-group">
          <label for="edit-card-count">Number of Cards:</label>
          <input type="number" id="edit-card-count" name="cardCount" value="${deck.cardCount}" min="0" max="500">
        </div>
      </form>
    `;

    this.modal.setBody(formHTML);

    const footerHTML = `
      <button class="btn btn-secondary" id="cancel-edit-btn">Cancel</button>
      <button class="btn btn-primary" id="save-edit-btn">Save Changes</button>
    `;

    this.modal.setFooter(footerHTML);

    this.modal.open();

    const cancelBtn = document.getElementById('cancel-edit-btn');
    const saveBtn = document.getElementById('save-edit-btn');

    cancelBtn.addEventListener('click', () => this.modal.close());
    saveBtn.addEventListener('click', () => {
      const name = document.getElementById('edit-deck-name').value.trim();
      const cardCount = parseInt(document.getElementById('edit-card-count').value) || 0;

      if (!name) {
        alert('Please enter a deck name');
        return;
      }

      this.store.updateDeck(deckId, { name, cardCount });
      this.modal.close();
      this.selectDeck(deckId);
    });
  }

  handleDeckSelection(e) {
    const deckItem = e.target.closest('.deck-item');
    if (!deckItem) return;

    const deckId = parseInt(deckItem.dataset.deckId);
    const action = e.target.dataset.action;

    if (action === 'edit') {
      e.stopPropagation();
      this.openEditDeckModal(deckId);
    } else if (action === 'delete') {
      e.stopPropagation();
      this.openDeleteDeckModal(deckId);
    } else {
      this.selectDeck(deckId);
    }
  }

  selectDeck(deckId) {
    this.store.setCurrentDeck(deckId);
    this.renderDecks();
    this.updateMainContent();
  }

  renderDecks() {
    this.decksList.innerHTML = '';
    const decks = this.store.getDecks();

    decks.forEach(deck => {
      const deckItem = document.createElement('div');
      deckItem.className = `deck-item ${deck.id === this.store.currentDeckId ? 'active' : ''}`;
      deckItem.dataset.deckId = deck.id;

      deckItem.innerHTML = `
        <span class="deck-name">${deck.name}</span>
        <span class="deck-count">${deck.cardCount}</span>
        <div class="deck-actions" style="display: none; gap: 0.5rem; margin-left: auto;">
          <button class="btn btn-small" data-action="edit" aria-label="Edit ${deck.name}">Edit</button>
          <button class="btn btn-small" data-action="delete" aria-label="Delete ${deck.name}">Delete</button>
        </div>
      `;

      // Show actions on hover
      deckItem.addEventListener('mouseenter', () => {
        deckItem.querySelector('.deck-actions').style.display = 'flex';
      });

      deckItem.addEventListener('mouseleave', () => {
        deckItem.querySelector('.deck-actions').style.display = 'none';
      });

      this.decksList.appendChild(deckItem);
    });
  }

  updateMainContent() {
    const currentDeck = this.store.getCurrentDeck();
    if (!currentDeck) return;

    this.currentDeckElement.textContent = currentDeck.name;
    this.cardProgressElement.textContent = `Card 1 of ${currentDeck.cardCount}`;
    
    // Reset stats
    this.correctStatElement.textContent = '0';
    this.incorrectStatElement.textContent = '0';
  }
}

// ============================================================================
// Initialize App
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const deckStore = new DeckStore();
  const uiController = new UIController(deckStore);
});