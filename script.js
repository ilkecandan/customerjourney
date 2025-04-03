// Main App Controller
class FunnelManager {
  constructor() {
    this.leads = [];
    this.activityLog = [];
    this.selectedLeads = new Set();
    this.stageCapacity = {
      tof: 50,
      mof: 30,
      bof: 20
    };
    
    this.init();
  }
  
  init() {
    this.loadLeads();
    this.setupDragAndDrop();
    this.setupKeyboardShortcuts();
    this.setupProgressBars();
    this.render();
    
    // Auto-save every 30 seconds
    setInterval(() => this.saveLeads(), 30000);
    
    // Register beforeunload handler
    window.addEventListener('beforeunload', () => this.saveLeads());
  }
  
  // Enhanced lead loading with validation
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
  }
  
  // Save with error handling
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
    }
  }
  
  // PDF Export using jsPDF
  exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238);
    doc.text('Sales Funnel Report', 105, 20, { align: 'center' });
    
    // Funnel visualization
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Add funnel stages
    const stages = ['tof', 'mof', 'bof'];
    let yPos = 40;
    
    stages.forEach(stage => {
      const stageLeads = this.leads.filter(l => l.stage === stage);
      const stageName = this.getStageName(stage);
      
      // Stage header
      doc.setFillColor(this.getStageColor(stage));
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`${stageName} (${stageLeads.length})`, 105, yPos + 7, { align: 'center' });
      
      yPos += 15;
      
      // Leads list
      doc.setTextColor(0, 0, 0);
      stageLeads.forEach(lead => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(`• ${lead.name}${lead.tag ? ` [${lead.tag}]` : ''}`, 25, yPos);
        yPos += 7;
        
        if (lead.notes) {
          doc.setFontSize(10);
          doc.text(`  ${lead.notes.substring(0, 50)}${lead.notes.length > 50 ? '...' : ''}`, 30, yPos);
          doc.setFontSize(12);
          yPos += 7;
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
      { label: 'Avg. Dwell Time', value: this.calculateAvgDwellTime() },
      { label: 'Forecast (7d)', value: this.forecastCompletions() }
    ];
    
    yPos = 40;
    metrics.forEach(metric => {
      doc.text(`${metric.label}:`, 20, yPos);
      doc.text(metric.value.toString(), 150, yPos, { align: 'right' });
      yPos += 10;
    });
    
    // Save the PDF
    doc.save('funnel_report.pdf');
    this.logActivity('Exported PDF report');
    this.showNotification('PDF exported successfully', 'success');
  }
  
  // CSV Export
  exportAsCSV() {
    let csv = 'Name,Tag,Stage,Notes,Priority,Last Updated\n';
    
    this.leads.forEach(lead => {
      csv += `"${lead.name}","${lead.tag || ''}","${this.getStageName(lead.stage)}",` +
             `"${(lead.notes || '').replace(/"/g, '""')}","${lead.priority || 'medium'}",` +
             `"${new Date(lead.updatedAt || lead.createdAt).toLocaleString()}"\n`;
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
  
  // JSON Export
  exportAsJSON() {
    const data = {
      meta: { exportedAt: new Date().toISOString(), version: 1 },
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
  
  // Analytics Functions
  calculateConversionRate() {
    const tofCount = this.leads.filter(l => l.stage === 'tof').length;
    const bofCount = this.leads.filter(l => l.stage === 'bof').length;
    return tofCount > 0 ? ((bofCount / tofCount) * 100).toFixed(1) : 0;
  }
  
  calculateAvgDwellTime() {
    const movedLeads = this.activityLog.filter(a => a.action === 'stage_change');
    if (movedLeads.length === 0) return '0d';
    
    const totalDays = movedLeads.reduce((sum, action) => {
      return sum + (action.dwellTime || 0);
    }, 0);
    
    const avgDays = totalDays / movedLeads.length;
    return avgDays >= 1 ? `${avgDays.toFixed(1)}d` : '<1d';
  }
  
  forecastCompletions() {
    const avgConversion = this.calculateConversionRate() / 100;
    const avgDays = parseFloat(this.calculateAvgDwellTime()) || 7;
    const currentBof = this.leads.filter(l => l.stage === 'bof').length;
    
    return Math.round(currentBof + (this.leads.filter(l => l.stage === 'mof').length * avgConversion));
  }
  
  // UI Rendering
  render() {
    this.renderLeads();
    this.renderAnalytics();
    this.renderActivityTimeline();
    this.updateProgressBars();
  }
  
  renderLeads() {
    const stages = ['tof', 'mof', 'bof'];
    stages.forEach(stage => {
      const container = document.getElementById(`${stage}-leads`);
      if (!container) return;
      
      container.innerHTML = '';
      const stageLeads = this.leads.filter(l => l.stage === stage);
      
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
    leadEl.className = `lead-card priority-${lead.priority || 'medium'}`;
    leadEl.dataset.leadId = lead.id;
    leadEl.draggable = true;
    
    // Add checkbox for bulk actions
    leadEl.innerHTML = `
      <label class="lead-selector">
        <input type="checkbox" class="lead-checkbox" data-lead-id="${lead.id}">
        <span class="checkmark"></span>
      </label>
      <div class="lead-name">${lead.name}</div>
      ${lead.tag ? `<span class="lead-tag ${this.getTagClass(lead.tag)}">${this.getTagDisplay(lead.tag)}</span>` : ''}
      <div class="lead-meta">
        <span class="lead-notes" title="${lead.notes || 'No notes'}">
          ${lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? '...' : '') : 'No notes'}
        </span>
        <span class="lead-date">
          ${new Date(lead.updatedAt || lead.createdAt).toLocaleDateString()}
        </span>
      </div>
    `;
    
    // Add event listeners
    leadEl.querySelector('.lead-checkbox').addEventListener('change', (e) => {
      this.toggleLeadSelection(lead.id, e.target.checked);
    });
    
    leadEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('lead-checkbox') && !e.target.closest('.lead-checkbox')) {
        this.openLeadDetails(lead);
      }
    });
    
    return leadEl;
  }
  
  // ... (additional methods for all other functionality)
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  window.funnelManager = new FunnelManager();
});
