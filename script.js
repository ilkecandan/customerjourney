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
    // Initialize default leads if none exist
    if (!localStorage.getItem('leads')) {
        const defaultLeads = {
            awareness: [],
            interest: [],
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

    // Load data and setup UI
    loadLeads();
    loadContent();
    setupEventListeners();
    updateAnalytics();
    setupPWA();
}

// Load leads into the funnel visualization
function loadLeads() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };

    // Clear existing leads
    document.querySelectorAll('.stage-leads').forEach(container => {
        container.innerHTML = '';
    });

    // Populate leads for each stage
    for (const [stage, stageLeads] of Object.entries(leads)) {
        const container = document.querySelector(`.stage-leads[data-drop-target="${stage}"]`);
        
        if (!container) continue;

        if (stageLeads.length === 0) {
            container.classList.add('empty');
            container.textContent = 'No leads in this stage';
            continue;
        }

        container.classList.remove('empty');
        
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

    // Update conversion percentages
    updateConversionPercentages();
}

// Create a lead card element
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

    // Add click event to show details
    leadCard.addEventListener('click', () => showLeadDetails(lead));

    return leadCard;
}

// Load content strategies
function loadContent() {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const container = document.getElementById('content-items-container');
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
        stageBadge.textContent = content.stage.charAt(0).toUpperCase() + content.stage.slice(1);

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
        deleteLead();
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

    // Content filter
    document.getElementById('content-stage-filter').addEventListener('change', function() {
        filterContent(this.value);
    });

    // Lead filter
    document.getElementById('lead-stage-filter').addEventListener('change', function() {
        filterLeadsTable(this.value);
    });

    // Lead search
    document.getElementById('lead-search').addEventListener('input', function() {
        searchLeads(this.value);
    });

    // Initialize drag and drop
    setupDragAndDrop();
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const containers = document.querySelectorAll('.stage-leads');
    const drake = dragula(Array.from(containers), {
        moves: function(el, source, handle, sibling) {
            return handle.classList.contains('lead-card');
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
    
    // Add to new stage
    leads[toStage].push(lead);
    
    // Save to storage
    localStorage.setItem('leads', JSON.stringify(leads));
    
    // Update UI
    loadLeads();
    updateAnalytics();
    
    // Show notification
    showNotification(`Lead moved to ${toStage.charAt(0).toUpperCase() + toStage.slice(1)} stage`);
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
    const notes = document.getElementById('lead-notes').value;

    // Get selected content strategies
    const contentSelect = document.getElementById('lead-content');
    const contentStrategies = Array.from(contentSelect.selectedOptions).map(opt => opt.value);

    const newLead = {
        id: 'lead-' + Date.now(),
        company,
        contact,
        email,
        phone,
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
    showNotification('Content strategy added successfully');
}

// Show lead details
function showLeadDetails(lead) {
    document.getElementById('detail-company').textContent = lead.company;
    document.getElementById('detail-contact').textContent = lead.contact || 'Not specified';
    document.getElementById('detail-email').textContent = lead.email || 'Not specified';
    document.getElementById('detail-phone').textContent = lead.phone || 'Not specified';
    document.getElementById('detail-stage').textContent = lead.currentStage.charAt(0).toUpperCase() + lead.currentStage.slice(1);
    document.getElementById('detail-source').textContent = lead.source || 'Unknown';
    document.getElementById('detail-date').textContent = new Date(lead.dateAdded).toLocaleDateString();
    document.getElementById('detail-last-contact').textContent = lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never';
    document.getElementById('detail-notes').textContent = lead.notes || 'No notes available';

    // Populate content used
    const contentList = document.getElementById('detail-content-list');
    contentList.innerHTML = '';
    
    if (lead.contentStrategies && lead.contentStrategies.length > 0) {
        const contentItems = JSON.parse(localStorage.getItem('content')) || [];
        lead.contentStrategies.forEach(contentId => {
            const content = contentItems.find(c => c.id === contentId);
            if (content) {
                const li = document.createElement('li');
                li.textContent = `${content.name} (${content.type})`;
                contentList.appendChild(li);
            }
        });
    } else {
        contentList.innerHTML = '<li>No content used yet</li>';
    }

    // Populate timeline
    const timeline = document.getElementById('detail-timeline');
    timeline.innerHTML = '';

    // Add stage changes to timeline
    const stages = ['awareness', 'interest', 'intent', 'evaluation', 'purchase'];
    const currentStageIndex = stages.indexOf(lead.currentStage);
    
    for (let i = 0; i <= currentStageIndex; i++) {
        const stage = stages[i];
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const dot = document.createElement('div');
        dot.className = 'timeline-dot';
        
        const content = document.createElement('div');
        content.className = 'timeline-content';
        content.innerHTML = `<strong>${stage.charAt(0).toUpperCase() + stage.slice(1)}</strong><br>
                            <small>${i === 0 ? 'Added' : 'Moved'} on ${new Date(lead.dateAdded).toLocaleDateString()}</small>`;
        
        item.appendChild(dot);
        item.appendChild(content);
        timeline.appendChild(item);
    }

    // Show modal
    document.getElementById('lead-details-modal').classList.remove('hidden');
}

// Open edit lead modal
function openEditLeadModal(lead) {
    document.getElementById('edit-lead-id').value = lead.id;
    document.getElementById('edit-lead-company').value = lead.company;
    document.getElementById('edit-lead-contact').value = lead.contact || '';
    document.getElementById('edit-lead-email').value = lead.email || '';
    document.getElementById('edit-lead-phone').value = lead.phone || '';
    document.getElementById('edit-lead-stage').value = lead.currentStage;
    document.getElementById('edit-lead-notes').value = lead.notes || '';

    // Set content strategies
    const contentSelect = document.getElementById('edit-lead-content');
    Array.from(contentSelect.options).forEach(option => {
        option.selected = lead.contentStrategies && lead.contentStrategies.includes(option.value);
    });

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
    const notes = document.getElementById('edit-lead-notes').value;

    // Get selected content strategies
    const contentSelect = document.getElementById('edit-lead-content');
    const contentStrategies = Array.from(contentSelect.selectedOptions).map(opt => opt.value);

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

// Delete lead
function deleteLead() {
    if (confirm('Are you sure you want to delete this lead?')) {
        const leadId = document.getElementById('edit-lead-id').value;
        const leads = JSON.parse(localStorage.getItem('leads'));
        let leadFound = false;

        // Search through all stages to find the lead
        for (const stageLeads of Object.values(leads)) {
            const leadIndex = stageLeads.findIndex(lead => lead.id === leadId);
            
            if (leadIndex !== -1) {
                stageLeads.splice(leadIndex, 1);
                leadFound = true;
                break;
            }
        }

        if (leadFound) {
            localStorage.setItem('leads', JSON.stringify(leads));
            document.getElementById('edit-lead-modal').classList.add('hidden');
            loadLeads();
            updateAnalytics();
            showNotification('Lead deleted successfully');
        }
    }
}

// Open edit content modal
function openEditContentModal(content) {
    document.getElementById('edit-content-id').value = content.id;
    document.getElementById('edit-content-name').value = content.name;
    document.getElementById('edit-content-description').value = content.description;
    document.getElementById('edit-content-stage').value = content.stage;
    document.getElementById('edit-content-type').value = content.type;
    document.getElementById('edit-content-link').value = content.link;
    document.getElementById('edit-content-target-conversion').value = content.targetConversion;

    document.getElementById('edit-content-modal').classList.remove('hidden');
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

    // Interest → Consideration (average of intent, evaluation, purchase)
    const considerationCount = leads.intent.length + leads.evaluation.length + leads.purchase.length;
    const interestConsiderationRate = interestCount > 0 ? Math.round((considerationCount / interestCount) * 100) : 0;
    document.getElementById('interest-consideration-rate').textContent = `${interestConsiderationRate}%`;

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

    // Update conversion chart
    updateConversionChart(leads);

    // Update content performance metrics
    updateContentMetrics();
}

// Update conversion chart
function updateConversionChart(leads) {
    const ctx = document.getElementById('conversion-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.conversionChart) {
        window.conversionChart.destroy();
    }
    
    const stageData = [
        leads.awareness.length,
        leads.interest.length,
        leads.intent.length,
        leads.evaluation.length,
        leads.purchase.length
    ];
    
    window.conversionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Awareness', 'Interest', 'Intent', 'Evaluation', 'Purchase'],
            datasets: [{
                label: 'Number of Leads',
                data: stageData,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)'
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
                            const index = context.dataIndex;
                            
                            if (index === 0) {
                                const nextValue = stageData[1] || 0;
                                return `Conversion to Interest: ${Math.round((nextValue / value) * 100)}%`;
                            } else if (index === 1) {
                                const nextValue = stageData[2] + stageData[3] + stageData[4];
                                return `Conversion to Consideration: ${Math.round((nextValue / value) * 100)}%`;
                            } else if (index === 4) {
                                const firstValue = stageData[0] || 1;
                                return `Overall Conversion: ${Math.round((value / firstValue) * 100)}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Update content performance metrics
function updateContentMetrics() {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [],
        interest: [],
        intent: [],
        evaluation: [],
        purchase: []
    };

    // Calculate most used content
    const contentUsage = {};
    contentItems.forEach(content => {
        contentUsage[content.id] = 0;
    });

    // Count usage across all leads
    Object.values(leads).forEach(stageLeads => {
        stageLeads.forEach(lead => {
            if (lead.contentStrategies) {
                lead.contentStrategies.forEach(contentId => {
                    if (contentUsage[contentId] !== undefined) {
                        contentUsage[contentId]++;
                    }
                });
            }
        });
    });

    // Find most used content
    let mostUsedContent = '-';
    let maxUsage = 0;
    for (const [contentId, usage] of Object.entries(contentUsage)) {
        if (usage > maxUsage) {
            const content = contentItems.find(c => c.id === contentId);
            if (content) {
                mostUsedContent = content.name;
                maxUsage = usage;
            }
        }
    }
    document.getElementById('most-used-content').textContent = mostUsedContent;

    // Update content chart
    updateContentChart(contentItems, contentUsage);
}

// Update content chart
function updateContentChart(contentItems, contentUsage) {
    const ctx = document.getElementById('content-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.contentChart) {
        window.contentChart.destroy();
    }
    
    // Prepare data
    const labels = contentItems.map(content => content.name);
    const data = contentItems.map(content => contentUsage[content.id] || 0);
    const backgroundColors = contentItems.map(content => {
        const colors = {
            blog: 'rgba(54, 162, 235, 0.7)',
            ebook: 'rgba(255, 99, 132, 0.7)',
            video: 'rgba(255, 206, 86, 0.7)',
            webinar: 'rgba(75, 192, 192, 0.7)',
            casestudy: 'rgba(153, 102, 255, 0.7)',
            demo: 'rgba(255, 159, 64, 0.7)',
            other: 'rgba(199, 199, 199, 0.7)'
        };
        return colors[content.type] || colors.other;
    });
    
    window.contentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Filter content by stage
function filterContent(stage) {
    const contentItems = document.querySelectorAll('.content-item');
    
    contentItems.forEach(item => {
        if (stage === 'all' || item.dataset.stage === stage) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter leads table by stage
function filterLeadsTable(stage) {
    const rows = document.querySelectorAll('#leads-table-body tr');
    
    rows.forEach(row => {
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
