// Custom Alert System
window.showAlert = function(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `custom-alert ${type}`;
    alertBox.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${getAlertIcon(type)}</span>
            <span class="alert-message">${message}</span>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(alertBox);
    
    setTimeout(() => alertBox.classList.add('show'), 10);
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => alertBox.remove(), 300);
    }, 5000);
}

window.getAlertIcon = function(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

// Custom Confirm Dialog
window.showConfirm = function(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-confirm">Confirm</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('.btn-cancel').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.btn-confirm').onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        onConfirm();
    };
}

// Add CSS
const style = document.createElement('style');
style.textContent = `
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 500px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
    }
    
    .custom-alert.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .custom-alert.success {
        background: #d4edda;
        border-left: 4px solid #28a745;
        color: #155724;
    }
    
    .custom-alert.error {
        background: #f8d7da;
        border-left: 4px solid #dc3545;
        color: #721c24;
    }
    
    .custom-alert.warning {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        color: #856404;
    }
    
    .custom-alert.info {
        background: #d1ecf1;
        border-left: 4px solid #17a2b8;
        color: #0c5460;
    }
    
    .alert-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .alert-icon {
        font-size: 20px;
        font-weight: bold;
    }
    
    .alert-message {
        flex: 1;
        font-size: 14px;
    }
    
    .alert-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 1;
    }
    
    .alert-close:hover {
        opacity: 1;
    }
    
    .custom-confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .custom-confirm-modal.show {
        opacity: 1;
    }
    
    .confirm-content {
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .confirm-content p {
        margin: 0 0 20px 0;
        font-size: 16px;
        color: #333;
    }
    
    .confirm-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    
    .confirm-buttons button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .btn-cancel {
        background: #6c757d;
        color: white;
    }
    
    .btn-cancel:hover {
        background: #5a6268;
    }
    
    .btn-confirm {
        background: #007bff;
        color: white;
    }
    
    .btn-confirm:hover {
        background: #0056b3;
    }
`;
document.head.appendChild(style);
