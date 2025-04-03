// Main Application
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
    
    this.init();
  }
  
  init() {
    this.loadLeads();
    this.setupDragAndDrop();
    this.setupKeyboardShortcuts();
    this.render();
    
    // Auto-save every 30 seconds
    setInterval(() => this.saveLeads(), 30000);
    
    // Register beforeunload handler
    window.addEventListener('beforeunload', () => this.saveLeads());
    
    // Setup form event listeners
    document.getElementById('addLeadForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNewLead();
    });
    
    document.getElementById('editLeadForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateCurrentLead();
    });
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
    
    if (!newLead.name) {
      this.showNotification('Please enter a lead name', 'error');
      return false;
    }
    
    this.leads.push(newLead);
    this.logActivity('Added lead', newLead.id, newLead.name);
    this.saveLeads();
    this.render();
    return true;
  }
  
  updateLead(leadId, updates) {
    const leadIndex = this.leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) return false;
    
    const oldStage = this.leads[leadIndex].stage;
    const oldPriority = this.leads[leadIndex].priority;
    
    this.leads[leadIndex] = {
      ...this.leads[leadIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Log stage change if applicable
    if (updates.stage && updates.stage !== oldStage) {
      this.logActivity(
        `Moved to ${this.getStageName(updates.stage)}`, 
        leadId, 
        this.leads[leadIndex].name,
        { fromStage: oldStage, toStage: updates.stage }
      );
    }
    
    // Log priority change if applicable
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
    if (leadIndex === -1) return false;
    
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
    this.renderLeads();
    this.renderAnalytics();
    this.renderActivityTimeline();
    this.updateProgressBars();
    this.renderSelectedLeads();
    this.renderFunnelChart();
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
          // Sort by priority (high first) then by date (newest first)
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
    leadEl.querySelector('.lead-checkbox').addEventListener('change', (e) => {
      this.toggleLeadSelection(lead.id, e.target.checked);
    });
    
    leadEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('lead-checkbox') && !e.target.closest('.lead-checkbox')) {
        this.openEditLeadModal(lead);
      }
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
    document.getElementById('totalLeads').textContent = this.leads.length;
    document.getElementById('conversionRate').textContent = `${this.calculateConversionRate()}%`;
    document.getElementById('avgDwellTime').textContent = `${this.calculateAvgDwellTime()}d`;
    document.getElementById('forecastCompletions').textContent = this.forecastCompletions();
  }
  
  renderFunnelChart() {
    const ctx = document.createElement('canvas');
    ctx.id = 'funnelChart';
    const chartContainer = document.querySelector('.analytics-panel');
    
    // Remove existing chart if it exists
    const existingChart = document.getElementById('funnelChart');
    if (existingChart) {
      existingChart.remove();
    }
    
    // Create new chart container
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.appendChild(ctx);
    
    // Insert after metrics grid
    const metricsGrid = document.querySelector('.metrics-grid');
    if (metricsGrid && chartContainer) {
      chartContainer.insertBefore(container, metricsGrid.nextElementSibling);
    }
    
    const stageCounts = {
      tof: this.leads.filter(l => l.stage === 'tof').length,
      mof: this.leads.filter(l => l.stage === 'mof').length,
      bof: this.leads.filter(l => l.stage === 'bof').length
    };
    
    const conversionRates = {
      tofToMof: stageCounts.tof > 0 ? (stageCounts.mof / stageCounts.tof * 100).toFixed(1) : 0,
      mofToBof: stageCounts.mof > 0 ? (stageCounts.bof / stageCounts.mof * 100).toFixed(1) : 0
    };
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['TOF', 'TOF → MOF', 'MOF', 'MOF → BOF', 'BOF'],
        datasets: [{
          label: 'Leads',
          data: [
            stageCounts.tof,
            0, // Spacer for conversion rate
            stageCounts.mof,
            0, // Spacer for conversion rate
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
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataIndex === 1 || context.dataIndex === 3) {
                  return '';
                }
                return `Leads: ${context.raw}`;
              }
            }
          },
          annotation: {
            annotations: {
              tofToMof: {
                type: 'line',
                yMin: stageCounts.tof,
                yMax: stageCounts.mof,
                borderColor: '#6c757d',
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                  content: `${conversionRates.tofToMof}%`,
                  enabled: true,
                  position: 'right'
                }
              },
              mofToBof: {
                type: 'line',
                yMin: stageCounts.mof,
                yMax: stageCounts.bof,
                borderColor: '#6c757d',
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                  content: `${conversionRates.mofToBof}%`,
                  enabled: true,
                  position: 'right'
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Leads'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Funnel Stage'
            }
          }
        }
      }
    });
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
        
        // Change color if over capacity
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
    document.getElementById('currentStage').value = stage;
    document.getElementById('leadName').value = '';
    document.getElementById('leadEmail').value = '';
    document.getElementById('leadPhone').value = '';
    document.getElementById('leadWebsite').value = '';
    document.getElementById('leadContacts').value = '';
    document.getElementById('leadTag').value = '';
    document.getElementById('leadPriority').value = 'medium';
    document.getElementById('leadNotes').value = '';
    document.getElementById('addLeadModal').style.display = 'block';
    document.getElementById('leadName').focus();
  }
  
  openEditLeadModal(lead) {
    document.getElementById('editingLeadId').value = lead.id;
    document.getElementById('editLeadName').textContent = lead.name;
    
    const tagElement = document.getElementById('editLeadTag');
    tagElement.className = 'lead-tag';
    tagElement.textContent = '';
    
    if (lead.tag) {
      tagElement.classList.add(this.getTagClass(lead.tag));
      tagElement.textContent = this.getTagDisplay(lead.tag);
    }
    
    document.getElementById('editLeadStage').value = lead.stage;
    document.getElementById('editLeadPriority').value = lead.priority;
    document.getElementById('editLeadEmail').value = lead.email || '';
    document.getElementById('editLeadPhone').value = lead.phone || '';
    document.getElementById('editLeadWebsite').value = lead.website || '';
    document.getElementById('editLeadContacts').value = lead.contacts || '';
    document.getElementById('editLeadNotes').value = lead.notes || '';
    document.getElementById('editContentStrategy').value = lead.contentStrategy || '';
    document.getElementById('editLeadModal').style.display = 'block';
  }
  
  closeModal() {
    document.getElementById('addLeadModal').style.display = 'none';
    document.getElementById('editLeadModal').style.display = 'none';
  }
  
  saveNewLead() {
    const stage = document.getElementById('currentStage').value;
    const name = document.getElementById('leadName').value;
    const email = document.getElementById('leadEmail').value;
    const phone = document.getElementById('leadPhone').value;
    const website = document.getElementById('leadWebsite').value;
    const contacts = document.getElementById('leadContacts').value;
    const tag = document.getElementById('leadTag').value;
    const priority = document.getElementById('leadPriority').value;
    const notes = document.getElementById('leadNotes').value;
    
    if (!name) {
      this.showNotification('Lead name is required', 'error');
      return;
    }
    
    const success = this.addLead({ stage, name, email, phone, website, contacts, tag, priority, notes });
    if (success) {
      this.showNotification('Lead added successfully', 'success');
      this.closeModal();
    }
  }
  
  updateCurrentLead() {
    const leadId = document.getElementById('editingLeadId').value;
    const stage = document.getElementById('editLeadStage').value;
    const priority = document.getElementById('editLeadPriority').value;
    const email = document.getElementById('editLeadEmail').value;
    const phone = document.getElementById('editLeadPhone').value;
    const website = document.getElementById('editLeadWebsite').value;
    const contacts = document.getElementById('editLeadContacts').value;
    const notes = document.getElementById('editLeadNotes').value;
    const contentStrategy = document.getElementById('editContentStrategy').value;
    
    const success = this.updateLead(leadId, { 
      stage, 
      priority, 
      email, 
      phone, 
      website, 
      contacts, 
      notes, 
      contentStrategy 
    });
    
    if (success) {
      this.showNotification('Lead updated successfully', 'success');
      this.closeModal();
    }
  }
  
  showNotification(message, type = 'info', duration = 3000) {
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
    panel.classList.toggle('visible');
    
    if (panel.classList.contains('visible')) {
      this.renderFunnelChart();
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
    });
    
    document.querySelectorAll('.lead-card').forEach(card => {
      card.addEventListener('dragstart', () => {
        card.classList.add('dragging');
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        
        // Get new stage from container
        const newContainer = card.closest('.leads-container');
        if (!newContainer) return;
        
        const newStage = newContainer.id.replace('-leads', '');
        const leadId = card.dataset.leadId;
        
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
    const { jsPDF } = window.jspdf;
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
    
    stages.forEach(stage => {
      const stageLeads = this.leads.filter(l => l.stage === stage);
      const stageName = this.getStageName(stage);
      
      // Stage header
      doc.setFillColor(this.hexToRgb(this.getStageColor(stage)));
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`${stageName} (${stageLeads.length})`, 105, yPos + 7, { align: 'center' });
      
      yPos += 15;
      
      // Leads list
      doc.setTextColor(0, 0, 0);
      stageLeads.forEach((lead, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Lead name and tag
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${lead.name}${lead.tag ? ` [${lead.tag}]` : ''}`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        
        // Contact info
        if (lead.email || lead.phone) {
          yPos += 7;
          doc.text(`${lead.email || ''} ${lead.email && lead.phone ? '|' : ''} ${lead.phone || ''}`, 30, yPos);
        }
        
        if (lead.website) {
          yPos += 7;
          doc.text(`Website: ${lead.website}`, 30, yPos);
        }
        
        if (lead.contacts) {
          yPos += 7;
          doc.text(`Contacts: ${lead.contacts}`, 30, yPos);
        }
        
        // Priority
        doc.setTextColor(this.hexToRgb(this.getPriorityColor(lead.priority)));
        doc.text(`Priority: ${lead.priority}`, 160, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += 7;
        
        // Notes
        if (lead.notes) {
          const splitNotes = doc.splitTextToSize(lead.notes, 160);
          doc.text(splitNotes, 30, yPos);
          yPos += splitNotes.length * 7;
        }
        
        // Content strategy
        if (lead.contentStrategy) {
          yPos += 7;
          doc.setFont('helvetica', 'bold');
          doc.text('Content Strategy:', 30, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 7;
          const splitStrategy = doc.splitTextToSize(lead.contentStrategy, 160);
          doc.text(splitStrategy, 30, yPos);
          yPos += splitStrategy.length * 7;
        }
        
        yPos += 5;
      });
      
      yPos += 10;
    });
    
    // Analytics section
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(67, 97, 238);
    doc.text('Funnel Analytics', 105, 20, { align: 'center' });
    
    // Add analytics metrics
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const metrics = [
      { label: 'Total Leads', value: this.leads.length },
      { label: 'Conversion Rate', value: this.calculateConversionRate() + '%' },
      { label: 'Avg. Dwell Time', value: this.calculateAvgDwellTime() + ' days' },
      { label: 'Forecast (7d)', value: this.forecastCompletions() + ' completions' }
    ];
    
    yPos = 40;
    metrics.forEach(metric => {
      doc.text(`${metric.label}:`, 20, yPos);
      doc.text(metric.value.toString(), 180, yPos, { align: 'right' });
      yPos += 10;
    });
    
    // Save the PDF
    doc.save('funnel_report.pdf');
    this.logActivity('Exported PDF report');
    this.showNotification('PDF exported successfully', 'success');
  }
  
  exportAsJSON() {
    const data = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
        totalLeads: this.leads.length
      },
      leads: this.leads,
      analytics: {
        conversionRate: this.calculateConversionRate(),
        avgDwellTime: this.calculateAvgDwellTime(),
        forecast: this.forecastCompletions()
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'funnel_data.json';
    link.click();
    
    this.logActivity('Exported JSON data');
    this.showNotification('JSON exported successfully', 'success');
  }
  
  exportAsCSV() {
    let csv = 'Name,Email,Phone,Website,Contacts,Tag,Stage,Priority,Notes,Content Strategy,Last Updated\n';
    
    this.leads.forEach(lead => {
      csv += `"${lead.name.replace(/"/g, '""')}",` +
             `"${lead.email?.replace(/"/g, '""') || ''}",` +
             `"${lead.phone?.replace(/"/g, '""') || ''}",` +
             `"${lead.website?.replace(/"/g, '""') || ''}",` +
             `"${lead.contacts?.replace(/"/g, '""') || ''}",` +
             `"${lead.tag || ''}",` +
             `"${this.getStageName(lead.stage)}",` +
             `"${lead.priority}",` +
             `"${(lead.notes || '').replace(/"/g, '""')}",` +
             `"${(lead.contentStrategy || '').replace(/"/g, '""')}",` +
             `"${new Date(lead.updatedAt).toLocaleString()}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'funnel_leads.csv';
    link.click();
    
    this.logActivity('Exported CSV data');
    this.showNotification('CSV exported successfully', 'success');
  }
  
  // Utility Functions
  getStageName(stage) {
    const names = {
      tof: 'TOF - Top of Funnel',
      mof: 'MOF - Middle of Funnel',
      bof: 'BOF - Bottom of Funnel'
    };
    return names[stage] || stage;
  }
  
  getStageColor(stage) {
    const colors = {
      tof: '#4cc9f0',
      mof: '#4895ef',
      bof: '#4361ee'
    };
    return colors[stage] || '#6c757d';
  }
  
  getPriorityColor(priority) {
    const colors = {
      high: '#f72585',
      medium: '#ff9e00',
      low: '#4cc9f0'
    };
    return colors[priority] || '#6c757d';
  }
  
  getTagClass(tag) {
    const classes = {
      hot: 'tag-hot',
      cold: 'tag-cold',
      repeat: 'tag-repeat',
      vip: 'tag-vip'
    };
    return classes[tag] || '';
  }
  
  getTagDisplay(tag) {
    const displays = {
      hot: '🔥 Hot lead',
      cold: '❄️ Cold lead',
      repeat: '🔄 Repeat customer',
      vip: '⭐ VIP'
    };
    return displays[tag] || tag;
  }
  
  hexToRgb(hex) {
    // Convert #RRGGBB to [R, G, B]
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
  
  logActivity(action, leadId = null, leadName = null, extraData = {}) {
    const activity = {
      id: this.generateId(),
      action,
      leadId,
      leadName,
      timestamp: new Date().toISOString(),
      ...extraData
    };
    
    this.activityLog.push(activity);
    
    // Keep only the last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }
    
    this.renderActivityTimeline();
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.funnelManager = new FunnelManager();
  
  // Modal close buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => window.funnelManager.closeModal());
  });
  
  // Add Lead form submission
  document.getElementById('addLeadForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.funnelManager.saveNewLead();
  });
  
  // Edit Lead form submission
  document.getElementById('editLeadForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.funnelManager.updateCurrentLead();
  });
  
  // Bulk actions
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && window.funnelManager.selectedLeads.size > 0) {
      window.funnelManager.deleteSelectedLeads();
    }
  });
});

// Global functions for HTML onclick handlers
function toggleAnalytics() {
  window.funnelManager.toggleAnalytics();
}

function exportAsPDF() {
  window.funnelManager.exportAsPDF();
}

function exportAsJSON() {
  window.funnelManager.exportAsJSON();
}

function exportAsCSV() {
  window.funnelManager.exportAsCSV();
}

function loadExample() {
  if (confirm('Load example data? This will replace your current leads.')) {
    window.funnelManager.loadExampleLeads();
  }
}

function openAddLeadModal(stage) {
  window.funnelManager.openAddLeadModal(stage);
}

function closeModal() {
  window.funnelManager.closeModal();
}

function deleteLead() {
  const leadId = document.getElementById('editingLeadId').value;
  if (confirm('Are you sure you want to delete this lead?')) {
    window.funnelManager.deleteLead(leadId);
    window.funnelManager.closeModal();
  }
}
