// Enhanced Funnel Manager Application with Robust Error Handling

/**
 * PIN Access System - Handles application access control
 */
class PinAccess {
  constructor() {
    this.correctPin = "1234"; // Default access PIN
    this.storageKey = "pinAccessGranted";
    this.init();
  }

  async init() {
    try {
      // Verify required resources before proceeding
      await this.verifyResources();
      
      // Check session storage for existing access
      const accessGranted = sessionStorage.getItem(this.storageKey);
      if (accessGranted === "true") {
        this.grantAccess();
        return;
      }

      this.showPinScreen();
    } catch (error) {
      console.error("PinAccess initialization failed:", error);
      this.showErrorScreen("Application initialization failed. Please refresh.");
    }
  }

  async verifyResources() {
    const requiredResources = [
      '/',
      '/index.html',
      '/style.css',
      '/script.js',
      '/manifest.json'
    ];

    const resourceChecks = await Promise.all(
      requiredResources.map(url => this.checkResource(url))
    );

    const missingResources = requiredResources.filter((_, index) => !resourceChecks[index]);
    if (missingResources.length > 0) {
      console.warn("Missing resources detected:", missingResources);
      // Implement fallback behavior if needed
    }
  }

  async checkResource(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      return response.ok;
    } catch (error) {
      console.error(`Failed to check resource: ${url}`, error);
      return false;
    }
  }

  showErrorScreen(message) {
    const errorScreen = document.createElement('div');
    errorScreen.id = 'errorScreen';
    errorScreen.className = 'error-screen';
    errorScreen.innerHTML = `
      <div class="error-container">
        <h2>Application Error</h2>
        <p>${message}</p>
        <button id="reloadButton" class="btn btn-primary">Refresh Page</button>
      </div>
    `;
    document.body.appendChild(errorScreen);
    
    document.getElementById('reloadButton').addEventListener('click', () => {
      window.location.reload();
    });
  }

  showPinScreen() {
    // Hide main app if it exists
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.style.display = 'none';
    
    // Remove any existing error screens
    const errorScreen = document.getElementById('errorScreen');
    if (errorScreen) errorScreen.remove();
    
    // Create PIN screen
    const pinScreen = document.createElement('div');
    pinScreen.id = 'pinScreen';
    pinScreen.className = 'pin-screen';
    pinScreen.innerHTML = `
      <div class="pin-container">
        <h2>Enter Access PIN</h2>
        <p>Please enter the 4-digit PIN to access the application</p>
        <input type="password" id="pinInput" maxlength="4" pattern="\\d{4}" 
               placeholder="Enter PIN" autocomplete="off">
        <button id="submitPin" class="btn btn-primary">Submit</button>
        <p id="pinError" class="error-message"></p>
      </div>
    `;
    document.body.appendChild(pinScreen);
    
    // Add event listeners
    document.getElementById('submitPin').addEventListener('click', () => this.checkPin());
    document.getElementById('pinInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.checkPin();
    });
    
    // Focus the input field
    setTimeout(() => {
      const pinInput = document.getElementById('pinInput');
      if (pinInput) pinInput.focus();
    }, 100);
  }

  checkPin() {
    const pinInput = document.getElementById('pinInput');
    const errorElement = document.getElementById('pinError');
    
    if (!pinInput || !errorElement) {
      console.error('PIN input elements not found!');
      return;
    }
    
    const enteredPin = pinInput.value;
    
    if (!enteredPin || enteredPin.length !== 4) {
      errorElement.textContent = 'Please enter a 4-digit PIN';
      return;
    }

    if (enteredPin === this.correctPin) {
      // Correct PIN - grant access
      sessionStorage.setItem(this.storageKey, "true");
      this.grantAccess();
    } else {
      errorElement.textContent = 'Incorrect PIN. Please try again.';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  grantAccess() {
    // Hide PIN screen
    const pinScreen = document.getElementById('pinScreen');
    if (pinScreen) pinScreen.remove();
    
    // Show main app
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.display = 'block';
    } else {
      console.error('App container not found!');
      this.showErrorScreen('Application interface not found. Please refresh.');
      return;
    }
    
    // Initialize the funnel manager
    try {
      window.funnelManager = new FunnelManager();
    } catch (error) {
      console.error('Failed to initialize FunnelManager:', error);
      this.showErrorScreen('Failed to initialize application. Please refresh.');
    }
  }
}

/**
 * Main Funnel Manager Application
 */
class FunnelManager {
  constructor() {
    this.leads = [];
    this.activityLog = [];
    this.selectedLeads = new Set();
    this.stageCapacity = {
      tof: 100,
      mof: 60,
      bof: 30
    };
    this.funnelStrategies = {
      tof: { strategy: '', contentTypes: '' },
      mof: { strategy: '', contentTypes: '' },
      bof: { strategy: '', contentTypes: '' }
    };
    
    // Fallback icons
    this.fallbackIcons = {
      icon192: 'https://via.placeholder.com/192',
      icon512: 'https://via.placeholder.com/512'
    };
    
    this.init();
  }
  
  init() {
    try {
      this.loadData();
      this.setupEventListeners();
      this.render();
      
      // Set up auto-save
      this.setupAutoSave();
    } catch (error) {
      console.error('FunnelManager initialization failed:', error);
      this.showNotification('Application initialization failed', 'error');
    }
  }
  
  loadData() {
    try {
      // Load leads data
      const savedData = localStorage.getItem('funnelData');
      if (savedData) {
        const { leads, activity } = JSON.parse(savedData);
        this.leads = Array.isArray(leads) ? leads : [];
        this.activityLog = Array.isArray(activity) ? activity : [];
      } else {
        this.loadExampleLeads();
      }
      
      // Load funnel strategies
      const savedStrategies = localStorage.getItem('funnelStrategies');
      if (savedStrategies) {
        this.funnelStrategies = JSON.parse(savedStrategies);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      this.loadExampleLeads();
    }
  }
  
  setupEventListeners() {
    // Form submissions
    document.getElementById('addLeadForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNewLead();
    });
    
    document.getElementById('editLeadForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateCurrentLead();
    });
    
    document.getElementById('funnelStrategyForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFunnelStrategies();
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'n') {
        this.openAddLeadModal('tof');
      }
      if (e.key === 'Escape') this.closeModal();
      if (e.key === 'Delete' && this.selectedLeads.size > 0) {
        this.deleteSelectedLeads();
      }
    });
  }
  
  setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => this.saveLeads(), 30000);
    
    // Save before unload
    window.addEventListener('beforeunload', () => this.saveLeads());
  }
  
  // ... [Rest of the FunnelManager methods remain the same as in previous version] ...
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.pinAccess = new PinAccess();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'global-error';
    errorDiv.innerHTML = `
      <h2>Application Failed to Load</h2>
      <p>Please refresh the page or try again later.</p>
      <button onclick="window.location.reload()">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
  }
});

// Global functions for HTML event handlers
function toggleAnalytics() {
  if (window.funnelManager) window.funnelManager.toggleAnalytics();
}

function exportAsPDF() {
  if (window.funnelManager) window.funnelManager.exportAsPDF();
}

function exportAsJSON() {
  if (window.funnelManager) window.funnelManager.exportAsJSON();
}

function exportAsCSV() {
  if (window.funnelManager) window.funnelManager.exportAsCSV();
}

function openAddLeadModal(stage) {
  if (window.funnelManager) window.funnelManager.openAddLeadModal(stage);
}

function openFunnelStrategyModal() {
  if (window.funnelManager) window.funnelManager.openFunnelStrategyModal();
}

function closeModal() {
  if (window.funnelManager) window.funnelManager.closeModal();
}

function deleteLead() {
  if (window.funnelManager) {
    const leadId = document.getElementById('editingLeadId').value;
    if (confirm('Are you sure you want to delete this lead?')) {
      window.funnelManager.deleteLead(leadId);
      window.funnelManager.closeModal();
    }
  }
}
