// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    if (localStorage.getItem('authenticated') {
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
                name: 'TOF (Top of Funnel)',
                type: 'TOF',
                description: 'Awareness stage - attracting potential customers',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'mof-' + Date.now(),
                name: 'MOF (Middle of Funnel)',
                type: 'MOF',
                description: 'Consideration stage - nurturing leads',
                leads: [],
                contentStrategy: []
            },
            {
                id: 'bof-' + Date.now(),
                name: 'BOF (Bottom of Funnel)',
                type: 'BOF',
                description: 'Decision stage - converting leads to customers',
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
}

// Create a funnel DOM element
function createFunnelElement(funnel) {
    const funnelElement = document.createElement('div');
    funnelElement.className = 'funnel';
    funnelElement.dataset.funnelId = funnel.id;
    
    // Funnel header
    const header = document.createElement('div');
    header.className = 'funnel-header';
    
    const title = document.createElement('h3');
    title.textContent = funnel.name;
    
    const actions = document.createElement('div');
    actions.className = 'funnel-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'funnel-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit Funnel';
    editBtn.addEventListener('click', () => openEditFunnelModal(funnel));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'funnel-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete Funnel';
    deleteBtn.addEventListener('click', () => deleteFunnel(funnel.id));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(title);
    header.appendChild(actions);
    
    // Funnel body
    const body = document.createElement('div');
    body.className = 'funnel-body';
    
    const description = document.createElement('div');
    description.className = 'funnel-content';
    description.innerHTML = `<p>${funnel.description}</p>`;
    
    const contentStrategy = document.createElement('div');
    contentStrategy.className = 'funnel-content';
    contentStrategy.innerHTML = `
        <h4>Content Strategy</h4>
        ${funnel.contentStrategy.length > 0 ? 
            `<ul>${funnel.contentStrategy.map(item => `<li>${item}</li>`).join('')}</ul>` : 
            '<p>No content strategy defined</p>'}
        <button class="add-content-btn">+ Add Content Strategy</button>
    `;
    
    contentStrategy.querySelector('.add-content-btn').addEventListener('click', () => {
        openContentStrategyModal(funnel.id);
    });
    
    const leadsHeader = document.createElement('h4');
    leadsHeader.textContent = 'Leads';
    
    const leadsList = document.createElement('ul');
    leadsList.className = 'leads-list';
    
    funnel.leads.forEach(lead => {
        const leadItem = createLeadElement(lead, funnel.id);
        leadsList.appendChild(leadItem);
    });
    
    const addLeadBtn = document.createElement('button');
    addLeadBtn.className = 'add-lead-btn';
    addLeadBtn.innerHTML = '<i class="fas fa-plus"></i> Add Lead';
    addLeadBtn.addEventListener('click', () => {
        document.getElementById('lead-funnel-id').value = funnel.id;
        document.getElementById('add-lead-modal').classList.remove('hidden');
    });
    
    body.appendChild(description);
    body.appendChild(contentStrategy);
    body.appendChild(leadsHeader);
    body.appendChild(leadsList);
    body.appendChild(addLeadBtn);
    
    funnelElement.appendChild(header);
    funnelElement.appendChild(body);
    
    return funnelElement;
}

// Create a lead DOM element
function createLeadElement(lead, funnelId) {
    const leadItem = document.createElement('li');
    leadItem.className = 'lead-item';
    leadItem.draggable = true;
    leadItem.dataset.leadId = lead.id;
    leadItem.dataset.funnelId = funnelId;
    
    const company = document.createElement('div');
    company.className = 'lead-company';
    company.textContent = lead.company;
    
    const actions = document.createElement('div');
    actions.className = 'lead-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'lead-action-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditLeadModal(lead, funnelId);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'lead-action-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLead(lead.id, funnelId);
    });
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    company.appendChild(actions);
    
    const email = document.createElement('span');
    email.className = 'lead-email';
    email.textContent = lead.email || 'No email provided';
    
    const phone = document.createElement('span');
    phone.className = 'lead-phone';
    phone.textContent = lead.phone || 'No phone provided';
    
    leadItem.appendChild(company);
    leadItem.appendChild(email);
    leadItem.appendChild(phone);
    
    // Drag events
    leadItem.addEventListener('dragstart', handleDragStart);
    
    return leadItem;
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const funnelContainers = document.querySelectorAll('.funnel .leads-list');
    
    funnelContainers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        leadId: e.target.dataset.leadId,
        sourceFunnelId: e.target.dataset.funnelId
    }));
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const leadId = data.leadId;
    const sourceFunnelId = data.sourceFunnelId;
    const targetFunnelId = e.target.closest('.funnel').dataset.funnelId;
    
    if (sourceFunnelId !== targetFunnelId) {
        moveLeadToFunnel(leadId, sourceFunnelId, targetFunnelId);
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
    
    // Reload funnels
    loadFunnels();
    
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

// Edit a funnel
function openEditFunnelModal(funnel) {
    document.getElementById('funnel-name').value = funnel.name;
    document.getElementById('funnel-type').value = funnel.type;
    document.getElementById('funnel-description').value = funnel.description;
    
    const form = document.getElementById('funnel-form');
    form.dataset.funnelId = funnel.id;
    form.querySelector('button[type="submit"]').textContent = 'Update Funnel';
    
    // Change submit handler to update instead of add
    form.onsubmit = function(e) {
        e.preventDefault();
        updateFunnel();
    };
    
    document.getElementById('add-funnel-modal').classList.remove('hidden');
}

function updateFunnel() {
    const funnelId = document.getElementById('funnel-form').dataset.funnelId;
    const name = document.getElementById('funnel-name').value;
    const type = document.getElementById('funnel-type').value;
    const description = document.getElementById('funnel-description').value;
    
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    const funnelIndex = funnels.findIndex(f => f.id === funnelId);
    
    if (funnelIndex !== -1) {
        funnels[funnelIndex].name = name;
        funnels[funnelIndex].type = type;
        funnels[funnelIndex].description = description;
        
        localStorage.setItem('funnels', JSON.stringify(funnels));
        document.getElementById('add-funnel-modal').classList.add('hidden');
        loadFunnels();
        showNotification('Funnel updated successfully');
    }
}

// Delete a funnel
function deleteFunnel(funnelId) {
    if (confirm('Are you sure you want to delete this funnel? All leads in this funnel will be lost.')) {
        const funnels = JSON.parse(localStorage.getItem('funnels'));
        const updatedFunnels = funnels.filter(f => f.id !== funnelId);
        
        localStorage.setItem('funnels', JSON.stringify(updatedFunnels));
        loadFunnels();
        showNotification('Funnel deleted successfully');
    }
}

// Open content strategy modal
function openContentStrategyModal(funnelId) {
    const funnels = JSON.parse(localStorage.getItem('funnels'));
    const funnel = funnels.find(f => f.id === funnelId);
    
    if (funnel) {
        const modalContent = `
            <h2>Content Strategy for ${funnel.name}</h2>
            <div class="form-group">
                <label>Select Content Types</label>
                <select id="content-types" multiple>
                    <option value="blog">Blog Posts</option>
                    <option value="ebook">E-books</option>
                    <option value="webinar">Webinars</option>
                    <option value="casestudy">Case Studies</option>
                    <option value="demo">Product Demos</option>
                    <option value="trial">Free Trials</option>
                </select>
            </div>
            <button id="save-content-strategy" class="submit-btn">Save Strategy</button>
        `;
        
        // Create a temporary modal
        const tempModal = document.createElement('div');
        tempModal.className = 'modal';
        tempModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                ${modalContent}
            </div>
        `;
        
        document.body.appendChild(tempModal);
        tempModal.classList.remove('hidden');
        
        // Set selected values
        const select = tempModal.querySelector('#content-types');
        funnel.contentStrategy.forEach(type => {
            const option = select.querySelector(`option[value="${type}"]`);
            if (option) option.selected = true;
        });
        
        // Close modal
        tempModal.querySelector('.close-modal').addEventListener('click', () => {
            tempModal.classList.add('hidden');
            setTimeout(() => tempModal.remove(), 300);
        });
        
        // Save strategy
        tempModal.querySelector('#save-content-strategy').addEventListener('click', () => {
            const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
            funnel.contentStrategy = selectedOptions;
            localStorage.setItem('funnels', JSON.stringify(funnels));
            loadFunnels();
            tempModal.classList.add('hidden');
            setTimeout(() => tempModal.remove(), 300);
            showNotification('Content strategy updated');
        });
    }
}

// Add a new lead
function addLead() {
    const funnelId = document.getElementById('lead-funnel-id').value;
    const company = document.getElementById('lead-company').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone').value;
    const website = document.getElementById('lead-website').value;
    const notes = document.getElementById('lead-notes').value;
    
    const contentStrategySelect = document.getElementById('lead-content-strategy');
    const contentStrategy = Array.from(contentStrategySelect.selectedOptions).map(opt => opt.value);
    
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
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install button
        document.getElementById('install-btn').classList.remove('hidden');
    });
    
    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            // Optionally, send analytics event with outcome of user choice
            console.log(`User response to the install prompt: ${outcome}`);
            // Hide the install button
            document.getElementById('install-btn').classList.add('hidden');
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
        }
    });
    
    window.addEventListener('appinstalled', () => {
        // Hide the install button
        document.getElementById('install-btn').classList.add('hidden');
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
        // Optionally, send analytics event to indicate successful install
        console.log('PWA was installed');
    });
}
