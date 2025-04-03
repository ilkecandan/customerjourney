// Default stages
const defaultStageNames = ["Awareness", "Consideration", "Purchase", "Retention", "Loyalty"];
const stageContainer = document.getElementById("stageContainer");
const connectorsContainer = document.getElementById("connectorsContainer");
const analyticsPanel = document.getElementById("analyticsPanel");

// Example journey data
const exampleJourney = [
  { name: "Awareness", notes: "Social media ads\nBlog content\nSEO optimized pages" },
  { name: "Consideration", notes: "Product comparisons\nEmail nurturing\nWebinars" },
  { name: "Purchase", notes: "Checkout process\nPayment options\nDiscount offers" },
  { name: "Retention", notes: "Thank you email\nCustomer onboarding\nSupport resources" },
  { name: "Loyalty", notes: "Loyalty program\nExclusive offers\nCommunity access" }
];

// Initialize the app
function init() {
  // Load from localStorage if available
  const savedJourney = localStorage.getItem('customerJourney');
  
  if (savedJourney) {
    loadJourney(JSON.parse(savedJourney));
  } else {
    // Create default stages
    defaultStageNames.forEach(name => addStage(name));
  }
  
  // Update analytics
  updateAnalytics();
  
  // Auto-save every 5 seconds
  setInterval(saveJourney, 5000);
}

// Add a new stage
function addStage(name = "New Stage", notes = "") {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.draggable = true;
  stage.innerHTML = `
    <strong contenteditable="true">${name}</strong>
    <textarea placeholder="Add touchpoints, notes, or data...">${notes}</textarea>
    <div class="word-count">Words: 0</div>
  `;
  
  addDragEvents(stage);
  addEditEvents(stage);
  stageContainer.appendChild(stage);
  
  // Update connectors
  updateConnectors();
  updateAnalytics();
  saveJourney();
}

// Add drag and drop events
function addDragEvents(stage) {
  stage.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", stage.dataset.id || "");
    e.dataTransfer.effectAllowed = "move";
    stage.classList.add("dragging");
    setTimeout(() => stage.style.display = "none", 0);
  });

  stage.addEventListener("dragend", () => {
    document.querySelectorAll(".stage").forEach(s => {
      s.classList.remove("dragging");
      s.style.display = "flex";
      s.style.flexDirection = "column";
    });
  });

  stageContainer.addEventListener("dragover", e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(stageContainer, e.clientX);
    const dragging = document.querySelector(".dragging");
    
    if (afterElement == null) {
      stageContainer.appendChild(dragging);
    } else {
      stageContainer.insertBefore(dragging, afterElement);
    }
  });

  stageContainer.addEventListener("drop", e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const stage = document.querySelector(`.stage[data-id="${id}"]`);
    
    if (stage) {
      const afterElement = getDragAfterElement(stageContainer, e.clientX);
      
      if (afterElement == null) {
        stageContainer.appendChild(stage);
      } else {
        stageContainer.insertBefore(stage, afterElement);
      }
      
      updateConnectors();
      saveJourney();
    }
  });
}

// Helper function for drag positioning
function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll(".stage:not(.dragging)")];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Add edit events for stage content
function addEditEvents(stage) {
  const textarea = stage.querySelector("textarea");
  const wordCount = stage.querySelector(".word-count");
  
  // Generate unique ID if not exists
  if (!stage.dataset.id) {
    stage.dataset.id = 'stage-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Update word count on input
  textarea.addEventListener("input", () => {
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    wordCount.textContent = `Words: ${words}`;
    updateAnalytics();
    saveJourney();
  });
  
  // Save when stage name is edited
  stage.querySelector("strong").addEventListener("blur", saveJourney);
}

// Update connector arrows between stages
function updateConnectors() {
  connectorsContainer.innerHTML = "";
  const stages = document.querySelectorAll(".stage");
  
  if (stages.length < 2) return;
  
  for (let i = 0; i < stages.length - 1; i++) {
    const connector = document.createElement("div");
    connector.className = "connector";
    connectorsContainer.appendChild(connector);
  }
}

// Check for gaps in the journey
function checkGaps() {
  const stages = document.querySelectorAll(".stage");
  let hasGap = false;
  
  // Reset all highlights
  stages.forEach(stage => {
    stage.classList.remove("highlight-gap");
    stage.querySelector("textarea").style.borderColor = "";
  });
  
  // Check each stage pair
  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i].querySelector("textarea").value.trim();
    const next = stages[i + 1].querySelector("textarea").value.trim();
    
    if (!current || !next) {
      stages[i].classList.add("highlight-gap");
      stages[i + 1].classList.add("highlight-gap");
      stages[i].querySelector("textarea").style.borderColor = "#f72585";
      stages[i + 1].querySelector("textarea").style.borderColor = "#f72585";
      hasGap = true;
    }
  }
  
  // Show result
  if (!hasGap) {
    showNotification("✅ No gaps found in your journey!", "success");
  } else {
    showNotification("⚠️ Gaps found! Check highlighted stages.", "warning");
  }
  
  updateAnalytics();
}

// Show/hide analytics panel
function showAnalytics() {
  analyticsPanel.classList.remove("hidden");
  updateAnalytics();
}

function hideAnalytics() {
  analyticsPanel.classList.add("hidden");
}

// Update analytics metrics
function updateAnalytics() {
  const stages = document.querySelectorAll(".stage");
  const totalStages = stages.length;
  let totalWords = 0;
  let completedStages = 0;
  let gapCount = 0;
  
  // Calculate metrics
  stages.forEach(stage => {
    const textarea = stage.querySelector("textarea");
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    totalWords += words;
    
    if (words > 0) completedStages++;
  });
  
  // Check for gaps
  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i].querySelector("textarea").value.trim();
    const next = stages[i + 1].querySelector("textarea").value.trim();
    if (!current || !next) gapCount++;
  }
  
  // Update UI
  document.getElementById("totalStages").textContent = totalStages;
  document.getElementById("totalWords").textContent = totalWords;
  document.getElementById("completionRate").textContent = 
    totalStages > 0 ? Math.round((completedStages / totalStages) * 100) + "%" : "0%";
  document.getElementById("gapCount").textContent = gapCount;
}

// Save journey to localStorage
function saveJourney() {
  const stages = document.querySelectorAll(".stage");
  const journeyData = [];
  
  stages.forEach(stage => {
    journeyData.push({
      id: stage.dataset.id,
      name: stage.querySelector("strong").textContent,
      notes: stage.querySelector("textarea").value
    });
  });
  
  localStorage.setItem('customerJourney', JSON.stringify(journeyData));
  
  // Show save confirmation
  const saveNotice = document.getElementById("saveNotice");
  saveNotice.style.opacity = 1;
  setTimeout(() => {
    saveNotice.style.opacity = 0.7;
  }, 2000);
}

// Load journey from data
function loadJourney(journeyData) {
  // Clear existing stages
  stageContainer.innerHTML = "";
  
  // Create new stages from data
  journeyData.forEach(stage => {
    addStage(stage.name, stage.notes);
  });
}

// Export as JSON
function exportAsJSON() {
  const stages = document.querySelectorAll(".stage");
  const journeyData = [];
  
  stages.forEach(stage => {
    journeyData.push({
      name: stage.querySelector("strong").textContent,
      notes: stage.querySelector("textarea").value
    });
  });
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(journeyData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "customer-journey.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  
  showNotification("JSON exported successfully!", "success");
}

// Export as PDF (simplified - in a real app you'd use a library like jsPDF)
function exportAsPDF() {
  showNotification("PDF export would be implemented with a library like jsPDF in a production app", "info");
}

// Load example journey
function loadExample() {
  if (confirm("Load example journey? This will replace your current journey.")) {
    stageContainer.innerHTML = "";
    exampleJourney.forEach(stage => {
      addStage(stage.name, stage.notes);
    });
    showNotification("Example journey loaded!", "success");
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Add notification styles to head
const style = document.createElement("style");
style.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transition: all 0.3s ease;
  }
  
  .notification-success {
    background-color: #4CAF50;
  }
  
  .notification-warning {
    background-color: #FF9800;
  }
  
  .notification-info {
    background-color: #2196F3;
  }
  
  .fade-out {
    opacity: 0;
    transform: translateY(20px);
  }
`;
document.head.appendChild(style);
