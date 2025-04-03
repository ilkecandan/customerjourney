// Lead Management System
document.addEventListener('DOMContentLoaded', function() {
  // Initialize with some example leads if none exist
  if (!localStorage.getItem('funnelLeads')) {
    const exampleLeads = [
      { id: 1, name: "Acme Corp", tag: "hot", notes: "Interested in premium plan", stage: "tof" },
      { id: 2, name: "XYZ Ltd", tag: "", notes: "Requested demo", stage: "mof" },
      { id: 3, name: "Global Inc", tag: "vip", notes: "Existing customer - renewal", stage: "bof" }
    ];
    localStorage.setItem('funnelLeads', JSON.stringify(exampleLeads));
  }
  
  loadLeads();
  setupDragAndDrop();
});

// Load leads from localStorage
function loadLeads() {
  const leads = JSON.parse(localStorage.getItem('funnelLeads')) || [];
  const stages = ['tof', 'mof', 'bof'];
  
  // Clear all containers first
  stages.forEach(stage => {
    document.querySelector(`.leads-container[data-stage="${stage}"]`).innerHTML = '';
  });
  
  // Add leads to their stages
  leads.forEach(lead => {
    addLeadToStage(lead, false);
  });
  
  // Update counts
  updateStageCounts();
}

// Add lead to stage (without saving)
function addLeadToStage(lead, saveToStorage = true) {
  const container = document.querySelector(`.leads-container[data-stage="${lead.stage}"]`);
  
  const leadCard = document.createElement('div');
  leadCard.className = 'lead-card';
  leadCard.draggable = true;
  leadCard.dataset.leadId = lead.id;
  
  let tagClass = '';
  let tagDisplay = '';
  if (lead.tag === 'hot') {
    tagClass = 'tag-hot';
    tagDisplay = '🔥 Hot lead';
  } else if (lead.tag === 'cold') {
    tagClass = 'tag-cold';
    tagDisplay = '❄️ Cold lead';
  } else if (lead.tag === 'repeat') {
    tagClass = 'tag-repeat';
    tagDisplay = '🔄 Repeat customer';
  } else if (lead.tag === 'vip') {
    tagClass = 'tag-vip';
    tagDisplay = '⭐ VIP';
  }
  
  leadCard.innerHTML = `
    <div class="lead-name">${lead.name}</div>
    ${lead.tag ? `<span class="lead-tag ${tagClass}">${tagDisplay}</span>` : ''}
    <div class="lead-notes" title="${lead.notes}">${lead.notes || 'No notes'}</div>
  `;
  
  // Add click event to edit notes
  leadCard.addEventListener('click', function(e) {
    if (!e.target.classList.contains('lead-tag')) { // Don't open if clicking tag
      openNotesModal(lead);
    }
  });
  
  container.appendChild(leadCard);
  
  if (saveToStorage) {
    saveLeads();
  }
}

// Save all leads to localStorage
function saveLeads() {
  const leads = [];
  document.querySelectorAll('.lead-card').forEach(card => {
    const leadId = parseInt(card.dataset.leadId);
    const stage = card.closest('.leads-container').dataset.stage;
    
    // Find this lead in existing data to preserve other properties
    const existingLeads = JSON.parse(localStorage.getItem('funnelLeads')) || [];
    const existingLead = existingLeads.find(l => l.id === leadId) || {};
    
    leads.push({
      ...existingLead,
      id: leadId,
      stage: stage
    });
  });
  
  localStorage.setItem('funnelLeads', JSON.stringify(leads));
  updateStageCounts();
}

// Update the count badges on each stage
function updateStageCounts() {
  document.querySelectorAll('.leads-container').forEach(container => {
    const count = container.querySelectorAll('.lead-card').length;
    container.closest('.funnel-stage').querySelector('.stage-count').textContent = count;
  });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const containers = document.querySelectorAll('.leads-container');
  
  containers.forEach(container => {
    container.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
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
      saveLeads();
    });
  });
}

// Helper function for drag positioning
function getDragAfterElement(container, y) {
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

// Add new lead
function addLead(stage) {
  document.getElementById('currentStage').value = stage;
  document.getElementById('leadName').value = '';
  document.getElementById('leadTag').value = '';
  document.getElementById('leadNotes').value = '';
  document.getElementById('leadModal').style.display = 'block';
}

// Save new lead
function saveLead() {
  const name = document.getElementById('leadName').value.trim();
  const tag = document.getElementById('leadTag').value;
  const notes = document.getElementById('leadNotes').value.trim();
  const stage = document.getElementById('currentStage').value;
  
  if (!name) {
    alert('Please enter a name for the lead');
    return;
  }
  
  // Generate ID (in a real app, you'd want a better ID system)
  const id = new Date().getTime();
  
  const lead = {
    id,
    name,
    tag,
    notes,
    stage
  };
  
  // Add to existing leads
  const existingLeads = JSON.parse(localStorage.getItem('funnelLeads')) || [];
  existingLeads.push(lead);
  localStorage.setItem('funnelLeads', JSON.stringify(existingLeads));
  
  // Add to UI
  addLeadToStage(lead);
  closeModal();
}

// Open notes modal
function openNotesModal(lead) {
  document.getElementById('leadModalName').textContent = lead.name;
  
  const tagElement = document.getElementById('leadModalTag');
  tagElement.className = 'lead-tag';
  tagElement.textContent = '';
  
  if (lead.tag === 'hot') {
    tagElement.classList.add('tag-hot');
    tagElement.textContent = '🔥 Hot lead';
  } else if (lead.tag === 'cold') {
    tagElement.classList.add('tag-cold');
    tagElement.textContent = '❄️ Cold lead';
  } else if (lead.tag === 'repeat') {
    tagElement.classList.add('tag-repeat');
    tagElement.textContent = '🔄 Repeat customer';
  } else if (lead.tag === 'vip') {
    tagElement.classList.add('tag-vip');
    tagElement.textContent = '⭐ VIP';
  }
  
  document.getElementById('editNotes').value = lead.notes || '';
  document.getElementById('editingLeadId').value = lead.id;
  document.getElementById('notesModal').style.display = 'block';
}

// Update notes
function updateNotes() {
  const leadId = parseInt(document.getElementById('editingLeadId').value);
  const newNotes = document.getElementById('editNotes').value.trim();
  
  // Update in localStorage
  const leads = JSON.parse(localStorage.getItem('funnelLeads')) || [];
  const leadIndex = leads.findIndex(l => l.id === leadId);
  
  if (leadIndex !== -1) {
    leads[leadIndex].notes = newNotes;
    localStorage.setItem('funnelLeads', JSON.stringify(leads));
    
    // Update in UI
    const leadCard = document.querySelector(`.lead-card[data-lead-id="${leadId}"]`);
    if (leadCard) {
      leadCard.querySelector('.lead-notes').textContent = newNotes || 'No notes';
    }
  }
  
  closeModal();
}

// Close modal
function closeModal() {
  document.getElementById('leadModal').style.display = 'none';
  document.getElementById('notesModal').style.display = 'none';
}
