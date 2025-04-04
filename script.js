// Enhanced PIN Access System with Resource Checking
class PinAccess {
  constructor() {
    this.correctPin = "1234"; // Default access PIN
    this.storageKey = "pinAccessGranted";
    this.init();
  }

  async init() {
    // First verify we have all required resources
    await this.verifyResources();
    
    // Check if access was already granted in this session
    const accessGranted = sessionStorage.getItem(this.storageKey);
    if (accessGranted === "true") {
      this.grantAccess();
      return;
    }

    this.showPinScreen();
  }

  async verifyResources() {
    const requiredResources = [
      '/',
      '/index.html',
      '/style.css',
      '/script.js',
      '/manifest.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png'
    ];

    const checks = await Promise.all(
      requiredResources.map(url => this.checkResourceExists(url))
    );

    const missingResources = checks.filter(exists => !exists);
    if (missingResources.length > 0) {
      console.warn("Missing resources detected:", missingResources);
      // You could implement fallback behavior here if needed
    }
  }

  async checkResourceExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      console.error(`Failed to check resource: ${url}`, e);
      return false;
    }
  }

  showPinScreen() {
    // Hide main app initially
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.display = 'none';
    } else {
      console.error('App container not found!');
      return;
    }
    
    // Create PIN screen if it doesn't exist
    let pinScreen = document.getElementById('pinScreen');
    if (!pinScreen) {
      pinScreen = document.createElement('div');
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
        if (e.key === 'Enter') {
          this.checkPin();
        }
      });
    }
  }

  checkPin() {
    const pinInput = document.getElementById('pinInput');
    const errorElement = document.getElementById('pinError');
    
    if (!pinInput || !errorElement) {
      console.error('PIN input elements not found!');
      return;
    }
    
    const enteredPin = pinInput.value;
    
    if (!enteredPin) {
      errorElement.textContent = 'Please enter a PIN';
      return;
    }

    if (enteredPin === this.correctPin) {
      // Correct PIN - grant access
      sessionStorage.setItem(this.storageKey, "true");
      this.grantAccess();
    } else {
      errorElement.textContent = 'Incorrect PIN. Please try again.';
      pinInput.value = ''; // Clear the input field
      pinInput.focus(); // Refocus the input
    }
  }

  grantAccess() {
    // Hide PIN screen and show app
    const pinScreen = document.getElementById('pinScreen');
    if (pinScreen) {
      pinScreen.style.display = 'none';
    }
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.display = 'block';
    }
    
    // Initialize the funnel manager
    try {
      window.funnelManager = new FunnelManager();
    } catch (e) {
      console.error('Failed to initialize FunnelManager:', e);
      // Show error to user
      const errorElement = document.getElementById('pinError') || document.createElement('div');
      errorElement.textContent = 'Failed to initialize application. Please refresh.';
      errorElement.style.color = 'red';
      
      if (pinScreen) {
        pinScreen.style.display = 'block';
      }
    }
  }
}

// Enhanced Funnel Manager with Error Handling
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
      this.loadLeads();
      this.loadFunnelStrategies();
      this.setupDragAndDrop();
      this.setupKeyboardShortcuts();
      this.render();
      
      // Auto-save every 30 seconds
      setInterval(() => this.saveLeads(), 30000);
      
      // Register beforeunload handler
      window.addEventListener('beforeunload', () => this.saveLeads());
      
      // Setup form event listeners
      this.setupFormListeners();
    } catch (e) {
      console.error('FunnelManager initialization failed:', e);
      this.showNotification('Application initialization failed', 'error');
    }
  }
  
  setupFormListeners() {
    const addForm = document.getElementById('addLeadForm');
    const editForm = document.getElementById('editLeadForm');
    const strategyForm = document.getElementById('funnelStrategyForm');
    
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveNewLead();
      });
    }
    
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateCurrentLead();
      });
    }
    
    if (strategyForm) {
      strategyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFunnelStrategies();
      });
    }
  }
  
  // Data Management
  loadLeads() {
    try {
      const savedData = localStorage.getItem('funnelData');
      if (savedData) {
        const { leads, activity } = JSON.parse(savedData);
        this.leads = Array.isArray(leads) ? leads : [];
        this.activityLog = Array.isArray(activity) ? activity : [];
      } else {
        this.loadExampleLeads();
      }
    } catch (e) {
      console.error("Failed to load leads:", e);
      this.loadExampleLeads();
    }
    this.render();
  }
  
  loadFunnelStrategies() {
    try {
      const savedStrategies = localStorage.getItem('funnelStrategies');
      if (savedStrategies) {
        this.funnelStrategies = JSON.parse(savedStrategies);
      }
    } catch (e) {
      console.error("Failed to load funnel strategies:", e);
    }
  }
  
  saveLeads() {
    try {
      const data = {
        leads: this.leads,
        activity: this.activityLog.slice(-50) // Keep last 50 activities
      };
      localStorage.setItem('funnelData', JSON.stringify(data));
      this.showNotification('Auto-saved successfully', 'success');
    } catch (e) {
      console.error("Failed to save leads:", e);
      this.showNotification('Failed to save data', 'error');
    }
  }
  
  saveFunnelStrategies() {
    try {
      localStorage.setItem('funnelStrategies', JSON.stringify(this.funnelStrategies));
      this.updateStrategyDisplay();
      this.closeModal();
      this.showNotification('Funnel strategies saved successfully', 'success');
    } catch (e) {
      console.error("Failed to save funnel strategies:", e);
      this.showNotification('Failed to save funnel strategies', 'error');
    }
  }
  
  loadExampleLeads() {
    this.leads = [
      {
        id: this.generateId(),
        name: "Acme Corporation",
        email: "contact@acme.com",
        phone: "+1 555-123-4567",
        website: "https://acme.com",
        contacts: "John Smith, Jane Doe",
        tag: "hot",
        priority: "high",
        stage: "tof",
        notes: "Interested in premium plan. Follow up next week.",
        contentStrategy: "Send case studies and whitepapers",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: "XYZ Ltd",
        email: "info@xyz.com",
        phone: "+1 555-987-6543",
        website: "https://xyz.com",
        contacts: "Robert Johnson",
        tag: "",
        priority: "medium",
        stage: "mof",
        notes: "Requested demo. Scheduled for Friday.",
        contentStrategy: "Prepare demo focusing on pain points",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateId(),
        name: "Global Enterprises",
        email: "sales@global.com",
        phone: "+1 555-456-7890",
        website: "https://globalenterprises.com",
        contacts: "Sarah Williams, Michael Brown",
        tag: "vip",
        priority: "high",
        stage: "bof",
        notes: "Existing customer - contract renewal discussion",
        contentStrategy: "Prepare ROI analysis and success metrics",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.activityLog = [
      {
        id: this.generateId(),
        action: "Added lead",
        leadId: this.leads[0].id,
        leadName: this.leads[0].name,
        timestamp: new Date().toISOString()
      },
      {
        id: this.generateId(),
        action: "Added lead",
        leadId: this.leads[1].id,
        leadName: this.leads[1].name,
        timestamp: new Date().toISOString()
      },
      {
        id: this.generateId(),
        action: "Added lead",
        leadId: this.leads[2].id,
        leadName: this.leads[2].name,
        timestamp: new Date().toISOString()
      }
    ];
    this.saveLeads();
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Lead Management
  addLead(leadData) {
    if (!leadData?.name) {
      this.showNotification('Please enter a lead name', 'error');
      return false;
    }
    
    const newLead = {
      id: this.generateId(),
      name: leadData.name.trim(),
      email: leadData.email?.trim() || '',
      phone: leadData.phone?.trim() || '',
      website: leadData.website?.trim() || '',
      contacts: leadData.contacts?.trim() || '',
      tag: leadData.tag || '',
      priority: leadData.priority || 'medium',
      stage: leadData.stage || 'tof',
      notes: leadData.notes ? leadData.notes.trim() : '',
      contentStrategy: leadData.contentStrategy ? leadData.contentStrategy.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.leads.push(newLead);
    this.logActivity('Added lead', newLead.id, newLead.name);
    this.saveLeads();
    this.render();
    return true;
  }
  
  updateLead(leadId, updates) {
    const leadIndex = this.leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) {
      this.showNotification('Lead not found', 'error');
      return false;
    }
    
    const oldStage = this.leads[leadIndex].stage;
    const oldPriority = this.leads[leadIndex].priority;
    
    this.leads[leadIndex] = {
      ...this.leads[leadIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Log changes if applicable
    if (updates.stage && updates.stage !== oldStage) {
      this.logActivity(
        `Moved to ${this.getStageName(updates.stage)}`, 
        leadId, 
        this.leads[leadIndex].name,
        { fromStage: oldStage, toStage: updates.stage }
      );
    }
    
    if (updates.priority && updates.priority !== oldPriority) {
      this.logActivity(
        `Changed priority to ${updates.priority}`, 
        leadId, 
        this.leads[leadIndex].name
      );
    }
    
    this.saveLeads();
    this.render();
    return true;
  }
  
  deleteLead(leadId) {
    const leadIndex = this.leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) {
      this.showNotification('Lead not found', 'error');
      return false;
    }
    
    const [deletedLead] = this.leads.splice(leadIndex, 1);
    this.logActivity('Deleted lead', leadId, deletedLead.name);
    this.selectedLeads.delete(leadId);
    this.saveLeads();
    this.render();
    return true;
  }
  
  moveLead(leadId, newStage) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return false;
    
    const oldStage = lead.stage;
    lead.stage = newStage;
    lead.updatedAt = new Date().toISOString();
    
    this.logActivity(
      `Moved to ${this.getStageName(newStage)}`, 
      leadId, 
      lead.name,
      { fromStage: oldStage, toStage: newStage }
    );
    
    this.saveLeads();
    this.render();
    return true;
  }
  
  // Funnel Strategy Management
  saveFunnelStrategies() {
    try {
      this.funnelStrategies = {
        tof: {
          strategy: document.getElementById('tofStrategy')?.value || '',
          contentTypes: document.getElementById('tofContentTypes')?.value || ''
        },
        mof: {
          strategy: document.getElementById('mofStrategy')?.value || '',
          contentTypes: document.getElementById('mofContentTypes')?.value || ''
        },
        bof: {
          strategy: document.getElementById('bofStrategy')?.value || '',
          contentTypes: document.getElementById('bofContentTypes')?.value || ''
        }
      };
      
      localStorage.setItem('funnelStrategies', JSON.stringify(this.funnelStrategies));
      this.updateStrategyDisplay();
      this.closeModal();
      this.showNotification('Funnel strategies saved successfully', 'success');
    } catch (e) {
      console.error('Failed to save funnel strategies:', e);
      this.showNotification('Failed to save funnel strategies', 'error');
    }
  }
  
  updateStrategyDisplay() {
    const setTextContent = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };
    
    setTextContent('tof-strategy-text', this.funnelStrategies.tof.strategy || 'No strategy yet.');
    setTextContent('mof-strategy-text', this.funnelStrategies.mof.strategy || 'No strategy yet.');
    setTextContent('bof-strategy-text', this.funnelStrategies.bof.strategy || 'No strategy yet.');
  }
  
  openFunnelStrategyModal() {
    try {
      document.getElementById('tofStrategy').value = this.funnelStrategies.tof.strategy;
      document.getElementById('tofContentTypes').value = this.funnelStrategies.tof.contentTypes;
      document.getElementById('mofStrategy').value = this.funnelStrategies.mof.strategy;
      document.getElementById('mofContentTypes').value = this.funnelStrategies.mof.contentTypes;
      document.getElementById('bofStrategy').value = this.funnelStrategies.bof.strategy;
      document.getElementById('bofContentTypes').value = this.funnelStrategies.bof.contentTypes;
      
      const modal = document.getElementById('funnelStrategyModal');
      if (modal) modal.style.display = 'block';
    } catch (e) {
      console.error('Failed to open strategy modal:', e);
      this.showNotification('Failed to open strategy settings', 'error');
    }
  }
  
  // Bulk Actions
  toggleLeadSelection(leadId, selected) {
    if (selected) {
      this.selectedLeads.add(leadId);
    } else {
      this.selectedLeads.delete(leadId);
    }
    this.renderSelectedLeads();
  }
  
  moveSelectedLeads(newStage) {
    if (this.selectedLeads.size === 0) {
      this.showNotification('No leads selected', 'warning');
      return;
    }
    
    let movedCount = 0;
    this.selectedLeads.forEach(leadId => {
      if (this.moveLead(leadId, newStage)) {
        movedCount++;
      }
    });
    
    this.showNotification(`Moved ${movedCount} lead(s) to ${this.getStageName(newStage)}`, 'success');
    this.selectedLeads.clear();
    this.render();
  }
  
  deleteSelectedLeads() {
    if (this.selectedLeads.size === 0) {
      this.showNotification('No leads selected', 'warning');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${this.selectedLeads.size} lead(s)?`)) {
      return;
    }
    
    let deletedCount = 0;
    this.selectedLeads.forEach(leadId => {
      if (this.deleteLead(leadId)) {
        deletedCount++;
      }
    });
    
    this.showNotification(`Deleted ${deletedCount} lead(s)`, 'success');
    this.selectedLeads.clear();
    this.render();
  }
  
  // Analytics
  calculateConversionRate() {
    const tofCount = this.leads.filter(l => l.stage === 'tof').length;
    const bofCount = this.leads.filter(l => l.stage === 'bof').length;
    return tofCount > 0 ? (bofCount / tofCount * 100).toFixed(1) : 0;
  }
  
  calculateAvgDwellTime() {
    const stageChanges = this.activityLog.filter(a => a.action.includes('Moved to'));
    
    if (stageChanges.length < 2) return 0;
    
    let totalDays = 0;
    let count = 0;
    
    for (let i = 0; i < stageChanges.length - 1; i++) {
      const current = stageChanges[i];
      const next = stageChanges[i + 1];
      
      if (current.leadId === next.leadId) {
        const currentTime = new Date(current.timestamp);
        const nextTime = new Date(next.timestamp);
        const diffDays = (nextTime - currentTime) / (1000 * 60 * 60 * 24);
        totalDays += diffDays;
        count++;
      }
    }
    
    return count > 0 ? Math.round(totalDays / count) : 0;
  }
  
  forecastCompletions(days = 7) {
    const avgDwell = this.calculateAvgDwellTime() || 7;
    const conversionRate = this.calculateConversionRate() / 100;
    const mofLeads = this.leads.filter(l => l.stage === 'mof').length;
    const bofLeads = this.leads.filter(l => l.stage === 'bof').length;
    
    return Math.round(bofLeads + (mofLeads * conversionRate * (days / avgDwell)));
  }
  
  // Rendering
  render() {
    try {
      this.renderLeads();
      this.renderAnalytics();
      this.renderActivityTimeline();
      this.updateProgressBars();
      this.renderSelectedLeads();
      this.renderFunnelChart();
      this.updateStrategyDisplay();
    } catch (e) {
      console.error('Rendering failed:', e);
      this.showNotification('Failed to render content', 'error');
    }
  }
  
  renderLeads() {
    const stages = ['tof', 'mof', 'bof'];
    
    stages.forEach(stage => {
      const container = document.getElementById(`${stage}-leads`);
      if (!container) return;
      
      container.innerHTML = '';
      const stageLeads = this.leads
        .filter(l => l.stage === stage)
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            priorityOrder[b.priority] - priorityOrder[a.priority] ||
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        });
      
      stageLeads.forEach(lead => {
        const leadEl = this.createLeadElement(lead);
        container.appendChild(leadEl);
      });
      
      // Update count
      const countEl = document.querySelector(`.funnel-stage[data-stage="${stage}"] .stage-count`);
      if (countEl) countEl.textContent = stageLeads.length;
    });
  }
  
  createLeadElement(lead) {
    const leadEl = document.createElement('div');
    leadEl.className = `lead-card priority-${lead.priority}`;
    leadEl.dataset.leadId = lead.id;
    leadEl.draggable = true;
    
    // Format date
    const updatedDate = new Date(lead.updatedAt);
    const dateStr = updatedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    // Create lead HTML
    leadEl.innerHTML = `
      <label class="lead-selector">
        <input type="checkbox" class="lead-checkbox" data-lead-id="${lead.id}"
               ${this.selectedLeads.has(lead.id) ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>
      <div class="lead-name">${lead.name}</div>
      ${lead.tag ? `<span class="lead-tag ${this.getTagClass(lead.tag)}">${this.getTagDisplay(lead.tag)}</span>` : ''}
      <div class="lead-meta">
        <span class="lead-notes" title="${lead.notes || 'No notes'}">
          ${lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? '...' : '') : 'No notes'}
        </span>
        <span class="lead-date">${dateStr}</span>
      </div>
    `;
    
    // Add event listeners
    const checkbox = leadEl.querySelector('.lead-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.toggleLeadSelection(lead.id, e.target.checked);
      });
    }
    
    leadEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('lead-checkbox') && 
          !e.target.closest('.lead-checkbox')) {
        this.openEditLeadModal(lead);
      }
    });
    
    // Drag events
    leadEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', lead.id);
      e.target.classList.add('dragging');
    });
    
    leadEl.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
    });
    
    return leadEl;
  }
  
  renderSelectedLeads() {
    document.querySelectorAll('.lead-card').forEach(card => {
      const leadId = card.dataset.leadId;
      const checkbox = card.querySelector('.lead-checkbox');
      if (checkbox) {
        checkbox.checked = this.selectedLeads.has(leadId);
      }
      
      if (this.selectedLeads.has(leadId)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }
  
  renderAnalytics() {
    const setTextContent = (id, text) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    };
    
    setTextContent('totalLeads', this.leads.length);
    setTextContent('conversionRate', `${this.calculateConversionRate()}%`);
    setTextContent('avgDwellTime', `${this.calculateAvgDwellTime()}d`);
    setTextContent('forecastCompletions', this.forecastCompletions());
  }
  
  renderFunnelChart() {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (window.funnelChart) {
      window.funnelChart.destroy();
    }
    
    const stageCounts = {
      tof: this.leads.filter(l => l.stage === 'tof').length,
      mof: this.leads.filter(l => l.stage === 'mof').length,
      bof: this.leads.filter(l => l.stage === 'bof').length
    };
    
    try {
      window.funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['TOF', 'TOF → MOF', 'MOF', 'MOF → BOF', 'BOF'],
          datasets: [{
            label: 'Leads',
            data: [
              stageCounts.tof,
              0, // Spacer
              stageCounts.mof,
              0, // Spacer
              stageCounts.bof
            ],
            backgroundColor: [
              this.getStageColor('tof'),
              'transparent',
              this.getStageColor('mof'),
              'transparent',
              this.getStageColor('bof')
            ],
            borderColor: [
              this.getStageColor('tof'),
              'transparent',
              this.getStageColor('mof'),
              'transparent',
              this.getStageColor('bof')
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (context.dataIndex === 1 || context.dataIndex === 3) return '';
                  return `Leads: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Number of Leads' }
            },
            x: {
              title: { display: true, text: 'Funnel Stage' }
            }
          }
        }
      });
    } catch (e) {
      console.error('Failed to render funnel chart:', e);
    }
  }
  
  renderActivityTimeline() {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = '';
    
    const recentActivities = [...this.activityLog]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    if (recentActivities.length === 0) {
      timeline.innerHTML = '<div class="timeline-item">No recent activity</div>';
      return;
    }
    
    recentActivities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const dateStr = activityDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = `
        <div class="timeline-date">${dateStr}</div>
        <div class="timeline-action">
          ${activity.action} ${activity.leadName ? `<strong>${activity.leadName}</strong>` : ''}
        </div>
      `;
      timeline.appendChild(item);
    });
  }
  
  updateProgressBars() {
    const stages = ['tof', 'mof', 'bof'];
    
    stages.forEach(stage => {
      const count = this.leads.filter(l => l.stage === stage).length;
      const percentage = Math.min(100, (count / this.stageCapacity[stage]) * 100);
      
      const progressBar = document.getElementById(`${stage}-progress`);
      const progressText = document.getElementById(`${stage}-progress-text`);
      
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        
        // Change color based on capacity
        if (percentage >= 90) {
          progressBar.style.backgroundColor = '#f72585';
        } else if (percentage >= 75) {
          progressBar.style.backgroundColor = '#ff9e00';
        } else {
          progressBar.style.backgroundColor = this.getStageColor(stage);
        }
      }
      
      if (progressText) {
        progressText.textContent = `${Math.round(percentage)}%`;
      }
    });
  }
  
  // UI Helpers
  openAddLeadModal(stage) {
    try {
      document.getElementById('currentStage').value = stage;
      document.getElementById('leadName').value = '';
      document.getElementById('leadEmail').value = '';
      document.getElementById('leadPhone').value = '';
      document.getElementById('leadWebsite').value = '';
      document.getElementById('leadContacts').value = '';
      document.getElementById('leadTag').value = '';
      document.getElementById('leadPriority').value = 'medium';
      document.getElementById('leadNotes').value = '';
      
      const modal = document.getElementById('addLeadModal');
      if (modal) {
        modal.style.display = 'block';
        document.getElementById('leadName').focus();
      }
    } catch (e) {
      console.error('Failed to open add lead modal:', e);
      this.showNotification('Failed to open add lead form', 'error');
    }
  }
  
  openEditLeadModal(lead) {
    try {
      document.getElementById('editingLeadId').value = lead.id;
      document.getElementById('editLeadName').textContent = lead.name;
      
      const tagElement = document.getElementById('editLeadTag');
      if (tagElement) {
        tagElement.className = 'lead-tag';
        tagElement.textContent = '';
        
        if (lead.tag) {
          tagElement.classList.add(this.getTagClass(lead.tag));
          tagElement.textContent = this.getTagDisplay(lead.tag);
        }
      }
      
      document.getElementById('editLeadStage').value = lead.stage;
      document.getElementById('editLeadPriority').value = lead.priority;
      document.getElementById('editLeadEmail').value = lead.email || '';
      document.getElementById('editLeadPhone').value = lead.phone || '';
      document.getElementById('editLeadWebsite').value = lead.website || '';
      document.getElementById('editLeadContacts').value = lead.contacts || '';
      document.getElementById('editLeadNotes').value = lead.notes || '';
      document.getElementById('editContentStrategy').value = lead.contentStrategy || '';
      
      const modal = document.getElementById('editLeadModal');
      if (modal) modal.style.display = 'block';
    } catch (e) {
      console.error('Failed to open edit lead modal:', e);
      this.showNotification('Failed to open edit form', 'error');
    }
  }
  
  closeModal() {
    const closeModal = (id) => {
      const modal = document.getElementById(id);
      if (modal) modal.style.display = 'none';
    };
    
    closeModal('addLeadModal');
    closeModal('editLeadModal');
    closeModal('funnelStrategyModal');
  }
  
  saveNewLead() {
    try {
      const stage = document.getElementById('currentStage').value;
      const name = document.getElementById('leadName').value;
      
      if (!name) {
        this.showNotification('Lead name is required', 'error');
        return;
      }
      
      const leadData = {
        stage,
        name,
        email: document.getElementById('leadEmail').value,
        phone: document.getElementById('leadPhone').value,
        website: document.getElementById('leadWebsite').value,
        contacts: document.getElementById('leadContacts').value,
        tag: document.getElementById('leadTag').value,
        priority: document.getElementById('leadPriority').value,
        notes: document.getElementById('leadNotes').value
      };
      
      const success = this.addLead(leadData);
      if (success) {
        this.showNotification('Lead added successfully', 'success');
        this.closeModal();
      }
    } catch (e) {
      console.error('Failed to save new lead:', e);
      this.showNotification('Failed to save lead', 'error');
    }
  }
  
  updateCurrentLead() {
    try {
      const leadId = document.getElementById('editingLeadId').value;
      const updates = {
        stage: document.getElementById('editLeadStage').value,
        priority: document.getElementById('editLeadPriority').value,
        email: document.getElementById('editLeadEmail').value,
        phone: document.getElementById('editLeadPhone').value,
        website: document.getElementById('editLeadWebsite').value,
        contacts: document.getElementById('editLeadContacts').value,
        notes: document.getElementById('editLeadNotes').value,
        contentStrategy: document.getElementById('editContentStrategy').value
      };
      
      const success = this.updateLead(leadId, updates);
      if (success) {
        this.showNotification('Lead updated successfully', 'success');
        this.closeModal();
      }
    } catch (e) {
      console.error('Failed to update lead:', e);
      this.showNotification('Failed to update lead', 'error');
    }
  }
  
  showNotification(message, type = 'info', duration = 3000) {
    try {
      const container = document.getElementById('notificationContainer');
      if (!container) return;
      
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        ${message}
      `;
      
      container.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  }
  
  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }
  
  toggleAnalytics() {
    const panel = document.getElementById('analyticsPanel');
    if (panel) {
      panel.classList.toggle('visible');
      
      if (panel.classList.contains('visible')) {
        this.renderFunnelChart();
      }
    }
  }
  
  // Drag and Drop
  setupDragAndDrop() {
    const leadContainers = document.querySelectorAll('.leads-container');
    
    leadContainers.forEach(container => {
      container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        
        if (afterElement == null) {
          container.appendChild(draggable);
        } else {
          container.insertBefore(draggable, afterElement);
        }
      });
      
      container.addEventListener('drop', e => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('text/plain');
        const newStage = container.id.replace('-leads', '');
        this.moveLead(leadId, newStage);
      });
    });
  }
  
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.lead-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Alt+N to add new lead
      if (e.ctrlKey && e.altKey && e.key === 'n') {
        this.openAddLeadModal('tof');
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeModal();
      }
      
      // Delete to remove selected leads
      if (e.key === 'Delete' && this.selectedLeads.size > 0) {
        this.deleteSelectedLeads();
      }
    });
  }
  
  // Export Functions
  exportAsPDF() {
    try {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        this.showNotification('PDF library not loaded. Please try again.', 'error');
        return;
      }
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(67, 97, 238);
      doc.text('Sales Funnel Report', 105, 20, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
      
      // Funnel visualization
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Add funnel stages
      const stages = ['tof', 'mof', 'bof'];
      let yPos = 45;
      
      // Add funnel strategies
      doc.setFont('helvetica', 'bold');
      doc.text('Funnel Content Strategies', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      stages.forEach(stage => {
        const stageName = this.getStageName(stage);
        const strategy = this.funnelStrategies[stage];
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${stageName}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 7;
        
        if (strategy.strategy) {
          const splitStrategy = doc.splitTextToSize(strategy.strategy, 160);
          doc.text(splitStrategy, 25, yPos);
          yPos += splitStrategy.length * 7;
        }
        
        if (strategy.contentTypes) {
          doc.setFont('helvetica', 'bold');
          doc.text('Content Types:', 25, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 7;
          doc.text(strategy.contentTypes, 30, yPos);
          yPos += 7;
        }
        
        yPos += 10;
      });
      
      // Add page break before leads
      doc.addPage();
      y
