export class ModalManager {
  constructor() {
    this.modals = new Map();
  }

  init() {
    // Register all modals
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      this.modals.set(modal.id, modal);
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hide(modal.id);
        }
      });
      
      // Close modal when clicking close button
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide(modal.id));
      }
      
      // Close modal when clicking cancel button
      const cancelBtn = modal.querySelector('.modal-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hide(modal.id));
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAll();
      }
    });
  }

  show(modalId) {
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  hide(modalId) {
    const modal = this.modals.get(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset form if exists
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
    }
  }

  hideAll() {
    this.modals.forEach((modal, id) => {
      this.hide(id);
    });
  }

  isOpen(modalId) {
    const modal = this.modals.get(modalId);
    return modal ? modal.classList.contains('active') : false;
  }
}