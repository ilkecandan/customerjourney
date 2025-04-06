document.addEventListener('DOMContentLoaded', function () {
    // First hide the app container
    document.getElementById('app-container').classList.add('hidden');
    
    // Check authentication status
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

    // Focus on the PIN input when the page loads
    pinInput.focus();

    loginBtn.addEventListener('click', function() {
        if (pinInput.value === '1234') {
            localStorage.setItem('authenticated', 'true');
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            initializeApp();
        } else {
            pinError.textContent = 'Incorrect PIN. Please try again.';
            pinInput.value = '';
            pinInput.focus();
        }
    });

    // Also allow login on Enter key press
    pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    pinInput.addEventListener('input', function() {
        pinError.textContent = '';
    });
}

// Main application initialization
function initializeApp() {
    // Initialize default leads if none exist
    if (!localStorage.getItem('leads')) {
        const defaultLeads = {
            awareness: [
                {
                    id: 'lead-1',
                    company: 'Acme Inc',
                    contact: 'John Smith',
                    email: 'john@acme.com',
                    phone: '555-1234',
                    currentStage: 'awareness',
                    notes: 'Interested in our blog content',
                    contentStrategies: ['content-1'],
                    dateAdded: new Date().toISOString(),
                    lastContact: new Date().toISOString()
                }
            ],
            interest: [
                {
                    id: 'lead-2',
                    company: 'Globex Corp',
                    contact: 'Sarah Johnson',
                    email: 'sarah@globex.com',
                    phone: '555-5678',
                    currentStage: 'interest',
                    notes: 'Downloaded our whitepaper',
                    contentStrategies: ['content-2'],
                    dateAdded: new Date().toISOString(),
                    lastContact: new Date().toISOString()
                }
            ],
            intent: [],
            evaluation: [],
            purchase: []
        };
        localStorage.setItem('leads', JSON.stringify(defaultLeads));
    }

    // Initialize default content if none exists
    if (!localStorage.getItem('content')) {
        const defaultContent = [
            {
                id: 'content-1',
                name: 'Introductory Blog Post',
                description: 'Basic introduction to our product',
                stage: 'awareness',
                type: 'blog',
                link: 'https://example.com/blog/intro',
                targetConversion: 5
            },
            {
                id: 'content-2',
                name: 'Product Demo Video',
                description: 'Detailed product demonstration',
                stage: 'interest',
                type: 'video',
                link: 'https://example.com/demo',
                targetConversion: 15
            },
            {
                id: 'content-3',
                name: 'Case Study',
                description: 'Success story from existing customer',
                stage: 'consideration',
                type: 'casestudy',
                link: 'https://example.com/case-study',
                targetConversion: 25
            }
        ];
        localStorage.setItem('content', JSON.stringify(defaultContent));
    }

    // Initialize Select2 for content selection
    $('.content-select').select2({
        placeholder: 'Select content strategies',
        width: '100%'
    });

    // Populate content options
    populateContentOptions();

    // Load data and setup UI
    loadLeads();
    loadContent();
    setupEventListeners();
    updateAnalytics();
    setupDragAndDrop();
}

// Populate content options in select elements
function populateContentOptions() {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const selectElements = document.querySelectorAll('.content-select');
    
    selectElements.forEach(select => {
        // Clear existing options
        $(select).empty();
        
        // Add new options
        contentItems.forEach(content => {
            const option = new Option(content.name, content.id);
            $(select).append(option);
        });
    });
}

// Load leads into the funnel visualization and table
function loadLeads() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };

    // Clear existing leads in funnel
    document.querySelectorAll('.stage-body').forEach(container => {
        container.innerHTML = '';
        if (container.querySelector('.empty')) {
            container.querySelector('.empty').textContent = 'Drop leads here';
        } else {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Drop leads here';
            container.appendChild(emptyDiv);
        }
    });

    // Populate leads for each stage
    for (const [stage, stageLeads] of Object.entries(leads)) {
        const container = document.querySelector(`.stage-body[data-drop-target="${stage}"]`);
        
        if (!container) continue;

        if (stageLeads.length === 0) {
            container.classList.add('empty');
            container.querySelector('.empty').textContent = 'Drop leads here';
            continue;
        }

        container.classList.remove('empty');
        container.querySelector('.empty')?.remove();
        
        stageLeads.forEach(lead => {
            const leadCard = createLeadCard(lead);
            container.appendChild(leadCard);
        });

        // Update stage stats
        const stageElement = document.querySelector(`.funnel-stage[data-stage="${stage}"]`);
        if (stageElement) {
            const countElement = stageElement.querySelector('.lead-count');
            if (countElement) {
                countElement.textContent = stageLeads.length;
            }
        }
    }

    // Update leads table
    updateLeadsTable();

    // Update conversion percentages
    updateConversionPercentages();
}

// Create a lead card element for the funnel
function createLeadCard(lead) {
    const leadCard = document.createElement('div');
    leadCard.className = 'lead-card';
    leadCard.draggable = true;
    leadCard.dataset.leadId = lead.id;
    leadCard.dataset.currentStage = lead.currentStage;

    const company = document.createElement('div');
    company.className = 'company';
    company.textContent = lead.company;

    const contact = document.createElement('div');
    contact.className = 'contact';
    contact.textContent = lead.contact || 'No contact';

    leadCard.appendChild(company);
    leadCard.appendChild(contact);

    // Add drag events
    leadCard.addEventListener('dragstart', handleDragStart);

    // Add click event to show edit modal
    leadCard.addEventListener('click', () => openEditLeadModal(lead));

    return leadCard;
}

// Update the leads table with all leads
function updateLeadsTable() {
    const leadsData = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };
    
    const tableBody = document.getElementById('leads-table-body');
    tableBody.innerHTML = '';

    // Combine all leads from all stages
    const allLeads = [];
    for (const [stage, stageLeads] of Object.entries(leadsData)) {
        stageLeads.forEach(lead => {
            allLeads.push({...lead, stage: stage});
        });
    }

    if (allLeads.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center;">No leads found</td>';
        tableBody.appendChild(row);
        return;
    }

    // Sort by date added (newest first)
    allLeads.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    // Add each lead to the table
    allLeads.forEach(lead => {
        const row = document.createElement('tr');
        row.dataset.leadId = lead.id;
        row.dataset.stage = lead.stage;

        // Get content names
        const contentItems = JSON.parse(localStorage.getItem('content')) || [];
        const contentUsed = lead.contentStrategies?.map(contentId => {
            const content = contentItems.find(c => c.id === contentId);
            return content ? content.name : '';
        }).filter(name => name) || [];

        // Format last contact date
        const lastContactDate = lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never';

        row.innerHTML = `
            <td class="company-cell">${lead.company}</td>
            <td class="contact-cell">${lead.contact || 'N/A'}</td>
            <td>${capitalizeFirstLetter(lead.stage)}</td>
            <td>${contentUsed.join(', ') || 'None'}</td>
            <td>${lastContactDate}</td>
            <td>
                <button class="edit-btn" data-lead-id="${lead.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-lead-id="${lead.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners to the action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const leadId = btn.dataset.leadId;
            const leads = JSON.parse(localStorage.getItem('leads'));
            let foundLead = null;
            
            // Search through all stages to find the lead
            for (const stageLeads of Object.values(leads)) {
                const lead = stageLeads.find(l => l.id === leadId);
                if (lead) {
                    foundLead = lead;
                    break;
                }
            }
            
            if (foundLead) {
                openEditLeadModal(foundLead);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const leadId = btn.dataset.leadId;
            if (confirm('Are you sure you want to delete this lead?')) {
                deleteLeadById(leadId);
            }
        });
    });
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Delete lead by ID
function deleteLeadById(leadId) {
    const leads = JSON.parse(localStorage.getItem('leads'));
    let leadFound = false;

    // Search through all stages to find the lead
    for (const stage of Object.keys(leads)) {
        const leadIndex = leads[stage].findIndex(lead => lead.id === leadId);
        if (leadIndex !== -1) {
            leads[stage].splice(leadIndex, 1);
            leadFound = true;
            break;
        }
    }

    if (leadFound) {
        localStorage.setItem('leads', JSON.stringify(leads));
        loadLeads();
        updateAnalytics();
        showNotification('Lead deleted successfully');
    }
}

// Load content strategies
function loadContent() {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const container = document.getElementById('content-items-container');
    if (!container) return;

    container.innerHTML = '';

    contentItems.forEach(content => {
        const item = document.createElement('div');
        item.className = 'content-item';
        item.dataset.contentId = content.id;
        item.dataset.stage = content.stage;

        const icon = document.createElement('i');
        icon.className = getContentIcon(content.type);

        const name = document.createElement('h4');
        name.textContent = content.name;

        const desc = document.createElement('p');
        desc.className = 'content-description';
        desc.textContent = content.description;

        const stageBadge = document.createElement('span');
        stageBadge.className = 'stage-badge';
        stageBadge.textContent = capitalizeFirstLetter(content.stage);

        const actions = document.createElement('div');
        actions.className = 'content-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-content';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditContentModal(content);
        });

        actions.appendChild(editBtn);

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(desc);
        item.appendChild(stageBadge);
        item.appendChild(actions);

        container.appendChild(item);
    });
}

// Get appropriate icon for content type
function getContentIcon(type) {
    const icons = {
        blog: 'fas fa-file-alt',
        ebook: 'fas fa-book',
        video: 'fas fa-video',
        webinar: 'fas fa-chalkboard-teacher',
        casestudy: 'fas fa-chart-line',
        demo: 'fas fa-desktop',
        other: 'fas fa-file'
    };
    return icons[type] || icons.other;
}

// Setup event listeners
function setupEventListeners() {
    // Add Lead Modal
    document.getElementById('add-lead-btn').addEventListener('click', () => {
        document.getElementById('lead-form').reset();
        document.getElementById('add-lead-modal').classList.remove('hidden');
    });

    document.getElementById('lead-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addLead();
    });

    // Add Content Modal
    document.getElementById('add-content-btn').addEventListener('click', () => {
        document.getElementById('content-form').reset();
        document.getElementById('add-content-modal').classList.remove('hidden');
    });

    document.getElementById('content-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addContent();
    });

    // Edit Lead Modal
    document.getElementById('edit-lead-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveLeadChanges();
    });

    document.getElementById('delete-lead-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this lead?')) {
            deleteLead();
        }
    });

    // Close modals
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
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

    // Lead filter
    document.getElementById('lead-stage-filter').addEventListener('change', function() {
        filterLeadsTable(this.value);
    });

    // Lead search
    const leadSearch = document.getElementById('lead-search');
    if (leadSearch) {
        leadSearch.addEventListener('input', function() {
            searchLeads(this.value);
        });
    }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const containers = document.querySelectorAll('.stage-body');
    const drake = dragula(Array.from(containers), {
        moves: function(el, source, handle, sibling) {
            return el.classList.contains('lead-card');
        }
    });

    drake.on('drop', function(el, target, source, sibling) {
        const leadId = el.dataset.leadId;
        const fromStage = source.dataset.dropTarget;
        const toStage = target.dataset.dropTarget;
        
        if (fromStage !== toStage) {
            moveLead(leadId, fromStage, toStage);
        }
    });
}

// Move lead between stages
function moveLead(leadId, fromStage, toStage) {
    const leads = JSON.parse(localStorage.getItem('leads'));
    
    // Find the lead
    const leadIndex = leads[fromStage].findIndex(lead => lead.id === leadId);
    if (leadIndex === -1) return;

    const lead = leads[fromStage][leadIndex];
    
    // Remove from old stage
    leads[fromStage].splice(leadIndex, 1);
    
    // Update lead's current stage
    lead.currentStage = toStage;
    lead.lastContact = new Date().toISOString();
    
    // Add to new stage
    leads[toStage].push(lead);
    
    // Save to storage
    localStorage.setItem('leads', JSON.stringify(leads));
    
    // Update UI
    loadLeads();
    updateAnalytics();
    
    // Show notification
    showNotification(`Lead moved to ${capitalizeFirstLetter(toStage)} stage`);
}

// Drag start handler
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.leadId);
    e.target.classList.add('dragging');
}

// Add a new lead
function addLead() {
    const company = document.getElementById('lead-company').value;
    const contact = document.getElementById('lead-contact').value;
    const email = document.getElementById('lead-email').value;
    const phone = document.getElementById('lead-phone').value;
    const stage = document.getElementById('lead-stage').value;
    const source = document.getElementById('lead-source').value;
    const notes = document.getElementById('lead-notes').value;

    // Get selected content strategies
    const contentSelect = document.getElementById('lead-content');
    const contentStrategies = $(contentSelect).val() || [];

    if (!company || !contact || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const newLead = {
        id: 'lead-' + Date.now(),
        company,
        contact,
        email,
        phone,
        source,
        currentStage: stage,
        notes,
        contentStrategies,
        dateAdded: new Date().toISOString(),
        lastContact: new Date().toISOString()
    };

    // Add to storage
    const leads = JSON.parse(localStorage.getItem('leads'));
    leads[stage].push(newLead);
    localStorage.setItem('leads', JSON.stringify(leads));

    // Close modal and reset form
    document.getElementById('add-lead-modal').classList.add('hidden');
    document.getElementById('lead-form').reset();

    // Update UI
    loadLeads();
    updateAnalytics();
    showNotification('Lead added successfully');
}

// Add new content strategy
function addContent() {
    const name = document.getElementById('content-name').value;
    const description = document.getElementById('content-description').value;
    const stage = document.getElementById('content-stage').value;
    const type = document.getElementById('content-type').value;
    const link = document.getElementById('content-link').value;
    const targetConversion = document.getElementById('content-target-conversion').value || 0;

    if (!name || !stage) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const newContent = {
        id: 'content-' + Date.now(),
        name,
        description,
        stage,
        type,
        link,
        targetConversion: parseInt(targetConversion),
        dateCreated: new Date().toISOString()
    };

    // Add to storage
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    contentItems.push(newContent);
    localStorage.setItem('content', JSON.stringify(contentItems));

    // Close modal and reset form
    document.getElementById('add-content-modal').classList.add('hidden');
    document.getElementById('content-form').reset();

    // Update UI
    loadContent();
    populateContentOptions(); // Refresh content options in selects
    showNotification('Content strategy added successfully');
}

// Open edit lead modal
function openEditLeadModal(lead) {
    document.getElementById('edit-lead-id').value = lead.id;
    document.getElementById('edit-lead-company').value = lead.company;
    document.getElementById('edit-lead-contact').value = lead.contact || '';
    document.getElementById('edit-lead-email').value = lead.email || '';
    document.getElementById('edit-lead-phone').value = lead.phone || '';
    document.getElementById('edit-lead-stage').value = lead.currentStage;
    document.getElementById('edit-lead-source').value = lead.source || 'website';
    document.getElementById('edit-lead-notes').value = lead.notes || '';

    // Set content strategies
    const contentSelect = document.getElementById('edit-lead-content');
    $(contentSelect).val(lead.contentStrategies || []).trigger('change');

    document.getElementById('edit-lead-modal').classList.remove('hidden');
}

// Save lead changes
function saveLeadChanges() {
    const leadId = document.getElementById('edit-lead-id').value;
    const company = document.getElementById('edit-lead-company').value;
    const contact = document.getElementById('edit-lead-contact').value;
    const email = document.getElementById('edit-lead-email').value;
    const phone = document.getElementById('edit-lead-phone').value;
    const stage = document.getElementById('edit-lead-stage').value;
    const source = document.getElementById('edit-lead-source').value;
    const notes = document.getElementById('edit-lead-notes').value;

    // Get selected content strategies
    const contentSelect = document.getElementById('edit-lead-content');
    const contentStrategies = $(contentSelect).val() || [];

    if (!company || !contact || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Update lead in storage
    const leads = JSON.parse(localStorage.getItem('leads'));
    let leadFound = false;

    // Search through all stages to find the lead
    for (const [stageKey, stageLeads] of Object.entries(leads)) {
        const leadIndex = stageLeads.findIndex(lead => lead.id === leadId);
        
        if (leadIndex !== -1) {
            // If stage changed, move the lead
            if (stageKey !== stage) {
                const lead = stageLeads[leadIndex];
                stageLeads.splice(leadIndex, 1);
                
                // Update lead properties
                lead.company = company;
                lead.contact = contact;
                lead.email = email;
                lead.phone = phone;
                lead.source = source;
                lead.currentStage = stage;
                lead.notes = notes;
                lead.contentStrategies = contentStrategies;
                lead.lastContact = new Date().toISOString();
                
                // Add to new stage
                leads[stage].push(lead);
            } else {
                // Just update the lead
                const lead = stageLeads[leadIndex];
                lead.company = company;
                lead.contact = contact;
                lead.email = email;
                lead.phone = phone;
                lead.source = source;
                lead.notes = notes;
                lead.contentStrategies = contentStrategies;
                lead.lastContact = new Date().toISOString();
            }
            
            leadFound = true;
            break;
        }
    }

    if (leadFound) {
        localStorage.setItem('leads', JSON.stringify(leads));
        document.getElementById('edit-lead-modal').classList.add('hidden');
        loadLeads();
        updateAnalytics();
        showNotification('Lead updated successfully');
    }
}

// Delete lead from edit modal
function deleteLead() {
    const leadId = document.getElementById('edit-lead-id').value;
    deleteLeadById(leadId);
    document.getElementById('edit-lead-modal').classList.add('hidden');
}

// Open edit content modal
function openEditContentModal(content) {
    // You would implement this similarly to openEditLeadModal
    // For now, we'll just show a notification
    showNotification('Edit content functionality would be implemented here');
}

// Update conversion percentages between stages
function updateConversionPercentages() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };

    // Awareness → Interest
    const awarenessCount = leads.awareness.length;
    const interestCount = leads.interest.length;
    const awarenessInterestRate = awarenessCount > 0 ? Math.round((interestCount / awarenessCount) * 100) : 0;
    document.getElementById('awareness-interest-rate').textContent = `${awarenessInterestRate}%`;
    const awarenessConvElement = document.getElementById('awareness-conversion-rate');
    if (awarenessConvElement) awarenessConvElement.textContent = `${awarenessInterestRate}%`;

    // Interest → Consideration (average of intent, evaluation, purchase)
    const considerationCount = leads.intent.length + leads.evaluation.length + leads.purchase.length;
    const interestConsiderationRate = interestCount > 0 ? Math.round((considerationCount / interestCount) * 100) : 0;
    document.getElementById('interest-consideration-rate').textContent = `${interestConsiderationRate}%`;
    const interestConvElement = document.getElementById('interest-conversion-rate');
    if (interestConvElement) interestConvElement.textContent = `${interestConsiderationRate}%`;

    // Overall conversion rate (awareness → purchase)
    const purchaseCount = leads.purchase.length;
    const overallConversionRate = awarenessCount > 0 ? Math.round((purchaseCount / awarenessCount) * 100) : 0;
    document.getElementById('conversion-rate').textContent = `${overallConversionRate}%`;
}

// Update analytics charts and metrics
function updateAnalytics() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };

    // Update total leads count
    const totalLeads = Object.values(leads).reduce((sum, stageLeads) => sum + stageLeads.length, 0);
    document.getElementById('total-leads').textContent = totalLeads;

    // Update conversion percentages
    updateConversionPercentages();
}

// Filter leads table by stage
function filterLeadsTable(stage) {
    const rows = document.querySelectorAll('#leads-table-body tr');
    
    rows.forEach(row => {
        if (row.dataset.leadId === undefined) return; // Skip the "no leads" row
        
        const rowStage = row.dataset.stage;
        if (stage === 'all' || rowStage === stage) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search leads
function searchLeads(query) {
    const rows = document.querySelectorAll('#leads-table-body tr');
    const normalizedQuery = query.toLowerCase();
    
    rows.forEach(row => {
        if (row.dataset.leadId === undefined) {
            // Show the "no leads" row only if there's no search query
            row.style.display = query ? 'none' : '';
            return;
        }
        
        const company = row.querySelector('.company-cell').textContent.toLowerCase();
        const contact = row.querySelector('.contact-cell').textContent.toLowerCase();
        
        if (company.includes(normalizedQuery) || contact.includes(normalizedQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
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
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };
    
    let yPosition = 50;
    
    // Add funnel visualization summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('Funnel Summary', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Awareness: ${leads.awareness.length} leads`, 14, yPosition);
    yPosition += 7;
    doc.text(`Interest: ${leads.interest.length} leads`, 14, yPosition);
    yPosition += 7;
    doc.text(`Consideration: ${leads.intent.length + leads.evaluation.length + leads.purchase.length} leads`, 14, yPosition);
    yPosition += 7;
    doc.text(`Purchases: ${leads.purchase.length} leads`, 14, yPosition);
    yPosition += 15;
    
    // Add conversion rates
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('Conversion Rates', 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Awareness → Interest: ${document.getElementById('awareness-interest-rate').textContent}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Interest → Consideration: ${document.getElementById('interest-consideration-rate').textContent}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Overall Conversion: ${document.getElementById('conversion-rate').textContent}`, 14, yPosition);
    yPosition += 15;
    
    // Add content strategy summary
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    if (contentItems.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 255);
        doc.text('Content Strategy', 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        contentItems.forEach(content => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`${content.name} (${content.type}) - ${content.stage} stage`, 14, yPosition);
            yPosition += 7;
            doc.text(`Target conversion: ${content.targetConversion}%`, 20, yPosition);
            yPosition += 7;
        });
    }
    
    // Save the PDF
    doc.save('Marketing_Funnel_Report.pdf');
    showNotification('PDF exported successfully');
}

// Show notification
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.style.backgroundColor = '#ff4444';
    } else {
        toast.style.backgroundColor = '#4CAF50';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
