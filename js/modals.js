/**
 * Zoho CRM Clone - Modal Functionality
 */

/**
 * Create and show a modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal content (HTML)
 * @param {string} options.size - Modal size (sm, md, lg, xl)
 * @param {Array} options.buttons - Modal buttons
 * @param {Function} options.onClose - Callback when modal is closed
 */
function showModal(options) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalElement = document.createElement('div');
    modalElement.className = `modal ${options.size ? 'modal-' + options.size : ''}`;
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = options.title || 'Modal Title';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => closeModal(modalOverlay, options.onClose));
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    if (typeof options.content === 'string') {
        modalBody.innerHTML = options.content;
    } else if (options.content instanceof HTMLElement) {
        modalBody.appendChild(options.content);
    }
    
    // Modal footer with buttons
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    if (options.buttons && options.buttons.length) {
        options.buttons.forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.className = `btn ${button.className || 'btn-outline-secondary'}`;
            buttonElement.textContent = button.text || 'Button';
            
            if (button.onClick) {
                buttonElement.addEventListener('click', (e) => {
                    button.onClick(e, {
                        close: () => closeModal(modalOverlay, options.onClose)
                    });
                });
            } else if (button.dismiss) {
                buttonElement.addEventListener('click', () => closeModal(modalOverlay, options.onClose));
            }
            
            modalFooter.appendChild(buttonElement);
        });
    }
    
    // Assemble modal
    modalElement.appendChild(modalHeader);
    modalElement.appendChild(modalBody);
    
    if (options.buttons && options.buttons.length) {
        modalElement.appendChild(modalFooter);
    }
    
    modalOverlay.appendChild(modalElement);
    document.body.appendChild(modalOverlay);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Show modal with animation
    setTimeout(() => {
        modalOverlay.classList.add('show');
    }, 10);
    
    // Close modal when clicking outside
    if (options.closeOnClickOutside !== false) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal(modalOverlay, options.onClose);
            }
        });
    }
    
    // Close modal on escape key
    const escKeyHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modalOverlay, options.onClose);
            document.removeEventListener('keydown', escKeyHandler);
        }
    };
    
    document.addEventListener('keydown', escKeyHandler);
    
    // Return modal elements for further manipulation
    return {
        overlay: modalOverlay,
        modal: modalElement,
        close: () => closeModal(modalOverlay, options.onClose)
    };
}

/**
 * Close modal
 * @param {HTMLElement} modalOverlay - Modal overlay element
 * @param {Function} onClose - Callback when modal is closed
 */
function closeModal(modalOverlay, onClose) {
    modalOverlay.classList.remove('show');
    
    // Remove modal after animation
    setTimeout(() => {
        document.body.removeChild(modalOverlay);
        document.body.style.overflow = '';
        
        if (typeof onClose === 'function') {
            onClose();
        }
    }, 300);
}

/**
 * Show confirmation modal
 * @param {Object} options - Confirmation options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Callback when canceled
 */
function showConfirmation(options) {
    return showModal({
        title: options.title || 'Confirmation',
        content: `<p>${options.message || 'Are you sure?'}</p>`,
        size: 'sm',
        buttons: [
            {
                text: options.cancelText || 'Cancel',
                className: 'btn-outline-secondary',
                dismiss: true,
                onClick: (e, modal) => {
                    if (typeof options.onCancel === 'function') {
                        options.onCancel();
                    }
                    modal.close();
                }
            },
            {
                text: options.confirmText || 'Confirm',
                className: 'btn-primary',
                onClick: (e, modal) => {
                    if (typeof options.onConfirm === 'function') {
                        options.onConfirm();
                    }
                    modal.close();
                }
            }
        ]
    });
}

/**
 * Show alert modal
 * @param {Object} options - Alert options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Button text
 * @param {Function} options.onClose - Callback when closed
 */
function showAlert(options) {
    return showModal({
        title: options.title || 'Alert',
        content: `<p>${options.message || 'This is an alert message.'}</p>`,
        size: 'sm',
        buttons: [
            {
                text: options.buttonText || 'OK',
                className: 'btn-primary',
                dismiss: true,
                onClick: (e, modal) => {
                    if (typeof options.onClose === 'function') {
                        options.onClose();
                    }
                    modal.close();
                }
            }
        ]
    });
}

/**
 * Show form modal
 * @param {Object} options - Form options
 * @param {string} options.title - Modal title
 * @param {Array} options.fields - Form fields
 * @param {Function} options.onSubmit - Callback when form is submitted
 */
function showFormModal(options) {
    // Create form element
    const form = document.createElement('form');
    form.className = 'modal-form';
    
    // Add form fields
    if (options.fields && options.fields.length) {
        options.fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.textContent = field.label;
            
            let input;
            
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
            } else if (field.type === 'select') {
                input = document.createElement('select');
                
                if (field.options && field.options.length) {
                    field.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.text;
                        
                        if (option.selected) {
                            optionElement.selected = true;
                        }
                        
                        input.appendChild(optionElement);
                    });
                }
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            
            input.id = field.id;
            input.name = field.name || field.id;
            
            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }
            
            if (field.value) {
                input.value = field.value;
            }
            
            if (field.required) {
                input.required = true;
            }
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
        });
    }
    
    // Show modal with form
    const modal = showModal({
        title: options.title || 'Form',
        content: form,
        size: options.size || 'md',
        buttons: [
            {
                text: options.cancelText || 'Cancel',
                className: 'btn-outline-secondary',
                dismiss: true
            },
            {
                text: options.submitText || 'Submit',
                className: 'btn-primary',
                onClick: (e, modalControls) => {
                    // Validate form
                    if (form.checkValidity()) {
                        // Collect form data
                        const formData = new FormData(form);
                        const data = {};
                        
                        for (const [key, value] of formData.entries()) {
                            data[key] = value;
                        }
                        
                        // Call submit callback
                        if (typeof options.onSubmit === 'function') {
                            options.onSubmit(data, modalControls);
                        } else {
                            modalControls.close();
                        }
                    } else {
                        form.reportValidity();
                    }
                }
            }
        ]
    });
    
    return modal;
}

