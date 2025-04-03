const stageNames = ["Awareness", "Consideration", "Purchase", "Retention"];
const stageContainer = document.getElementById("stageContainer");

// Initialize with default stages
stageNames.forEach(name => addStage(name));

function addStage(name = "New Stage") {
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.draggable = true;
  stage.innerHTML = `
    <strong contenteditable="true">${name}</strong>
    <textarea placeholder="Add notes..."></textarea>
  `;

  addDragEvents(stage);
  stageContainer.appendChild(stage);
}

function addDragEvents(stage) {
  stage.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", stage.outerHTML);
    e.dataTransfer.effectAllowed = "move";
    stage.classList.add("dragging");
  });

  stage.addEventListener("dragend", () => {
    document.querySelectorAll(".stage").forEach(s => s.classList.remove("dragging"));
  });

  stageContainer.addEventListener("dragover", e => e.preventDefault());

  stageContainer.addEventListener("drop", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (dragging) dragging.remove();

    const droppedHTML = e.dataTransfer.getData("text/plain");
    const temp = document.createElement("div");
    temp.innerHTML = droppedHTML;
    const droppedStage = temp.firstChild;
    addDragEvents(droppedStage);
    stageContainer.insertBefore(droppedStage, e.target.closest(".stage")?.nextSibling);
  });
}

function checkGaps() {
  const stages = document.querySelectorAll(".stage");
  let hasGap = false;

  stages.forEach(stage => stage.classList.remove("highlight-gap"));

  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i].querySelector("textarea").value.trim();
    const next = stages[i + 1].querySelector("textarea").value.trim();
    if (!current || !next) {
      stages[i].classList.add("highlight-gap");
      stages[i + 1].classList.add("highlight-gap");
      hasGap = true;
    }
  }

  if (!hasGap) alert("✅ No gaps found!");
  else alert("⚠️ Gaps found! Check highlighted stages.");
}
