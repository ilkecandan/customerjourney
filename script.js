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
                name: 'Top of Funnel (TOF)',
                type: 'TOF',
                description: 'Awareness stage - attracting potential customers',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'mof-' + Date.now(),
                name: 'Middle of Funnel (MOF)',
                type: 'MOF',
                description: 'Consideration stage - nurturing leads',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'bof-' + Date.now(),
                name: 'Bottom of Funnel (BOF)',
                type: 'BOF',
                description: 'Decision stage - converting leads to customers',
                leads: [],
                contentStrategy: []
            }
        ];
        localStorage.setItem('funnels', JSON.stringify(defaultFunnels));
    }

    // Load funnels and leads
    loadFunnels();
    loadLeads();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize analytics
    updateAnalytics();
    
    // Setup PWA installation
    setupPWA();
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
}

// Create a funnel DOM element
function createFunnelElement(funnel) {
    const funnelElement = document.createElement('div');
    funnelElement.className = 'compact-funnel';
    funnelElement.dataset.funnelId = funnel.id;
    funnelElement.dataset.funnelType = funnel.type;
    
    // Funnel header
    const header = document.createElement('div');
    header.className = 'funnel-header';
    
    const title = document.createElement('h3');
    title.textContent = funnel.name;
    
    const count = document.createElement('div');
    count.className = 'funnel-count';
    count.textContent = funnel.leads.length;
    
    header.appendChild(title);
    header.appendChild(count);
    
    // Funnel body (drop zone)
    const body = document.createElement('div');
    body.className = 'funnel-body';
    body.addEventListener('dragover', handleDragOver);
    body.addEventListener('dragleave', handleDragLeave);
    body.addEventListener('drop', handleDrop);
    
    funnelElement.appendChild(header);
    funnelElement.appendChild(body);
    
    return funnelElement;
}

// Load leads from all funnels and render them
function loadLeads() {
    const leadsGrid = document.querySelector('.leads-grid');
    leadsGrid.innerHTML = '';
    
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    const allLeads = funnels.flatMap(funnel => 
        funnel.leads.map(lead => ({ ...lead, funnelId: funnel.id }))
    );
    
    allLeads.forEach(lead => {
        const leadCard = createLeadCard(lead);
        leadsGrid.appendChild(leadCard);
    });
}

// Create a lead card element
function createLeadCard(lead) {
    const leadCard = document.createElement('div');
    leadCard.className = 'lead-card';
    leadCard.draggable = true;
    leadCard.dataset.leadId = lead.id;
    leadCard.dataset.funnelId = lead.funnelId;
    
    const company = document.createElement('div');
    company.className = 'lead-company';
    company.textContent = lead.company;
    
    const info = document.createElement('div');
    info.className = 'lead-info';
    
    if (lead.email) {
        const email = document.createElement('div');
        email.className = 'lead-email';
        email.innerHTML = `<i class="fas fa-envelope"></i> ${lead.email}`;
        info.appendChild(email);
    }
    
    if (lead.phone) {
        const phone = document.createElement('div');
        phone.className = 'lead-phone';
        phone.innerHTML = `<i class="fas fa-phone"></i> ${lead.phone}`;
        info.appendChild(phone);
    }
    
    const stage = document.createElement('div');
    stage.className = 'lead-stage';
    stage.textContent = lead.funnelId.startsWith('tof') ? 'TOF' : 
                       lead.funnelId.startsWith('mof') ? 'MOF' : 'BOF';
    
    const actions = document.createElement('div');
    actions.className = 'lead-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'lead-action-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', () => openEditLeadModal(lead, lead.funnelId));
    
    actions.appendChild(editBtn);
    
    leadCard.appendChild(company);
    leadCard.appendChild(info);
    leadCard.appendChild(stage);
    leadCard.appendChild(actions);
    
    // Drag events
    leadCard.addEventListener('dragstart', handleDragStart);
    
    return leadCard;
}

// Drag and drop handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        leadId: e.target.dataset.leadId,
        sourceFunnelId: e.target.dataset.funnelId
    }));
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const leadId = data.leadId;
    const sourceFunnelId = data.sourceFunnelId;
    const targetFunnelId = e.currentTarget.closest('.compact-funnel').dataset.funnelId;
    
    e.currentTarget.classList.remove('drag-over');
    
    if (sourceFunnelId !== targetFunnelId) {
        moveLeadToFunnel(leadId, sourceFunnelId, targetFunnelId);
    }
    
    // Reset dragged element
    const draggingElement = document.querySelector('.lead-card.dragging');
    if (draggingElement) {
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
    
    // Reload UI
    loadFunnels();
    loadLeads();
    updateAnalytics();
    
    // Show notification
    showNotification(`Lead moved to ${targetFunnel.name}`);
}

// Setup event listeners for modals and buttons
function setupEventListeners() {
    // Add Funnel Modal
    document.getElementById('add-funnel').addEventListener('click', () => {
        document.getElementById('funnel-form').reset();
        document.getElementById('funnel-form').onsubmit = function(e) {
            e.preventDefault();
            addFunnel();
        };
        document.getElementById('add-funnel-modal').classList.remove('hidden');
    });
    
    // Add Lead Modal
    document.getElementById('add-lead-btn').addEventListener('click', () => {
        document.getElementById('lead-form').reset();
        document.getElementById('add-lead-modal').classList.remove('hidden');
    });
    
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

// Add a new funnel
function addFunnel() {
    const name = document.getElementById('funnel-name').value;
    const type = document.getElementById('funnel-type').value;
    const description = document.getElementById('funnel-description').value;
    
    const newFunnel = {
        id: 'funnel-' + Date.now(),
        name: name,
        type: type,
        description: description,
        leads: [],
        contentStrategy: []
    };
    
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    funnels.push(newFunnel);
    localStorage.setItem('funnels', JSON.stringify(funnels));
    
    document.getElementById('add-funnel-modal').classList.add('hidden');
    loadFunnels();
    showNotification('Funnel added successfully');
}

// Add a new lead
function addLead() {
    const company = document.getElementById('lead-company').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone').value;
    const website = document.getElementById('lead-website').value;
    const notes = document.getElementById('lead-notes').value;
    
    const contentStrategySelect = document.getElementById('lead-content-strategy');
    const contentStrategy = Array.from(contentStrategySelect.selectedOptions).map(opt => opt.value);
    
    // Default to TOF if no funnel specified
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    const tofFunnel = funnels.find(f => f.type === 'TOF');
    
    const newLead = {
        id: 'lead-' + Date.now(),
        company: company,
        email: email,
        phone: phone,
        website: website,
        notes: notes,
        contentStrategy: contentStrategy,
        dateAdded: new Date().toISOString()
    };
    
    if (tofFunnel) {
        tofFunnel.leads.push(newLead);
        localStorage.setItem('funnels', JSON.stringify(funnels));
        
        document.getElementById('add-lead-modal').classList.add('hidden');
        document.getElementById('lead-form').reset();
        loadLeads();
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
    
    // Set content strategy
    const contentStrategySelect = document.getElementById('edit-lead-content-strategy');
    Array.from(contentStrategySelect.options).forEach(option => {
        option.selected = lead.contentStrategy.includes(option.value);
    });
    
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
    
    const contentStrategySelect = document.getElementById('edit-lead-content-strategy');
    const contentStrategy = Array.from(contentStrategySelect.selectedOptions).map(opt => opt.value);
    
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
        notes: notes,
        contentStrategy: contentStrategy
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
    loadLeads();
    loadFunnels();
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
            loadLeads();
            loadFunnels();
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
    
    // Calculate conversion rates
    let tofMofRate = '0%';
    let mofBofRate = '0%';
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
    
    if (tofFunnel && bofFunnel) {
        const tofCount = tofFunnel.leads.length;
        const bofCount = bofFunnel.leads.length;
        overallRate = tofCount > 0 ? `${Math.round((bofCount / tofCount) * 100)}%` : '0%';
    }
    
    document.getElementById('tof-mof-rate').textContent = tofMofRate;
    document.getElementById('mof-bof-rate').textContent = mofBofRate;
    document.getElementById('overall-rate').textContent = overallRate;
    
    // Update chart
    updateConversionChart(tofFunnel, mofFunnel, bofFunnel);
}

// Update conversion chart
function updateConversionChart(tofFunnel, mofFunnel, bofFunnel) {
    const ctx = document.getElementById('conversion-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.conversionChart) {
        window.conversionChart.destroy();
    }
    
    const tofCount = tofFunnel ? tofFunnel.leads.length : 0;
    const mofCount = mofFunnel ? mofFunnel.leads.length : 0;
    const bofCount = bofFunnel ? bofFunnel.leads.length : 0;
    
    window.conversionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TOF (Awareness)', 'MOF (Consideration)', 'BOF (Decision)'],
            datasets: [{
                label: 'Number of Leads',
                data: [tofCount, mofCount, bofCount],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            
                            if (label.includes('TOF') && mofCount > 0) {
                                return `TOF → MOF Conversion: ${Math.round((mofCount / tofCount) * 100)}%`;
                            } else if (label.includes('MOF') && bofCount > 0) {
                                return `MOF → BOF Conversion: ${Math.round((bofCount / mofCount) * 100)}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Marketing Funnel Report', 105, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Add funnel data
    const funnels = JSON.parse(localStorage.getItem('funnels')) || [];
    let yPosition = 50;
    
    funnels.forEach(funnel => {
        // Funnel header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 255);
        doc.text(`${funnel.name} (${funnel.type})`, 14, yPosition);
        yPosition += 10;
        
        // Funnel description
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Description: ${funnel.description}`, 14, yPosition);
        yPosition += 10;
        
        // Content strategy
        doc.text(`Content Strategy: ${funnel.contentStrategy.join(', ') || 'None defined'}`, 14, yPosition);
        yPosition += 10;
        
        // Leads count
        doc.text(`Leads: ${funnel.leads.length}`, 14, yPosition);
        yPosition += 10;
        
        // Add space between funnels
        yPosition += 10;
        
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
    });
    
    // Add analytics
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Funnel Analytics', 105, 20, { align: 'center' });
    
    // Get analytics data
    const totalLeads = document.getElementById('total-leads').textContent;
    const tofMofRate = document.getElementById('tof-mof-rate').textContent;
    const mofBofRate = document.getElementById('mof-bof-rate').textContent;
    const overallRate = document.getElementById('overall-rate').textContent;
    
    doc.setFontSize(12);
    doc.text(`Total Leads: ${totalLeads}`, 14, 40);
    doc.text(`TOF → MOF Conversion Rate: ${tofMofRate}`, 14, 50);
    doc.text(`MOF → BOF Conversion Rate: ${mofBofRate}`, 14, 60);
    doc.text(`Overall Conversion Rate: ${overallRate}`, 14, 70);
    
    // Save the PDF
    doc.save('Marketing_Funnel_Report.pdf');
    showNotification('PDF exported successfully');
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
