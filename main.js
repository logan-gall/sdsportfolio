// Loading project data from a file list
import projectList from "./project_list.json" with { type: "json" };

// Canonical category → Calcite icon mapping; unknown categories fall back to "analysis"
const TAG_MAP = {
  "Machine Learning & AI": "deep-learning",
  "Robotics & Geospatial Technology": "drone-quadcopter",
  "Cartography & Visualization": "map-pin",
  "Network Analysis": "utility-network",
  "Remote Sensing": "satellite-2-f",
  "Urban Planning": "urban-model",
  "Environment": "snow-thunder",
  "Geoscience": "slice",
  "Agriculture": "color-coded-map",
  "Health": "medical",
  "Natural Resource Management": "tree",
  "Transportation": "bus",
  "Independent (Preliminary) Research": "lightbulb",
  "open-source": "open-book",
  "coding-centric": "terminal",
};

const ASSET_DIR = "./assets/";
const PROJECT_DIR = "./projects/";

async function loadProjects() {
  const projectFiles = Array.isArray(projectList)
    ? projectList
    : projectList.projects;

  const projects = await Promise.all(
    projectFiles.map(async (file) => {
      const response = await fetch(`${PROJECT_DIR}${file}`);
      if (!response.ok) {
        throw new Error(`Failed to load project file: ${file}`);
      }
      return response.json();
    }),
  );

  return projects;
}

function assetPath(filename) {
  if (!filename) return "";
  if (filename.startsWith("http") || filename.startsWith("/")) return filename;
  return `${ASSET_DIR}${filename}`;
}

// Function to shuffle array of projects for random display order on each load
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Dynamic chip creator for tags
function createChip(tagLabel, { showLabel = false } = {}) {
  const chip = document.createElement("calcite-chip");
  chip.setAttribute("icon", TAG_MAP[tagLabel] ?? "analysis");
  chip.setAttribute("scale", "s");
  chip.setAttribute("value", tagLabel);
  if (showLabel) chip.textContent = tagLabel;
  return chip;
}

// Creating project cards
const grid = document.getElementById("card-grid");
const dialog = document.getElementById("project-dialog");
const dialogBody = document.getElementById("dialog-body");
const closeBtn = document.getElementById("dialog-close-btn");

// Mobile nav sheet
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileSheet = document.getElementById("mobile-sheet");
const mobilePanel = document.getElementById("mobile-panel");

mobileMenuBtn.addEventListener("click", () => {
  mobilePanel.removeAttribute("closed");
  mobileSheet.setAttribute("open", "");
});

mobilePanel.addEventListener("calcitePanelClose", () => {
  mobileSheet.removeAttribute("open");
});

function renderProjects(projects) {
  grid.innerHTML = "";

  const shuffled = shuffle(projects);

  shuffled.forEach((proj, idx) => {
    const card = document.createElement("calcite-card");
    card.setAttribute("label", proj.title);

    const img = document.createElement("img");
    img.setAttribute("slot", "thumbnail");
    img.setAttribute("alt", proj.title);
    img.setAttribute("src", assetPath(proj.thumbnail_image));
    card.appendChild(img);

    const heading = document.createElement("span");
    heading.setAttribute("slot", "heading");
    heading.textContent = proj.title;
    card.appendChild(heading);

    const desc = document.createElement("span");
    desc.setAttribute("slot", "description");
    desc.textContent = proj.author;
    card.appendChild(desc);

    const footerStart = document.createElement("div");
    footerStart.setAttribute("slot", "footer-start");
    footerStart.className = "chip-row";

    const tags = proj.tags ?? [];

    tags.slice(0, 3).forEach((tagLabel, tIdx) => {
      const chipId = `chip-${idx}-${tIdx}`;
      const chip = createChip(tagLabel);
      chip.setAttribute("id", chipId);
      footerStart.appendChild(chip);

      const tt = document.createElement("calcite-tooltip");
      tt.setAttribute("reference-element", chipId);
      tt.setAttribute("placement", "bottom");
      tt.textContent = tagLabel;
      footerStart.appendChild(tt);
    });

    card.appendChild(footerStart);

    const footerEnd = document.createElement("div");
    footerEnd.setAttribute("slot", "footer-end");

    const action = document.createElement("calcite-action");
    action.setAttribute("scale", "s");
    action.setAttribute("icon", "information-f");
    action.setAttribute("text", "More info");
    action.setAttribute("title", "View details");
    action.addEventListener("click", () => openDialog(proj));

    footerEnd.appendChild(action);
    card.appendChild(footerEnd);

    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      if (!e.target.closest("calcite-action")) openDialog(proj);
    });

    grid.appendChild(card);
  });
}

// Dialog population and open function
function openDialog(proj) {
  dialog.setAttribute("heading", proj.title);
  dialog.setAttribute("description", proj.author);

  dialogBody.innerHTML = "";

  const img = document.createElement("img");
  img.src = assetPath(proj.popup_image);
  img.alt = proj.title;
  dialogBody.appendChild(img);

  const descP = document.createElement("p");
  descP.className = "dialog-description";
  descP.innerHTML = proj.description ?? "";
  dialogBody.appendChild(descP);

  const tagsDiv = document.createElement("div");
  tagsDiv.className = "dialog-tags";

  const tags = proj.tags ?? [];

  tags.forEach((tagLabel) => {
    tagsDiv.appendChild(createChip(tagLabel, { showLabel: true }));
  });

  dialogBody.appendChild(tagsDiv);

  const existingLinks = dialog.querySelector(".dialog-links");
  if (existingLinks) existingLinks.remove();

  const links = [proj.link_1, proj.link_2, proj.link_3].filter(Boolean);

  if (links.length > 0) {
    const linksDiv = document.createElement("div");
    linksDiv.className = "dialog-links";
    linksDiv.setAttribute("slot", "footer-start");

    links.forEach((link) => {
      const btn = document.createElement("calcite-button");
      btn.setAttribute("appearance", "outline");
      btn.setAttribute("scale", "s");
      btn.setAttribute("href", link.link);
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
      btn.textContent = link.text;
      linksDiv.appendChild(btn);
    });

    dialog.appendChild(linksDiv);
  }

  dialog.setAttribute("open", "");
}

closeBtn.addEventListener("click", () => {
  dialog.removeAttribute("open");
});

// Load projects
loadProjects()
  .then(renderProjects)
  .catch((err) => {
    console.error(err);
    grid.innerHTML = "<p>Unable to load project data.</p>";
  });

// Theme switcher
const themes = [
  {
    key: "theme-light",
    mode: "calcite-mode-light",
    label: "Light",
    icon: "brightness",
  },
  {
    key: "theme-dark",
    mode: "calcite-mode-dark",
    label: "Dark",
    icon: "moon",
  },
  {
    key: "theme-umn",
    mode: "calcite-mode-dark",
    label: "Minnesota",
    icon: "education",
  },
];

let currentThemeIdx = 0;

const themeBtn = document.getElementById("theme-btn");

function applyTheme(idx) {
  const html = document.documentElement;

  new Set(themes.flatMap((t) => [t.key, t.mode])).forEach((cls) =>
    html.classList.remove(cls),
  );

  const theme = themes[idx];
  html.classList.add(theme.mode);
  html.classList.add(theme.key);

  themeBtn.setAttribute("icon", theme.icon);
  themeBtn.setAttribute("text", theme.label);
  themeBtn.setAttribute("title", `Theme: ${theme.label}`);
}

applyTheme(currentThemeIdx);

themeBtn.addEventListener("click", () => {
  currentThemeIdx = (currentThemeIdx + 1) % themes.length;
  applyTheme(currentThemeIdx);
});