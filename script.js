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
    
    // Configurable PINs
    const validPins = ['1234', '4321', '0000'];

    // Focus on the PIN input when the page loads
    pinInput.focus();

    loginBtn.addEventListener('click', function() {
        if (validPins.includes(pinInput.value)) {
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
    console.log('Initializing app...');
    
    // Initialize metadata if none exists
    if (!localStorage.getItem('funnel_metadata')) {
        localStorage.setItem('funnel_metadata', JSON.stringify({
            created: new Date().toISOString(),
            version: '1.1',
            last_updated: new Date().toISOString()
        }));
    }
    
    // Initialize default leads if none exist
    if (!localStorage.getItem('leads')) {
        const defaultLeads = {
            awareness: [
                {
                    id: 'lead-' + Date.now(),
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
                    id: 'lead-' + Date.now(),
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
    setupInstallButton();
    
    // Show onboarding tooltips for first-time users
    if (!localStorage.getItem('onboarding_shown')) {
        setTimeout(showOnboardingTips, 1000);
        localStorage.setItem('onboarding_shown', 'true');
    }
}

// Show onboarding tooltips
function showOnboardingTips() {
    const funnelTip = document.createElement('div');
    funnelTip.className = 'onboarding-tooltip';
    funnelTip.innerHTML = 'Drag leads between stages to track their progress through your marketing funnel';
    funnelTip.style.top = '200px';
    funnelTip.style.left = '50%';
    funnelTip.style.transform = 'translateX(-50%)';
    document.querySelector('.funnel-container').appendChild(funnelTip);
    
    const contentTip = document.createElement('div');
    contentTip.className = 'onboarding-tooltip';
    contentTip.innerHTML = 'Add content strategies to each stage to help move leads forward in the funnel';
    contentTip.style.top = '400px';
    contentTip.style.left = '50%';
    contentTip.style.transform = 'translateX(-50%)';
    document.querySelector('.funnel-container').appendChild(contentTip);
    
    setTimeout(() => {
        funnelTip.remove();
        contentTip.remove();
    }, 8000);
}

// Setup PWA install button
function setupInstallButton() {
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install button
        installBtn.classList.remove('hidden');
    });
    
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        // Optionally, send analytics event with outcome of user choice
        console.log(`User response to the install prompt: ${outcome}`);
        // Hide the install button
        installBtn.classList.add('hidden');
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
    });
    
    window.addEventListener('appinstalled', () => {
        // Hide the install button
        installBtn.classList.add('hidden');
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
        // Optionally, send analytics event to indicate successful install
        console.log('PWA was installed');
    });
}

// Load leads with content badges
function loadLeads() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
    };
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];

    document.querySelectorAll('.stage-body').forEach(container => {
        container.innerHTML = '';
        const stage = container.dataset.dropTarget;
        
        // Add content badges for this stage
        const stageContent = contentItems.filter(c => c.stage === stage);
        if (stageContent.length > 0) {
            const contentBadges = document.createElement('div');
            contentBadges.className = 'content-badges';
            
            stageContent.forEach(content => {
                const badge = document.createElement('div');
                badge.className = 'content-badge';
                badge.dataset.contentId = content.id;
                badge.draggable = true;
                badge.title = `${content.name}\n${content.description}`;
                
                badge.innerHTML = `
                    <i class="${getContentIcon(content.type)}"></i>
                    <span>${content.name.substring(0, 3)}</span>
                `;
                
                badge.addEventListener('dragstart', handleContentDragStart);
                badge.addEventListener('click', () => openEditContentModal(content));
                
                contentBadges.appendChild(badge);
            });
            
            container.appendChild(contentBadges);
        }

        // Add leads
        if (leads[stage] && leads[stage].length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.textContent = 'Drop leads here';
            container.appendChild(emptyDiv);
        } else if (leads[stage]) {
            leads[stage].forEach(lead => {
                container.appendChild(createLeadCard(lead));
            });
        }
    });

    updateLeadsTable();
    updateConversionPercentages();
}

// Handle content drag start
function handleContentDragStart(e) {
    e.dataTransfer.setData('text/content-id', e.target.dataset.contentId);
    e.target.classList.add('dragging-content');
}

// Load content in the content section
function loadContent() {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const container = document.getElementById('content-items-container');
    if (!container) return;

    container.innerHTML = '';

    if (contentItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <h3>No Content Strategies</h3>
            <p>Add content to help move leads through your funnel</p>
            <button id="add-content-empty-btn" class="action-btn" style="margin-top: 1rem;">
                <i class="fas fa-plus"></i> Add Content
            </button>
        `;
        container.appendChild(emptyState);
        
        document.getElementById('add-content-empty-btn').addEventListener('click', () => {
            document.getElementById('content-form').reset();
            document.getElementById('add-content-modal').classList.remove('hidden');
        });
        return;
    }

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

        const link = document.createElement('a');
        link.href = content.link || '#';
        link.target = '_blank';
        link.className = 'content-link';
        link.innerHTML = '<i class="fas fa-external-link-alt"></i> View';

        const actions = document.createElement('div');
        actions.className = 'content-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-content';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditContentModal(content);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-content';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this content strategy?')) {
                deleteContent(content.id);
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(desc);
        item.appendChild(stageBadge);
        item.appendChild(link);
        item.appendChild(actions);

        container.appendChild(item);
    });
}

// Delete content by ID
function deleteContent(contentId) {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const updatedContent = contentItems.filter(c => c.id !== contentId);
    localStorage.setItem('content', JSON.stringify(updatedContent));
    
    // Also remove from any leads that might reference this content
    const leads = JSON.parse(localStorage.getItem('leads'));
    for (const stage in leads) {
        leads[stage].forEach(lead => {
            if (lead.contentStrategies && lead.contentStrategies.includes(contentId)) {
                lead.contentStrategies = lead.contentStrategies.filter(id => id !== contentId);
            }
        });
    }
    localStorage.setItem('leads', JSON.stringify(leads));
    
    loadLeads();
    loadContent();
    populateContentOptions();
    showNotification('Content deleted successfully');
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
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
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

function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Use event delegation for buttons
    document.addEventListener('click', function(e) {
        // Add Lead Button
        if (e.target.matches('#add-lead-btn, #add-lead-btn *')) {
            document.getElementById('lead-form').reset();
            const modal = document.getElementById('add-lead-modal');
            modal.classList.remove('hidden');
            modal.classList.add('show');
            return;
        }
        
        // Add Content Button
        if (e.target.matches('#add-content-btn, #add-content-btn *')) {
            document.getElementById('content-form').reset();
            const modal = document.getElementById('add-content-modal');
            modal.classList.remove('hidden');
            modal.classList.add('show');
            return;
        }
        
        // Close buttons
        if (e.target.matches('.close-modal, .close-modal *, .cancel-btn, .cancel-btn *')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
            return;
        }
    });

    // Form submissions
    document.getElementById('lead-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addLead();
    });

    document.getElementById('content-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addContent();
    });

    document.getElementById('edit-lead-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveLeadChanges();
    });

    document.getElementById('edit-content-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        saveContentChanges();
    });

    document.getElementById('delete-lead-btn')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this lead?')) {
            deleteLead();
        }
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
    document.getElementById('export-pdf')?.addEventListener('click', exportToPDF);
    
    // Export Excel
    document.getElementById('export-excel')?.addEventListener('click', exportToExcel);

    // Lead filter
    document.getElementById('lead-stage-filter')?.addEventListener('change', function() {
        filterLeadsTable(this.value);
    });

    // Lead search with debounce
    const leadSearch = document.getElementById('lead-search');
    if (leadSearch) {
        leadSearch.addEventListener('input', function() {
            clearTimeout(searchLeads.debounce);
            searchLeads.debounce = setTimeout(() => {
                searchLeads(this.value);
            }, 300);
        });
    }
}

// Export to Excel
function exportToExcel() {
    const leadsData = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
    };
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    
    // Combine all leads from all stages
    const allLeads = [];
    for (const [stage, stageLeads] of Object.entries(leadsData)) {
        stageLeads.forEach(lead => {
            // Get content names for this lead
            const contentUsed = lead.contentStrategies?.map(contentId => {
                const content = contentItems.find(c => c.id === contentId);
                return content ? content.name : '';
            }).filter(name => name) || [];
            
            allLeads.push({
                'Company': lead.company,
                'Contact': lead.contact || '',
                'Email': lead.email || '',
                'Phone': lead.phone || '',
                'Stage': capitalizeFirstLetter(stage),
                'Source': capitalizeFirstLetter(lead.source || ''),
                'Content Used': contentUsed.join(', '),
                'Notes': lead.notes || '',
                'Date Added': new Date(lead.dateAdded).toLocaleDateString(),
                'Last Contact': lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : ''
            });
        });
    }
    
    if (allLeads.length === 0) {
        showNotification('No leads to export', 'error');
        return;
    }
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(allLeads);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    
    // Export to Excel file
    XLSX.writeFile(wb, 'Marketing_Funnel_Leads.xlsx');
    showNotification('Excel file exported successfully');
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    setTimeout(() => {
        const containers = Array.from(document.querySelectorAll('.stage-body'));
        
        if (containers.length > 0) {
            const drake = dragula(containers, {
                moves: function(el, source, handle, sibling) {
                    return el.classList.contains('lead-card') || el.classList.contains('content-badge');
                }
            });

            drake.on('drop', function(el, target, source, sibling) {
                const fromStage = source.dataset.dropTarget;
                const toStage = target.dataset.dropTarget;
                
                if (el.classList.contains('lead-card')) {
                    // Handle lead movement
                    const leadId = el.dataset.leadId;
                    if (fromStage && toStage && fromStage !== toStage) {
                        moveLead(leadId, fromStage, toStage);
                    }
                } else if (el.classList.contains('content-badge')) {
                    // Handle content movement between stages
                    const contentId = el.dataset.contentId;
                    if (fromStage && toStage && fromStage !== toStage) {
                        moveContentToStage(contentId, toStage);
                    }
                }
            });
        }
    }, 100);
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

// Move content to different stage
function moveContentToStage(contentId, newStage) {
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const contentIndex = contentItems.findIndex(c => c.id === contentId);
    
    if (contentIndex !== -1) {
        contentItems[contentIndex].stage = newStage;
        localStorage.setItem('content', JSON.stringify(contentItems));
        loadLeads();
        loadContent();
        showNotification(`Content moved to ${capitalizeFirstLetter(newStage)} stage`);
    }
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
    loadLeads();
    loadContent();
    populateContentOptions();
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

// Save content changes
function saveContentChanges() {
    const contentId = document.getElementById('edit-content-id').value;
    const name = document.getElementById('edit-content-name').value;
    const description = document.getElementById('edit-content-description').value;
    const stage = document.getElementById('edit-content-stage').value;
    const type = document.getElementById('edit-content-type').value;
    const link = document.getElementById('edit-content-link').value;
    const targetConversion = document.getElementById('edit-content-target-conversion').value;

    if (!name || !stage) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Update content in storage
    const contentItems = JSON.parse(localStorage.getItem('content')) || [];
    const contentIndex = contentItems.findIndex(c => c.id === contentId);
    
    if (contentIndex !== -1) {
        contentItems[contentIndex] = {
            ...contentItems[contentIndex],
            name,
            description,
            stage,
            type,
            link,
            targetConversion: parseInt(targetConversion)
        };
        
        localStorage.setItem('content', JSON.stringify(contentItems));
        document.getElementById('edit-content-modal').classList.add('hidden');
        loadLeads();
        loadContent();
        populateContentOptions();
        showNotification('Content updated successfully');
    }
}

// Delete lead from edit modal
function deleteLead() {
    const leadId = document.getElementById('edit-lead-id').value;
    deleteLeadById(leadId);
    document.getElementById('edit-lead-modal').classList.add('hidden');
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

// Update conversion percentages between stages
function updateConversionPercentages() {
    const leads = JSON.parse(localStorage.getItem('leads')) || {
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
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
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
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
        awareness: [], interest: [], intent: [], evaluation: [], purchase: []
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
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'block';

    installBtn.addEventListener('click', async () => {
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
    });
});
