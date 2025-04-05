document.addEventListener('DOMContentLoaded', function () {
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';

    if (isAuthenticated) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        initializeApp();
    } else {
        setupAuth();
    }
});

// Authentication setup
function setupAuth() {
    const pinInput = document.getElementById('pin-input');
    const loginBtn = document.getElementById('login-btn');
    const pinError = document.getElementById('pin-error');

    loginBtn.addEventListener('click', function() {
        if (pinInput.value === '1234') {
            localStorage.setItem('authenticated', 'true');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            initializeApp();
        } else {
            pinError.textContent = 'Incorrect PIN. Please try again.';
        }
    });

    pinInput.addEventListener('input', function() {
        pinError.textContent = '';
    });
}

// Main application initialization
function initializeApp() {
    // Initialize default funnels if none exist
    if (!localStorage.getItem('funnels')) {
        const defaultFunnels = [
            {
                id: 'tof-' + Date.now(),
                name: 'Top of Funnel',
                type: 'TOF',
                description: 'Awareness stage - attracting potential customers',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'mof-' + Date.now(),
                name: 'Middle of Funnel',
                type: 'MOF',
                description: 'Consideration stage - nurturing leads',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'bof-' + Date.now(),
                name: 'Bottom of Funnel',
                type: 'BOF',
                description: 'Decision stage - converting leads to customers',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'conversion-' + Date.now(),
                name: 'Conversion',
                type: 'CONVERSION',
                description: 'Customers who completed purchase',
                leads: [],
                contentStrategy: []
            }
        ];
        localStorage.setItem('funnels', JSON.stringify(defaultFunnels));
    }

    // Load funnels from localStorage
    loadFunnels();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize analytics
    updateAnalytics();
    
    // Setup PWA installation
    setupPWA();
    
    // Initialize tutorial tooltips
    setupTutorialTooltips();
}

// Initialize tutorial tooltips
function setupTutorialTooltips() {
    document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
        const tooltip = trigger.querySelector('.tutorial-tooltip');
        
        trigger.addEventListener('mouseenter', () => {
            tooltip.classList.add('show');
        });
        
        trigger.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    });
}

// Load funnels from localStorage and render them
function loadFunnels() {
    const funnelsContainer = document.getElementById('funnels-container');
    funnelsContainer.innerHTML = '';
    
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    
    funnels.forEach(funnel => {
        const funnelElement = createFunnelElement(funnel);
        funnelsContainer.appendChild(funnelElement);
    });
    
    // Initialize drag and drop for leads
    setupDragAndDrop();
    
    // Load leads section
    loadLeadsSection();
}

// Create a funnel DOM element
function createFunnelElement(funnel) {
    const funnelElement = document.createElement('div');
    funnelElement.className = 'funnel tooltip-trigger';
    funnelElement.dataset.funnelId = funnel.id;
    funnelElement.dataset.funnelType = funnel.type;
    
    // Funnel stage
    const stage = document.createElement('div');
    stage.className = `funnel-stage ${funnel.type.toLowerCase()}`;
    
    const title = document.createElement('h3');
    title.textContent = funnel.name;
    
    const description = document.createElement('div');
    description.className = 'funnel-description';
    description.textContent = funnel.description;
    
    const metrics = document.createElement('div');
    metrics.className = 'funnel-metrics';
    
    const leadsMetric = document.createElement('div');
    leadsMetric.className = 'funnel-metric';
    leadsMetric.innerHTML = `
        <div class="funnel-metric-value">${funnel.leads.length}</div>
        <div class="funnel-metric-label">Leads</div>
    `;
    
    metrics.appendChild(leadsMetric);
    
    if (funnel.type === 'TOF' || funnel.type === 'MOF' || funnel.type === 'BOF') {
        const conversionMetric = document.createElement('div');
        conversionMetric.className = 'funnel-metric';
        
        let conversionRate = '0%';
        const funnels = JSON.parse(localStorage.getItem('funnels'));
        
        if (funnel.type === 'TOF') {
            const mofFunnel = funnels.find(f => f.type === 'MOF');
            conversionRate = funnel.leads.length > 0 
                ? `${Math.round((mofFunnel.leads.length / funnel.leads.length) * 100)}%` 
                : '0%';
        } else if (funnel.type === 'MOF') {
            const bofFunnel = funnels.find(f => f.type === 'BOF');
            conversionRate = funnel.leads.length > 0 
                ? `${Math.round((bofFunnel.leads.length / funnel.leads.length) * 100)}%` 
                : '0%';
        } else if (funnel.type === 'BOF') {
            const conversionFunnel = funnels.find(f => f.type === 'CONVERSION');
            conversionRate = funnel.leads.length > 0 
                ? `${Math.round((conversionFunnel.leads.length / funnel.leads.length) * 100)}%` 
                : '0%';
        }
        
        conversionMetric.innerHTML = `
            <div class="funnel-metric-value">${conversionRate}</div>
            <div class="funnel-metric-label">Conversion</div>
        `;
        
        metrics.appendChild(conversionMetric);
    }
    
    stage.appendChild(title);
    stage.appendChild(description);
    stage.appendChild(metrics);
    
    // Add lead button
    const addLeadBtn = document.createElement('button');
    addLeadBtn.className = 'add-lead-btn';
    addLeadBtn.innerHTML = '<i class="fas fa-plus"></i> Add Lead';
    addLeadBtn.addEventListener('click', () => {
        document.getElementById('lead-funnel-id').value = funnel.id;
        document.getElementById('add-lead-modal').classList.remove('hidden');
    });
    
    stage.appendChild(addLeadBtn);
    
    funnelElement.appendChild(stage);
    
    // Add connector if not the last funnel
    if (funnel.type !== 'CONVERSION') {
        const connector = document.createElement('div');
        connector.className = 'funnel-connector';
        funnelElement.appendChild(connector);
    }
    
    // Add tutorial tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip tooltip-top';
    
    let tooltipContent = '';
    if (funnel.type === 'TOF') {
        tooltipContent = `
            <h4>Top of Funnel</h4>
            <p>This is where visitors first discover your brand. Focus on educational content that addresses their pain points.</p>
        `;
    } else if (funnel.type === 'MOF') {
        tooltipContent = `
            <h4>Middle of Funnel</h4>
            <p>Leads here are evaluating solutions. Provide comparison guides and case studies to showcase your value.</p>
        `;
    } else if (funnel.type === 'BOF') {
        tooltipContent = `
            <h4>Bottom of Funnel</h4>
            <p>Leads are ready to buy. Offer demos, free trials, and consultations to close the deal.</p>
        `;
    } else {
        tooltipContent = `
            <h4>Conversion Stage</h4>
            <p>Congratulations! These leads became customers. Focus now on retention and upselling.</p>
        `;
    }
    
    tooltip.innerHTML = tooltipContent;
    funnelElement.appendChild(tooltip);
    
    return funnelElement;
}

// Load leads section
function loadLeadsSection() {
    const leadsGrid = document.querySelector('.leads-grid');
    leadsGrid.innerHTML = '';
    
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    const allLeads = funnels.flatMap(funnel => 
        funnel.leads.map(lead => ({ ...lead, funnelId: funnel.id, funnelName: funnel.name }))
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    
    allLeads.forEach(lead => {
        const leadCard = createLeadCard(lead);
        leadsGrid.appendChild(leadCard);
    });
}

// Create lead card for leads section
function createLeadCard(lead) {
    const leadCard = document.createElement('div');
    leadCard.className = 'lead-card tooltip-trigger';
    leadCard.dataset.leadId = lead.id;
    leadCard.dataset.funnelId = lead.funnelId;
    
    leadCard.innerHTML = `
        <div class="lead-name">${lead.company}</div>
        <div class="lead-info">
            <span><i class="fas fa-envelope"></i> ${lead.email || 'No email'}</span>
            <span><i class="fas fa-phone"></i> ${lead.phone || 'No phone'}</span>
        </div>
        <div class="lead-stage">${lead.funnelName}</div>
    `;
    
    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip tooltip-top';
    tooltip.innerHTML = `
        <h4>Lead Details</h4>
        <p>Click to view/edit. Drag between funnel stages to update status.</p>
        <p><strong>Added:</strong> ${new Date(lead.dateAdded).toLocaleDateString()}</p>
        ${lead.notes ? `<p><strong>Notes:</strong> ${lead.notes}</p>` : ''}
    `;
    leadCard.appendChild(tooltip);
    
    // Make draggable
    leadCard.draggable = true;
    leadCard.addEventListener('dragstart', handleDragStart);
    
    // Add click to edit
    leadCard.addEventListener('click', () => {
        openEditLeadModal(lead, lead.funnelId);
    });
    
    return leadCard;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const funnelStages = document.querySelectorAll('.funnel-stage');
    
    funnelStages.forEach(stage => {
        stage.addEventListener('dragover', handleDragOver);
        stage.addEventListener('dragleave', handleDragLeave);
        stage.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        leadId: e.target.dataset.leadId,
        sourceFunnelId: e.target.dataset.funnelId
    }));
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    e.currentTarget.style.boxShadow = 'var(--glow-shadow)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    e.currentTarget.style.boxShadow = '';
}

function handleDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const leadId = data.leadId;
    const sourceFunnelId = data.sourceFunnelId;
    const targetFunnelId = e.currentTarget.closest('.funnel').dataset.funnelId;
    
    e.currentTarget.style.backgroundColor = '';
    e.currentTarget.style.boxShadow = '';
    
    if (sourceFunnelId !== targetFunnelId) {
        moveLeadToFunnel(leadId, sourceFunnelId, targetFunnelId);
    }
    
    // Reset dragged element
    const draggingElement = document.querySelector('.lead-card.dragging');
    if (draggingElement) {
        draggingElement.style.opacity = '1';
        draggingElement.classList.remove('dragging');
    }
}

// Move lead to another funnel
function moveLeadToFunnel(leadId, sourceFunnelId, targetFunnelId) {
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    
    // Find source funnel and lead
    const sourceFunnel = funnels.find(f => f.id === sourceFunnelId);
    const leadIndex = sourceFunnel.leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) return;
    
    const lead = sourceFunnel.leads[leadIndex];
    
    // Remove from source funnel
    sourceFunnel.leads.splice(leadIndex, 1);
    
    // Add to target funnel
    const targetFunnel = funnels.find(f => f.id === targetFunnelId);
    targetFunnel.leads.push(lead);
    
    // Save to localStorage
    localStorage.setItem('funnels', JSON.stringify(funnels));
    
    // Reload funnels and leads
    loadFunnels();
    loadLeadsSection();
    
    // Update analytics
    updateAnalytics();
    
    // Show notification
    showNotification(`Lead moved from ${sourceFunnel.name} to ${targetFunnel.name}`);
}

// Setup event listeners for modals and buttons
function setupEventListeners() {
    // Add Funnel Modal
    document.getElementById('add-funnel').addEventListener('click', () => {
        document.getElementById('funnel-form').reset();
        document.getElementById('add-funnel-modal').classList.remove('hidden');
    });
    
    document.getElementById('funnel-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addFunnel();
    });
    
    // Add Lead Modal
    document.getElementById('lead-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addLead();
    });
    
    // Edit Lead Modal
    document.getElementById('edit-lead-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveLeadChanges();
    });
    
    document.getElementById('delete-lead-btn').addEventListener('click', function() {
        const leadId = document.getElementById('edit-lead-id').value;
        const funnelId = document.getElementById('edit-lead-form').dataset.funnelId;
        deleteLead(leadId, funnelId);
        document.getElementById('edit-lead-modal').classList.add('hidden');
    });
    
    // Lead filters
    document.querySelectorAll('.lead-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelector('.lead-filter.active').classList.remove('active');
            this.classList.add('active');
            filterLeads(this.textContent);
        });
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
    
    // Export PDF
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
}

// Filter leads based on selection
function filterLeads(filter) {
    const leadsGrid = document.querySelector('.leads-grid');
    const leadCards = leadsGrid.querySelectorAll('.lead-card');
    
    leadCards.forEach(card => {
        if (filter === 'All Leads' || card.querySelector('.lead-stage').textContent.includes(filter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Add a new lead
function addLead() {
    const funnelId = document.getElementById('lead-funnel-id').value;
    const company = document.getElementById('lead-company').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone').value;
    const website = document.getElementById('lead-website').value;
    const notes = document.getElementById('lead-notes').value;
    
    const newLead = {
        id: 'lead-' + Date.now(),
        company: company,
        email: email,
        phone: phone,
        website: website,
        notes: notes,
        dateAdded: new Date().toISOString()
    };
    
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    const funnel = funnels.find(f => f.id === funnelId);
    
    if (funnel) {
        funnel.leads.push(newLead);
        localStorage.setItem('funnels', JSON.stringify(funnels));
        
        document.getElementById('add-lead-modal').classList.add('hidden');
        document.getElementById('lead-form').reset();
        loadFunnels();
        updateAnalytics();
        showNotification('Lead added successfully');
    }
}

// Open edit lead modal
function openEditLeadModal(lead, funnelId) {
    document.getElementById('edit-lead-company').value = lead.company;
    document.getElementById('edit-lead-email').value = lead.email || '';
    document.getElementById('edit-lead-phone').value = lead.phone || '';
    document.getElementById('edit-lead-website').value = lead.website || '';
    document.getElementById('edit-lead-notes').value = lead.notes || '';
    document.getElementById('edit-lead-id').value = lead.id;
    
    // Set funnel dropdown
    const funnelSelect = document.getElementById('edit-lead-funnel');
    funnelSelect.innerHTML = '';
    
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    funnels.forEach(funnel => {
        const option = document.createElement('option');
        option.value = funnel.id;
        option.textContent = funnel.name;
        option.selected = funnel.id === funnelId;
        funnelSelect.appendChild(option);
    });
    
    // Store funnelId on form for delete operation
    document.getElementById('edit-lead-form').dataset.funnelId = funnelId;
    
    document.getElementById('edit-lead-modal').classList.remove('hidden');
}

// Save lead changes
function saveLeadChanges() {
    const leadId = document.getElementById('edit-lead-id').value;
    const currentFunnelId = document.getElementById('edit-lead-form').dataset.funnelId;
    const newFunnelId = document.getElementById('edit-lead-funnel').value;
    
    const company = document.getElementById('edit-lead-company').value;
    const email = document.getElementById('edit-lead-email').value;
    const phone = document.getElementById('edit-lead-phone').value;
    const website = document.getElementById('edit-lead-website').value;
    const notes = document.getElementById('edit-lead-notes').value;
    
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    
    // Find current funnel and lead
    const currentFunnel = funnels.find(f => f.id === currentFunnelId);
    const leadIndex = currentFunnel.leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) return;
    
    // Update lead data
    const updatedLead = {
        ...currentFunnel.leads[leadIndex],
        company: company,
        email: email,
        phone: phone,
        website: website,
        notes: notes
    };
    
    if (currentFunnelId !== newFunnelId) {
        // Move to new funnel
        currentFunnel.leads.splice(leadIndex, 1);
        const newFunnel = funnels.find(f => f.id === newFunnelId);
        newFunnel.leads.push(updatedLead);
    } else {
        // Update in current funnel
        currentFunnel.leads[leadIndex] = updatedLead;
    }
    
    localStorage.setItem('funnels', JSON.stringify(funnels));
    document.getElementById('edit-lead-modal').classList.add('hidden');
    loadFunnels();
    loadLeadsSection();
    updateAnalytics();
    showNotification('Lead updated successfully');
}

// Delete a lead
function deleteLead(leadId, funnelId) {
    if (confirm('Are you sure you want to delete this lead?')) {
        const funnels = JSON.parse(localStorage.getItem('funnels'));
        const funnel = funnels.find(f => f.id === funnelId);
        
        if (funnel) {
            funnel.leads = funnel.leads.filter(lead => lead.id !== leadId);
            localStorage.setItem('funnels', JSON.stringify(funnels));
            loadFunnels();
            loadLeadsSection();
            updateAnalytics();
            showNotification('Lead deleted successfully');
        }
    }
}

// Update analytics
function updateAnalytics() {
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    
    // Calculate total leads
    const totalLeads = funnels.reduce((sum, funnel) => sum + funnel.leads.length, 0);
    document.getElementById('total-leads').textContent = totalLeads;
    
    // Find TOF, MOF, BOF funnels
    const tofFunnel = funnels.find(f => f.type === 'TOF');
    const mofFunnel = funnels.find(f => f.type === 'MOF');
    const bofFunnel = funnels.find(f => f.type === 'BOF');
    const conversionFunnel = funnels.find(f => f.type === 'CONVERSION');
    
    // Calculate conversion rates
    let tofMofRate = '0%';
    let mofBofRate = '0%';
    let bofConversionRate = '0%';
    let overallRate = '0%';
    
    if (tofFunnel && mofFunnel) {
        const tofCount = tofFunnel.leads.length;
        const mofCount = mofFunnel.leads.length;
        tofMofRate = tofCount > 0 ? `${Math.round((mofCount / tofCount) * 100)}%` : '0%';
    }
    
    if (mofFunnel && bofFunnel) {
        const mofCount = mofFunnel.leads.length;
        const bofCount = bofFunnel.leads.length;
        mofBofRate = mofCount > 0 ? `${Math.round((bofCount / mofCount) * 100)}%` : '0%';
    }
    
    if (bofFunnel && conversionFunnel) {
        const bofCount = bofFunnel.leads.length;
        const conversionCount = conversionFunnel.leads.length;
        bofConversionRate = bofCount > 0 ? `${Math.round((conversionCount / bofCount) * 100)}%` : '0%';
    }
    
    if (tofFunnel && conversionFunnel) {
        const tofCount = tofFunnel.leads.length;
        const conversionCount = conversionFunnel.leads.length;
        overallRate = tofCount > 0 ? `${Math.round((conversionCount / tofCount) * 100)}%` : '0%';
    }
    
    document.getElementById('tof-mof-rate').textContent = tofMofRate;
    document.getElementById('mof-bof-rate').textContent = mofBofRate;
    document.getElementById('bof-conversion-rate').textContent = bofConversionRate;
    document.getElementById('overall-rate').textContent = overallRate;
    
    // Update chart
    updateConversionChart(tofFunnel, mofFunnel, bofFunnel, conversionFunnel);
}

// Update conversion chart
function updateConversionChart(tofFunnel, mofFunnel, bofFunnel, conversionFunnel) {
    const ctx = document.getElementById('conversion-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.conversionChart) {
        window.conversionChart.destroy();
    }
    
    const tofCount = tofFunnel ? tofFunnel.leads.length : 0;
    const mofCount = mofFunnel ? mofFunnel.leads.length : 0;
    const bofCount = bofFunnel ? bofFunnel.leads.length : 0;
    const conversionCount = conversionFunnel ? conversionFunnel.leads.length : 0;
    
    window.conversionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TOF (Awareness)', 'MOF (Consideration)', 'BOF (Decision)', 'Conversion'],
            datasets: [{
                label: 'Number of Leads',
                data: [tofCount, mofCount, bofCount, conversionCount],
                backgroundColor: [
                    'rgba(90, 79, 207, 0.7)',
                    'rgba(110, 215, 255, 0.7)',
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(46, 125, 50, 0.7)'
                ],
                borderColor: [
                    'rgba(90, 79, 207, 1)',
                    'rgba(110, 215, 255, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(46, 125, 50, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            
                            if (label.includes('TOF') && mofCount > 0) {
                                return `TOF → MOF Conversion: ${Math.round((mofCount / tofCount) * 100)}%`;
                            } else if (label.includes('MOF') && bofCount > 0) {
                                return `MOF → BOF Conversion: ${Math.round((bofCount / mofCount) * 100)}%`;
                            } else if (label.includes('BOF') && conversionCount > 0) {
                                return `BOF → Conversion: ${Math.round((conversionCount / bofCount) * 100)}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Show notification
function showNotification(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// PWA Installation
function setupPWA() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('install-btn').classList.remove('hidden');
    });
    
    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            document.getElementById('install-btn').classList.add('hidden');
            deferredPrompt = null;
        }
    });
    
    window.addEventListener('appinstalled', () => {
        document.getElementById('install-btn').classList.add('hidden');
        deferredPrompt = null;
        console.log('PWA was installed');
    });
}
