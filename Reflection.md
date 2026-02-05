# Flashcards App - Development Reflection

## Where AI Saved Time

- **Boilerplate Generation**: AI rapidly generated the complete HTML structure with semantic markup (header, sidebar, main, footer) and form elements, eliminating hours of manual DOM setup.
- **CSS Variables System**: AI created a comprehensive design token system with 50+ variables for colors, spacing, typography, and shadows, enabling rapid theming and reducing repetitive style declarations.
- **Modal Component Architecture**: AI designed a reusable `AccessibleModal` class that handles focus management, keyboard events, and ARIA attributes—work that would typically require researching accessibility patterns.
- **CRUD Operation Scaffolding**: AI implemented the complete `DeckStore` class with observer pattern for state management, eliminating the need to manually wire up data mutations and UI updates.
- **Responsive Grid Breakpoints**: AI implemented three breakpoints (desktop, tablet, mobile) with proper media query logic, saving extensive testing and adjustment cycles.

## AI Bug Identified & Fixed

**Bug**: In the initial modal implementation, the focus trap didn't work on the first Tab press because `document.activeElement` was still pointing to the body before the modal received focus.

**Root Cause**: The modal was opened but the first focusable element wasn't explicitly focused before the keyboard handler attached.

**Fix**: Changed the open method to explicitly focus the first focusable element with a `setTimeout(..., 0)` to ensure the DOM update completed:
```javascript
// Before (broken)
open(triggerElement = null) {
  document.addEventListener('keydown', this.handleKeydown);
  // focus attempt happened too early
}

// After (fixed)
open(triggerElement = null) {
  document.addEventListener('keydown', this.handleKeydown);
  const focusableElements = this.getFocusableElements();
  if (focusableElements.length > 0) {
    setTimeout(() => focusableElements[0].focus(), 0); // Deferred to next tick
  }
}