// Loading project data from a file list
import projectList from "./project_list.json" with { type: "json" };

// Canonical category → Calcite icon mapping; unknown categories fall back to "clustering"
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
  "Independent/Preliminary Research": "lightbulb",
  "Open Source": "open-book",
  "Coding-centric": "terminal",
};

const DEFAULT_TAG_ICON = "clustering";
const OTHER_TAG_LABEL = "Other";

const ASSET_DIR = "./assets/";
const PROJECT_DIR = "./projects/";

let allProjects = [];
let selectedFilterTags = new Set();

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

function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function getFilterTag(tagLabel) {
  return TAG_MAP[tagLabel] ? tagLabel : OTHER_TAG_LABEL;
}

function getTagIcon(tagLabel) {
  return TAG_MAP[tagLabel] ?? DEFAULT_TAG_ICON;
}

function createChip(tagLabel, { showLabel = false } = {}) {
  const chip = document.createElement("calcite-chip");
  chip.setAttribute("icon", getTagIcon(tagLabel));
  chip.setAttribute("scale", "s");
  chip.setAttribute("value", tagLabel);

  if (showLabel) chip.textContent = tagLabel;

  return chip;
}

const grid = document.getElementById("card-grid");
const dialog = document.getElementById("project-dialog");
const dialogBody = document.getElementById("dialog-body");
const closeBtn = document.getElementById("dialog-close-btn");

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

function getProjectFilterTags(proj) {
  const tags = proj.tags ?? [];

  if (tags.length === 0) return [OTHER_TAG_LABEL];

  return [...new Set(tags.map((tag) => getFilterTag(tag)))];
}

function getAllFilterTags(projects) {
  const tags = new Set();

  projects.forEach((proj) => {
    getProjectFilterTags(proj).forEach((tag) => tags.add(tag));
  });

  return [...tags].sort((a, b) => {
    if (a === OTHER_TAG_LABEL) return 1;
    if (b === OTHER_TAG_LABEL) return -1;
    return a.localeCompare(b);
  });
}

function createProjectsFilter(projects) {
  const filterTags = getAllFilterTags(projects);
  selectedFilterTags = new Set(filterTags);

  const existingFilter = document.getElementById("projects-filter-wrapper");
  if (existingFilter) existingFilter.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "projects-filter-wrapper";
  wrapper.className = "projects-filter";

  const button = document.createElement("calcite-button");
  button.id = "projects-filter-button";
  button.setAttribute("appearance", "outline");
  button.setAttribute("icon-start", "filter");

  const menu = document.createElement("div");
  menu.id = "projects-filter-menu";
  menu.className = "projects-filter-menu";
  menu.hidden = true;

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    menu.hidden = true;
  });

  const actions = document.createElement("div");
  actions.className = "projects-filter-actions";

  const selectAllBtn = document.createElement("calcite-button");
  selectAllBtn.setAttribute("scale", "s");
  selectAllBtn.setAttribute("appearance", "outline");
  selectAllBtn.setAttribute("icon-start", "check-square-f");
  selectAllBtn.textContent = "Select All";

  const clearBtn = document.createElement("calcite-button");
  clearBtn.setAttribute("scale", "s");
  clearBtn.setAttribute("appearance", "outline");
  clearBtn.setAttribute("icon-start", "erase");
  clearBtn.textContent = "Clear Selection";

  actions.appendChild(selectAllBtn);
  actions.appendChild(clearBtn);
  menu.appendChild(actions);

  const tagList = document.createElement("div");
  tagList.className = "projects-filter-tags";

  filterTags.forEach((tagLabel) => {
    const label = document.createElement("label");
    label.className = "projects-filter-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = tagLabel;

    const icon = document.createElement("calcite-icon");
    icon.setAttribute("icon", getTagIcon(tagLabel));
    icon.setAttribute("scale", "s");

    const text = document.createElement("span");
    text.textContent = tagLabel;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedFilterTags.add(tagLabel);
      } else {
        selectedFilterTags.delete(tagLabel);
      }

      updateFilterButton(button, filterTags.length);
      renderProjects(getFilteredProjects(allProjects));
    });

    label.appendChild(checkbox);
    label.appendChild(icon);
    label.appendChild(text);
    tagList.appendChild(label);
  });

  menu.appendChild(tagList);

  selectAllBtn.addEventListener("click", () => {
    selectedFilterTags = new Set(filterTags);

    tagList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.checked = true;
    });

    updateFilterButton(button, filterTags.length);
    renderProjects(getFilteredProjects(allProjects));
  });

  clearBtn.addEventListener("click", () => {
    selectedFilterTags.clear();

    tagList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.checked = false;
    });

    updateFilterButton(button, filterTags.length);
    renderProjects(getFilteredProjects(allProjects));
  });

  wrapper.appendChild(button);
  wrapper.appendChild(menu);

	const headingRow = document.querySelector(".projects-heading-row");
	headingRow.appendChild(wrapper);
  updateFilterButton(button, filterTags.length);
}

function updateFilterButton(button, totalCount) {
  const count = selectedFilterTags.size;

  if (count === totalCount) {
    button.textContent = "Filter Projects: All";
  } else if (count === 0) {
    button.textContent = "Filter Projects: None";
  } else {
    button.textContent = `Filter Projects: ${count}`;
  }
}

function getFilteredProjects(projects) {
  if (selectedFilterTags.size === 0) return [];

  return projects.filter((proj) => {
    const projectFilterTags = getProjectFilterTags(proj);
    return projectFilterTags.some((tag) => selectedFilterTags.has(tag));
  });
}

function renderProjects(projects) {
  grid.innerHTML = "";

  projects.forEach((proj, idx) => {
    const card = document.createElement("calcite-card");
    card.setAttribute("label", proj.title);

	const img = document.createElement("img");
	img.setAttribute("slot", "thumbnail");
	img.setAttribute(
	  "alt",
	  proj.thumbnail_alt_text ||
		`${proj.title} thumbnail image`,
	);
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

    tags.forEach((tagLabel, tIdx) => {
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

    action.addEventListener("click", (e) => {
      e.stopPropagation();
      openDialog(proj);
    });

    footerEnd.appendChild(action);
    card.appendChild(footerEnd);

    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
      openDialog(proj);
    });

    grid.appendChild(card);
  });
}

function openDialog(proj) {
  dialog.setAttribute("heading", proj.title);
  dialog.setAttribute("description", proj.author);

  dialogBody.innerHTML = "";

	const img = document.createElement("img");
	img.src = assetPath(proj.popup_image);
	img.alt =
	  proj.popup_alt_text ||
	  `${proj.title} popup image`;
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
      btn.setAttribute("scale", "m");
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

loadProjects()
  .then((projects) => {
    allProjects = shuffle(projects);
    createProjectsFilter(allProjects);
    renderProjects(getFilteredProjects(allProjects));
  })
  .catch((err) => {
    console.error(err);
    grid.innerHTML = "<p>Unable to load project data.</p>";
  });

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
  const body = document.body;

  new Set(themes.flatMap((t) => [t.key, t.mode])).forEach((cls) =>
    body.classList.remove(cls),
  );

  const theme = themes[idx];
  body.classList.add(theme.mode);
  body.classList.add(theme.key);

  themeBtn.setAttribute("icon", theme.icon);
  themeBtn.setAttribute("text", theme.label);
  themeBtn.setAttribute("title", `Theme: ${theme.label}`);
}

applyTheme(currentThemeIdx);

themeBtn.addEventListener("click", () => {
  currentThemeIdx = (currentThemeIdx + 1) % themes.length;
  applyTheme(currentThemeIdx);
});