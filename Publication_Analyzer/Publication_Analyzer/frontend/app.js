const API_BASE = window.location.origin;

const STORAGE_SAVED_AUTHORS = "pub_analyzer_saved_authors";
const STORAGE_SAVED_WORKS = "pub_analyzer_saved_works";
const STORAGE_THEME = "pub_analyzer_theme";

const searchSection = document.getElementById("searchSection");
const resultsSection = document.getElementById("resultsSection");
const profileSection = document.getElementById("profileSection");
const savedSection = document.getElementById("savedSection");
const batchSection = document.getElementById("batchSection");
const rankSection = document.getElementById("rankSection");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsList = document.getElementById("resultsList");
const resultsTitle = document.getElementById("resultsTitle");
const resultsLoading = document.getElementById("resultsLoading");
const emptyState = document.getElementById("emptyState");
const backToSearch = document.getElementById("backToSearch");
const profileHeader = document.getElementById("profileHeader");
const profileStats = document.getElementById("profileStats");
const worksList = document.getElementById("worksList");
const worksLoading = document.getElementById("worksLoading");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const emptyWorks = document.getElementById("emptyWorks");
const fingerprintSection = document.getElementById("fingerprintSection");
const fingerprintLoading = document.getElementById("fingerprintLoading");
const fingerprintChart = document.getElementById("fingerprintChart");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const backToResults = document.getElementById("backToResults");
const summaryModal = document.getElementById("summaryModal");
const summaryModalClose = document.getElementById("summaryModalClose");
const summaryModalLoading = document.getElementById("summaryModalLoading");
const summaryModalContentWrap = document.getElementById("summaryModalContentWrap");
const summaryModalContent = document.getElementById("summaryModalContent");
const summaryModalError = document.getElementById("summaryModalError");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const dashboardSection = document.getElementById("dashboardSection");
const csvUploadArea = document.getElementById("csvUploadArea");
const csvFileInput = document.getElementById("csvFileInput");
const csvPickBtn = document.getElementById("csvPickBtn");
const dashboardStats = document.getElementById("dashboardStats");
const statsGrid = document.getElementById("statsGrid");
const rankTopicInput = document.getElementById("rankTopicInput");
const rankSearchBtn = document.getElementById("rankSearchBtn");
const rankResults = document.getElementById("rankResults");
const rankPapersList = document.getElementById("rankPapersList");
const rankLoading = document.getElementById("rankLoading");
const rankEmptyState = document.getElementById("rankEmptyState");
const rankResultsTitle = document.getElementById("rankResultsTitle");
const rankStats = document.getElementById("rankStats");
const rankYearFrom = document.getElementById("rankYearFrom");
const rankYearTo = document.getElementById("rankYearTo");

let currentChatWorkId = null;

let currentAuthorId = null;
let currentAuthorData = null;
let worksPage = 1;
let worksTotal = 0;
const perPage = 25;
let fingerprintChartInstance = null;

function getTheme() {
  return localStorage.getItem(STORAGE_THEME) || "light";
}

function setTheme(theme) {
  theme = theme === "dark" ? "dark" : "light";
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_THEME, theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "light" ? "Dark" : "Light";
}

function initTheme() {
  setTheme(getTheme());
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", () => setTheme(getTheme() === "light" ? "dark" : "light"));
}

function getSavedAuthors() {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_AUTHORS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSavedWorks() {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_WORKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAuthor(author) {
  const list = getSavedAuthors();
  if (list.some((a) => a.id === author.id)) return;
  list.push({
    id: author.id,
    display_name: author.display_name,
    works_count: author.works_count,
    cited_by_count: author.cited_by_count,
    h_index: author.h_index,
    institution: author.institution,
  });
  localStorage.setItem(STORAGE_SAVED_AUTHORS, JSON.stringify(list));
  refreshSaveButtons();
}

function saveWork(work) {
  const list = getSavedWorks();
  if (list.some((w) => w.id === work.id)) return;
  list.push({
    id: work.id,
    title: work.title || "Untitled",
    publication_year: work.publication_year,
    venue: work.venue,
    cited_by_count: work.cited_by_count ?? 0,
    doi: work.doi,
  });
  localStorage.setItem(STORAGE_SAVED_WORKS, JSON.stringify(list));
  refreshSaveButtons();
}

function removeSavedAuthor(id) {
  const list = getSavedAuthors().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_SAVED_AUTHORS, JSON.stringify(list));
  refreshSaveButtons();
  if (savedSection && !savedSection.classList.contains("hidden")) renderSavedContent();
}

function removeSavedWork(id) {
  const list = getSavedWorks().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_SAVED_WORKS, JSON.stringify(list));
  refreshSaveButtons();
  if (savedSection && !savedSection.classList.contains("hidden")) renderSavedContent();
}

function isAuthorSaved(id) {
  return getSavedAuthors().some((a) => a.id === id);
}

function isWorkSaved(id) {
  return getSavedWorks().some((w) => w.id === id);
}

function refreshSaveButtons() {
  document.querySelectorAll("[data-save-author-id]").forEach((btn) => {
    const id = btn.dataset.saveAuthorId;
    btn.textContent = isAuthorSaved(id) ? "Saved" : "Save";
    btn.classList.toggle("saved", isAuthorSaved(id));
  });
  document.querySelectorAll("[data-save-work-id]").forEach((btn) => {
    const id = btn.dataset.saveWorkId;
    btn.textContent = isWorkSaved(id) ? "Saved" : "Save";
    btn.classList.toggle("saved", isWorkSaved(id));
  });
}

function showSearch() {
  searchSection.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
  searchInput.value = "";
  searchInput.focus();
}

function showResults() {
  searchSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
}

function showProfile() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.remove("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
}

function goBackToResults() {
  // Go back to results without clearing them
  if (resultsList.children.length > 0) {
    showResults();
  } else {
    showSearch();
  }
}

function showSaved() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.remove("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
  renderSavedContent();
}

function showCompareTab() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
  openCompareModal();
}

function showBatch() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.add("hidden");
}

function showDashboard() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  rankSection.classList.add("hidden");
}

function showRank() {
  searchSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  savedSection.classList.add("hidden");
  batchSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  rankSection.classList.remove("hidden");
  rankTopicInput.value = "";
  rankTopicInput.focus();
}

function setLoading(listEl, loadingEl, show) {
  if (show) {
    listEl.innerHTML = "";
    loadingEl.classList.remove("hidden");
  } else {
    loadingEl.classList.add("hidden");
  }
}

async function downloadAccreditationPdf() {
  if (!currentAuthorId) {
    alert("No author selected");
    return;
  }

  downloadPdfBtn.disabled = true;
  downloadPdfBtn.textContent = "Generating PDF...";

  try {
    const response = await fetch(`${API_BASE}/api/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id: currentAuthorId,
        author_name: currentAuthorData?.display_name || "Unknown",
        works_count: currentAuthorData?.works_count || 0,
        cited_by_count: currentAuthorData?.cited_by_count || 0,
        h_index: currentAuthorData?.summary_stats?.h_index || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accreditation_${currentAuthorId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e) {
    alert(`Error generating PDF: ${e.message}`);
  } finally {
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.textContent = "📄 Download PDF Report";
  }
}

async function loadResearchFingerprint(authorId) {
  if (!authorId) return;
  
  fingerprintLoading.classList.remove("hidden");
  
  try {
    const response = await fetch(`${API_BASE}/api/author/${encodeURIComponent(authorId)}/research-fingerprint`);
    if (!response.ok) throw new Error("Failed to fetch fingerprint data");
    
    const data = await response.json();
    fingerprintLoading.classList.add("hidden");
    
    // Destroy previous chart if it exists
    if (fingerprintChartInstance) {
      fingerprintChartInstance.destroy();
    }
    
    const ctx = fingerprintChart.getContext("2d");
    const labels = Object.keys(data.publication_types);
    const values = Object.values(data.publication_types);
    const colors = [
      "#6366f1", "#ec4899", "#f59e0b", "#10b981", 
      "#0ea5e9", "#a855f7", "#ef4444", "#f97316"
    ];
    
    fingerprintChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels.map(l => l.replace(/_/g, " ").toUpperCase()),
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: "rgba(255,255,255,0.9)",
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: { size: 13, family: "'DM Sans', sans-serif", weight: 600 },
              color: "#4a5568",
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
            }
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13, weight: 700 },
            bodyFont: { size: 12, weight: 600 },
            borderColor: "#6366f1",
            borderWidth: 2,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (e) {
    fingerprintLoading.textContent = "Unable to load research fingerprint";
    console.error("Fingerprint error:", e);
  }
}

async function doSearch() {
  const q = searchInput.value.trim();
  if (q.length < 2) return;
  showResults();
  resultsList.innerHTML = "";
  setLoading(resultsList, resultsLoading, true);
  emptyState.classList.add("hidden");
  resultsTitle.textContent = `Researchers matching "${q}"`;

  try {
    const r = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error("Search failed");
    const data = await r.json();
    setLoading(resultsList, resultsLoading, false);
    if (!data.results || data.results.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    
    // Show source indicator
    if (data.source) {
      const sourceIndicator = document.createElement("div");
      sourceIndicator.className = "search-source-indicator";
      sourceIndicator.textContent = `Results from ${data.source}`;
      resultsList.appendChild(sourceIndicator);
    }
    
    data.results.forEach((author) => {
      const card = document.createElement("div");
      card.className = "author-card-wrap";
      
      // Build metadata
      const meta = [
        author.works_count != null && `${author.works_count} papers`,
        author.cited_by_count != null && author.cited_by_count > 0 && `${author.cited_by_count} citations`,
        author.h_index != null && `h-index ${author.h_index}`,
        author.i10_index != null && `i10-index ${author.i10_index}`,
        author.institution,
      ].filter(Boolean);
      
      const saved = isAuthorSaved(author.id);
      
      // Build interests HTML
      let interestsHtml = "";
      if (author.interests && author.interests.length > 0) {
        interestsHtml = `<div class="author-card-interests">${author.interests.slice(0, 5).map(i => `<span class="interest-tag">${escapeHtml(i)}</span>`).join("")}</div>`;
      }
      
      // Build photo HTML
      let photoHtml = "";
      if (author.photo_url) {
        photoHtml = `<img src="${escapeHtml(author.photo_url)}" alt="${escapeHtml(author.display_name)}" class="author-card-photo" onerror="this.style.display='none'">`;
      } else {
        photoHtml = `<div class="author-card-photo-placeholder">${escapeHtml(author.display_name.charAt(0).toUpperCase())}</div>`;
      }
      
      // Build email HTML
      let emailHtml = "";
      if (author.email) {
        emailHtml = `<div class="author-card-email">✉ ${escapeHtml(author.email)}</div>`;
      }
      
      card.innerHTML = `
        <button type="button" class="btn-view-profile" data-author-id="${escapeHtml(author.id)}" title="View profile">View profile</button>
        <button type="button" class="author-card" data-id="${escapeHtml(author.id)}">
          ${photoHtml}
          <div class="author-card-content">
            <span class="author-card-name">${escapeHtml(author.display_name)}</span>
            <div class="author-card-meta">${escapeHtml(meta.join(" · "))}</div>
            ${emailHtml}
            ${interestsHtml}
          </div>
        </button>
        <button type="button" class="btn-save btn-save-author ${saved ? "saved" : ""}" data-save-author-id="${escapeHtml(author.id)}" title="${saved ? "Remove from saved" : "Save author"}">${saved ? "Saved" : "Save"}</button>
      `;
      card.querySelector(".btn-view-profile").addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(author.id);
      });
      card.querySelector(".author-card").addEventListener("click", () => openProfile(author.id));
      card.querySelector(".btn-save-author").addEventListener("click", (e) => {
        e.stopPropagation();
        if (isAuthorSaved(author.id)) removeSavedAuthor(author.id);
        else saveAuthor(author);
      });
      resultsList.appendChild(card);
    });
  } catch (e) {
    setLoading(resultsList, resultsLoading, false);
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Search failed. Please try again.";
  }
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function openPrintView(type, data) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  let html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>" + escapeHtml(type === "profile" ? data.title : "Faculty comparison") + "</title><style>body{font-family:system-ui,sans-serif;padding:24px;max-width:700px;margin:0 auto;} h1,h2{margin-top:0;} .stat{display:inline-block;margin-right:24px;} .meta{color:#666;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;} @media print{body{padding:0;}}</style></head><body>";
  if (type === "profile") {
    html += "<h1>" + escapeHtml(data.title) + "</h1>";
    if (data.institutions) html += "<p class=\"meta\">" + escapeHtml(data.institutions) + "</p>";
    html += "<p><strong>Publications:</strong> " + (data.works_count ?? "—") + " &nbsp; <strong>Citations:</strong> " + (data.cited_by_count ?? "—") + " &nbsp; <strong>h-index:</strong> " + (data.stats.h_index ?? "—") + " &nbsp; <strong>i10-index:</strong> " + (data.stats.i10_index ?? "—") + "</p>";
    html += "<h2>Research papers</h2><table><tr><th>Title</th><th>Year</th><th>Venue</th><th>Citations</th></tr>";
    (data.works || []).forEach((w) => {
      html += "<tr><td>" + escapeHtml(w.title || "Untitled") + "</td><td>" + (w.publication_year ?? "—") + "</td><td>" + escapeHtml(w.venue || "—") + "</td><td>" + (w.cited_by_count ?? 0) + "</td></tr>";
    });
    html += "</table>";
  } else if (type === "compare") {
    html += "<h1>Faculty comparison</h1>";
    html += "<h2>" + escapeHtml(data.name1) + "</h2><p class=\"meta\">" + escapeHtml(data.inst1 || "—") + "</p><p>Publications: " + (data.w1 ?? "—") + " | Citations: " + (data.c1 ?? "—") + " | h-index: " + (data.h1 ?? "—") + " | i10: " + (data.i1 ?? "—") + "</p>";
    html += "<h2>" + escapeHtml(data.name2) + "</h2><p class=\"meta\">" + escapeHtml(data.inst2 || "—") + "</p><p>Publications: " + (data.w2 ?? "—") + " | Citations: " + (data.c2 ?? "—") + " | h-index: " + (data.h2 ?? "—") + " | i10: " + (data.i2 ?? "—") + "</p>";
    html += "<h2>Assessment</h2><div style=\"white-space:pre-wrap;line-height:1.6;\">" + (data.assessment || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>") + "</div>";
  }
  html += "</body></html>";
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => {
    const s = String(cell ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function formatSummaryForDisplay(text) {
  if (!text) return "";
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

async function openProfile(authorId) {
  currentAuthorId = authorId;
  worksPage = 1;
  showProfile();
  profileHeader.innerHTML = "";
  profileStats.innerHTML = "";
  worksList.innerHTML = "";
  setLoading(worksList, worksLoading, true);
  loadMoreWrap.classList.add("hidden");
  emptyWorks.classList.add("hidden");

  const sortBy = document.getElementById("worksSortBy")?.value || "publication_date";
  const sortOrder = document.getElementById("worksSortOrder")?.value || "desc";
  const yearFrom = document.getElementById("worksYearFrom")?.value || "";
  const yearTo = document.getElementById("worksYearTo")?.value || "";
  const minCit = document.getElementById("worksMinCitations")?.value || "";
  
  // Check if quality ranking is selected
  const isQualityRank = sortBy === "quality_rank";
  
  let worksUrl;
  if (isQualityRank) {
    worksUrl = `${API_BASE}/api/author/${encodeURIComponent(authorId)}/works/ranked?page=1&per_page=${perPage}`;
  } else {
    worksUrl = `${API_BASE}/api/author/${encodeURIComponent(authorId)}/works?page=1&per_page=${perPage}&sort_by=${sortBy}&sort_order=${sortOrder}`;
  }
  
  if (yearFrom) worksUrl += `&year_from=${yearFrom}`;
  if (yearTo) worksUrl += `&year_to=${yearTo}`;
  if (minCit) worksUrl += `&min_citations=${minCit}`;

  try {
    const [authorRes, worksRes] = await Promise.all([
      fetch(`${API_BASE}/api/author/${encodeURIComponent(authorId)}`),
      fetch(worksUrl),
    ]);
    if (!authorRes.ok) throw new Error("Author not found");
    if (!worksRes.ok) throw new Error("Works request failed");
    const author = await authorRes.json();
    const worksData = await worksRes.json();
    worksTotal = worksData.meta?.count ?? 0;
    currentAuthorData = {
      id: author.id,
      display_name: author.display_name,
      works_count: author.works_count,
      cited_by_count: author.cited_by_count,
      h_index: (author.summary_stats || {}).h_index,
      summary_stats: author.summary_stats || {},
      institution: (author.last_known_institutions || [{}])[0]?.display_name,
    };

    const instNames = (author.last_known_institutions || []).map((i) => i.display_name).filter(Boolean);
    const authorSaved = isAuthorSaved(author.id);
    
    // Build profile photo HTML
    let photoHtml = "";
    if (author.photo_url) {
      photoHtml = `<img src="${escapeHtml(author.photo_url)}" alt="${escapeHtml(author.display_name)}" class="profile-photo" onerror="this.style.display='none'">`;
    }
    
    // Build email HTML
    let emailHtml = "";
    if (author.email) {
      emailHtml = `<p class="profile-email">✉ ${escapeHtml(author.email)}</p>`;
    }
    
    // Build interests HTML
    let interestsHtml = "";
    if (author.interests && author.interests.length > 0) {
      interestsHtml = `
        <div class="profile-interests">
          <strong>Research Interests:</strong>
          ${author.interests.map(i => `<span class="interest-tag">${escapeHtml(i)}</span>`).join("")}
        </div>
      `;
    }
    
    profileHeader.innerHTML = `
      <div class="profile-header-row">
        <div class="profile-header-main">
          ${photoHtml}
          <div class="profile-header-info">
            <h2 class="profile-name">${escapeHtml(author.display_name)}</h2>
            ${instNames.length ? `<p class="profile-institutions">${escapeHtml(instNames.join(", "))}</p>` : ""}
            ${emailHtml}
            ${interestsHtml}
          </div>
        </div>
        <div class="profile-header-actions">
          <button type="button" class="back-btn" id="profilePrintBtn" title="Print or save as PDF">Print / Export PDF</button>
          <button type="button" class="btn-save btn-save-author ${authorSaved ? "saved" : ""}" data-save-author-id="${escapeHtml(author.id)}" title="${authorSaved ? "Remove from saved" : "Save author"}">${authorSaved ? "Saved" : "Save"}</button>
        </div>
      </div>
    `;
    profileHeader.querySelector(".btn-save-author").addEventListener("click", () => {
      if (isAuthorSaved(author.id)) removeSavedAuthor(author.id);
      else saveAuthor(currentAuthorData);
    });
    profileHeader.querySelector("#profilePrintBtn").addEventListener("click", () => {
      openPrintView("profile", {
        title: author.display_name,
        institutions: instNames.join(", "),
        stats: author.summary_stats || {},
        works_count: author.works_count,
        cited_by_count: author.cited_by_count,
        works: worksData.results,
      });
    });

    const stats = author.summary_stats || {};
    const statRows = [
      [author.works_count, "Publications"],
      [author.cited_by_count, "Citations"],
      [stats.h_index, "h-index"],
      [stats.i10_index, "i10-index"],
    ].filter(([v]) => v != null);
    if (statRows.length) {
      profileStats.innerHTML = statRows
        .map(
          ([value, label]) => `
        <div class="stat">
          <span class="stat-value">${escapeHtml(String(value))}</span>
          <span class="stat-label">${escapeHtml(label)}</span>
        </div>
      `
        )
        .join("");
    }

    loadResearchFingerprint(authorId);

    setLoading(worksList, worksLoading, false);
    appendWorks(worksData.results, isQualityRank);
    if (worksData.results.length === 0) {
      emptyWorks.classList.remove("hidden");
    } else if (worksTotal > perPage) {
      loadMoreWrap.classList.remove("hidden");
    }

    const extWrap = document.getElementById("externalSourcesWrap");
    const extLoading = document.getElementById("externalSourcesLoading");
    const extGrid = document.getElementById("externalSourcesGrid");
    extWrap.classList.remove("hidden");
    extGrid.innerHTML = "";
    extLoading.classList.remove("hidden");
    fetch(`${API_BASE}/api/author/${encodeURIComponent(authorId)}/external-sources`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
      .then((data) => {
        extLoading.classList.add("hidden");
        renderExternalSources(extGrid, data);
      })
      .catch(() => {
        extLoading.classList.add("hidden");
        extGrid.innerHTML = "<p class=\"empty-state\">Could not load additional sources.</p>";
      });
  } catch (e) {
    setLoading(worksList, worksLoading, false);
    emptyWorks.classList.remove("hidden");
    emptyWorks.textContent = "Could not load profile. Please try again.";
  }
}

function renderExternalSources(container, data) {
  const sources = [
    { key: "semantic_scholar", label: "Semantic Scholar" },
    { key: "orcid", label: "ORCID" },
    { key: "crossref", label: "CrossRef" },
    { key: "openaire", label: "OpenAIRE (grants)" },
    { key: "europe_pmc", label: "Europe PMC" },
    { key: "google_scholar", label: "Google Scholar" },
  ];
  container.innerHTML = "";
  sources.forEach(({ key, label }) => {
    const raw = data[key];
    const card = document.createElement("div");
    card.className = "external-source-card";
    if (!raw || (typeof raw === "object" && raw.source === undefined && !raw.url)) {
      card.innerHTML = `
        <h4 class="external-source-title">${escapeHtml(label)}</h4>
        <p class="external-source-empty">No data found</p>
      `;
    } else {
      const url = raw.url || "#";
      let body = "";
      if (raw.paper_count != null || raw.citation_count != null || raw.citations != null || raw.publications_count != null) {
        const papers = raw.paper_count ?? raw.publications_count ?? "—";
        const cites = raw.citation_count ?? raw.citations ?? "—";
        body += `<p>Papers: ${papers} · Citations: ${cites}${raw.h_index != null ? ` · h-index: ${raw.h_index}` : ""}${raw.i10_index != null ? ` · i10-index: ${raw.i10_index}` : ""}</p>`;
      }
      if (raw.affiliation) {
        body += `<p class="external-source-list"><strong>Affiliation:</strong> ${escapeHtml(raw.affiliation)}</p>`;
      }
      if (raw.interests && raw.interests.length) {
        body += `<p class="external-source-list"><strong>Interests:</strong> ${raw.interests.map(i => escapeHtml(i)).join(", ")}</p>`;
      }
      if (raw.employments && raw.employments.length) {
        body += "<p class=\"external-source-list\"><strong>Employment:</strong> " + raw.employments.slice(0, 3).map((e) => escapeHtml(e.organization || e.role || "")).join("; ") + "</p>";
      }
      if (raw.educations && raw.educations.length) {
        body += "<p class=\"external-source-list\"><strong>Education:</strong> " + raw.educations.slice(0, 2).map((e) => escapeHtml(e.organization || e.role || "")).join("; ") + "</p>";
      }
      if (raw.fundings && raw.fundings.length) {
        body += "<p class=\"external-source-list\"><strong>Funding:</strong> " + raw.fundings.slice(0, 2).map((f) => escapeHtml(f.title || "")).join("; ") + "</p>";
      }
      if (raw.projects && raw.projects.length) {
        body += "<p class=\"external-source-list\"><strong>Projects:</strong> " + raw.projects.slice(0, 2).map((p) => escapeHtml(p.title || p.code || "")).join("; ") + "</p>";
      }
      if (raw.sample_works && raw.sample_works.length) {
        body += "<ul class=\"external-source-works\">" + raw.sample_works.slice(0, 3).map((w) => "<li>" + escapeHtml(w.title || "—") + (w.year ? " (" + w.year + ")" : "") + "</li>").join("") + "</ul>";
      }
      if (raw.sample_publications && raw.sample_publications.length) {
        body += "<ul class=\"external-source-works\">" + raw.sample_publications.slice(0, 3).map((w) => "<li>" + escapeHtml(w.title || "—") + (w.year ? " (" + w.year + ")" : "") + (w.citations ? ` · ${w.citations} citations` : "") + "</li>").join("") + "</ul>";
      }
      if (raw.hit_count != null && raw.sample_works && raw.sample_works.length) {
        body = "<p>Found " + raw.hit_count + " papers (sample below).</p>" + body;
      }
      card.innerHTML = `
        <h4 class="external-source-title">${escapeHtml(raw.source || label)}</h4>
        <div class="external-source-body">${body || "<p>Data available.</p>"}</div>
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="external-source-link">View on ${escapeHtml(raw.source || label)} →</a>
      `;
    }
    container.appendChild(card);
  });
}

async function applyWorksFilters() {
  if (!currentAuthorId) return;
  worksPage = 1;
  const sortBy = document.getElementById("worksSortBy")?.value || "publication_date";
  const sortOrder = document.getElementById("worksSortOrder")?.value || "desc";
  const yearFrom = document.getElementById("worksYearFrom")?.value || "";
  const yearTo = document.getElementById("worksYearTo")?.value || "";
  const minCit = document.getElementById("worksMinCitations")?.value || "";
  
  // Check if quality ranking is selected
  const isQualityRank = sortBy === "quality_rank";
  
  let url;
  if (isQualityRank) {
    // Use ranked endpoint for quality ranking
    url = `${API_BASE}/api/author/${encodeURIComponent(currentAuthorId)}/works/ranked?page=1&per_page=${perPage}`;
  } else {
    // Use regular endpoint for other sorting
    url = `${API_BASE}/api/author/${encodeURIComponent(currentAuthorId)}/works?page=1&per_page=${perPage}&sort_by=${sortBy}&sort_order=${sortOrder}`;
  }
  
  if (yearFrom) url += `&year_from=${yearFrom}`;
  if (yearTo) url += `&year_to=${yearTo}`;
  if (minCit) url += `&min_citations=${minCit}`;
  
  setLoading(worksList, worksLoading, true);
  loadMoreWrap.classList.add("hidden");
  emptyWorks.classList.add("hidden");
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Failed");
    const data = await r.json();
    worksTotal = data.meta?.count ?? 0;
    worksList.innerHTML = "";
    setLoading(worksList, worksLoading, false);
    appendWorks(data.results || [], isQualityRank);
    if ((data.results || []).length === 0) emptyWorks.classList.remove("hidden");
    else if (worksTotal > perPage) loadMoreWrap.classList.remove("hidden");
  } catch (e) {
    setLoading(worksList, worksLoading, false);
    emptyWorks.classList.remove("hidden");
    emptyWorks.textContent = "Could not load papers.";
  }
}

function appendWorks(works, isRanked = false) {
  works.forEach((w) => {
    const meta = [w.publication_year, w.venue, w.cited_by_count != null && w.cited_by_count > 0 ? `${w.cited_by_count} citations` : null].filter(Boolean);
    const card = document.createElement("div");
    card.className = "work-card";
    const workSaved = isWorkSaved(w.id);
    
    // Build rank badge if this is a ranked result
    let rankBadgeHtml = "";
    if (isRanked && w.rank) {
      rankBadgeHtml = `<div class="rank-badge-small">#${w.rank}</div>`;
    }
    
    // Build integrity badge if available
    let integrityBadgeHtml = "";
    if (isRanked && w.integrity) {
      const riskLevel = w.integrity.risk_level || "MEDIUM";
      integrityBadgeHtml = `<span class="integrity-badge integrity-${riskLevel.toLowerCase()}">${riskLevel}</span>`;
    }
    
    // Build quality score if available
    let qualityScoreHtml = "";
    if (isRanked && w.final_score != null) {
      qualityScoreHtml = `
        <div class="work-quality-score">
          <span class="quality-score-value">${w.final_score.toFixed(1)}</span>
          <span class="quality-score-label">Quality</span>
        </div>
      `;
    }
    
    // Build authors display
    let authorsHtml = "";
    if (w.authors && w.authors.length > 0) {
      const authorsList = w.authors.slice(0, 3).join(", ") + (w.authors.length > 3 ? " et al." : "");
      authorsHtml = `<div class="work-authors">${escapeHtml(authorsList)}</div>`;
    }
    
    // Build rank explanation if available
    let rankExplanationHtml = "";
    if (isRanked && w.rank_explanation) {
      rankExplanationHtml = `
        <div class="work-rank-explanation">
          <strong>Why this rank:</strong> ${escapeHtml(w.rank_explanation)}
        </div>
      `;
    }
    
    // Build integrity flags if available
    let integrityFlagsHtml = "";
    if (isRanked && w.integrity && w.integrity.flags && w.integrity.flags.length > 0) {
      integrityFlagsHtml = `
        <div class="work-integrity-flags">
          <strong>⚠️ Issues:</strong> ${escapeHtml(w.integrity.flags.join(", "))}
        </div>
      `;
    }
    
    // Build LLM scores if available
    let llmScoresHtml = "";
    if (isRanked && w.llm && w.llm.quality_score != null) {
      llmScoresHtml = `
        <div class="work-llm-scores">
          <span class="work-llm-score">Quality: ${w.llm.quality_score}/10</span>
          <span class="work-llm-score">Credibility: ${w.llm.credibility_score}/10</span>
          <span class="work-llm-score">Relevance: ${w.llm.relevance_score}/10</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      ${rankBadgeHtml}
      ${qualityScoreHtml}
      <h4 class="work-title" title="${escapeHtml(w.title || "Untitled")}">${escapeHtml(w.title || "Untitled")}</h4>
      ${authorsHtml}
      <div class="work-meta">
        ${w.publication_year ? `<span class="work-year">${escapeHtml(String(w.publication_year))}</span>` : ""}
        ${w.venue ? `<span class="work-venue">${escapeHtml(w.venue)}</span>` : ""}
        ${w.cited_by_count > 0 ? `<span class="work-citations">${w.cited_by_count} cited</span>` : ""}
        ${integrityBadgeHtml}
      </div>
      ${w.doi ? `<div class="work-doi"><a href="https://doi.org/${w.doi.replace(/^https?:\/\/doi\.org\//i, "")}" target="_blank" rel="noopener">${escapeHtml(w.doi)}</a></div>` : ""}
      ${rankExplanationHtml}
      ${integrityFlagsHtml}
      ${llmScoresHtml}
      <div class="work-actions">
        <button type="button" class="btn-summary" data-work-id="${escapeHtml(w.id)}">Assessment Summary</button>
        <button type="button" class="btn-save btn-save-work ${workSaved ? "saved" : ""}" data-save-work-id="${escapeHtml(w.id)}" title="${workSaved ? "Remove from saved" : "Save paper"}">${workSaved ? "Saved" : "Save"}</button>
      </div>
    `;
    const btn = card.querySelector(".btn-summary");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSummaryModal(w.id, w.title || "Untitled");
    });
    const saveBtn = card.querySelector(".btn-save-work");
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isWorkSaved(w.id)) removeSavedWork(w.id);
      else saveWork(w);
    });
    worksList.appendChild(card);
  });
}

function openSummaryModal(workId, title) {
  currentChatWorkId = workId;
  summaryModal.classList.remove("hidden");
  summaryModal.setAttribute("aria-hidden", "false");
  summaryModalLoading.classList.remove("hidden");
  summaryModalContentWrap.classList.add("hidden");
  summaryModalContent.innerHTML = "";
  chatMessages.innerHTML = "";
  summaryModalError.classList.add("hidden");
  summaryModalError.textContent = "";
  document.getElementById("summaryModalTitle").textContent = "Assessment Summary";

  fetch(`${API_BASE}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work_id: workId }),
  })
    .then(async (r) => {
      let data;
      try {
        data = await r.json();
      } catch (_) {
        data = { detail: r.statusText || "Request failed" };
      }
      return { ok: r.ok, data };
    })
    .then(({ ok, data }) => {
      summaryModalLoading.classList.add("hidden");
      if (ok) {
        summaryModalContent.innerHTML = `
          <p class="modal-summary-title">${escapeHtml(data.title || title)}</p>
          <div class="modal-summary">${formatSummaryForDisplay(data.summary || "")}</div>
        `;
        summaryModalContentWrap.classList.remove("hidden");
      } else {
        const msg = Array.isArray(data.detail) ? data.detail.map((o) => o.msg || o).join(" ") : (data.detail || data.message || "Failed to generate summary.");
        summaryModalError.textContent = msg;
        summaryModalError.classList.remove("hidden");
      }
    })
    .catch((err) => {
      summaryModalLoading.classList.add("hidden");
      summaryModalError.textContent = err.message || "Network error. Use set HF_TOKEN=hf_xxxxxxxx for AI summaries (free at huggingface.co/settings/tokens).";
      summaryModalError.classList.remove("hidden");
    });
}

function closeSummaryModal() {
  summaryModal.classList.add("hidden");
  summaryModal.setAttribute("aria-hidden", "true");
}

function appendChatMessage(question, answer, isPending) {
  const wrap = document.createElement("div");
  wrap.className = "chat-msg-wrap";
  wrap.innerHTML = `
    <div class="chat-msg chat-msg-user">${escapeHtml(question)}</div>
    <div class="chat-msg chat-msg-bot">${isPending ? '<span class="chat-pending">Thinking…</span>' : formatSummaryForDisplay(answer)}</div>
  `;
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateLastChatAnswer(text) {
  const wraps = chatMessages.querySelectorAll(".chat-msg-wrap");
  const last = wraps[wraps.length - 1];
  if (last) {
    const botMsg = last.querySelector(".chat-msg-bot");
    if (botMsg) botMsg.innerHTML = formatSummaryForDisplay(text);
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
  const text = (chatInput.value || "").trim();
  if (!text || !currentChatWorkId) return;
  chatInput.value = "";
  appendChatMessage(text, "", true);
  chatSendBtn.disabled = true;
  fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work_id: currentChatWorkId, message: text }),
  })
    .then(async (r) => {
      let data;
      try {
        data = await r.json();
      } catch (_) {
        data = { detail: r.statusText || "Request failed" };
      }
      return { ok: r.ok, data };
    })
    .then(({ ok, data }) => {
      chatSendBtn.disabled = false;
      if (ok) {
        updateLastChatAnswer(data.answer || "No response.");
      } else {
        const msg = Array.isArray(data.detail) ? data.detail.map((o) => o.msg || o).join(" ") : (data.detail || data.message || "Failed to get answer.");
        updateLastChatAnswer("Error: " + msg);
      }
    })
    .catch((err) => {
      chatSendBtn.disabled = false;
      updateLastChatAnswer("Error: " + (err.message || "Network error."));
    });
}

chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

summaryModalClose.addEventListener("click", closeSummaryModal);
summaryModal.addEventListener("click", (e) => {
  if (e.target === summaryModal) closeSummaryModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!document.getElementById("compareModal").classList.contains("hidden")) closeCompareModal();
  else if (!summaryModal.classList.contains("hidden")) closeSummaryModal();
});

async function loadMoreWorks() {
  if (!currentAuthorId) return;
  worksPage += 1;
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Loading…";
  try {
    const r = await fetch(
      `${API_BASE}/api/author/${encodeURIComponent(currentAuthorId)}/works?page=${worksPage}&per_page=${perPage}`
    );
    if (!r.ok) throw new Error("Failed");
    const data = await r.json();
    appendWorks(data.results || []);
    if (worksList.querySelectorAll(".work-card").length >= worksTotal) {
      loadMoreWrap.classList.add("hidden");
    }
  } finally {
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load more";
  }
}

function renderSavedContent() {
  const savedAuthors = getSavedAuthors();
  const savedWorks = getSavedWorks();
  const savedAuthorsList = document.getElementById("savedAuthorsList");
  const savedWorksList = document.getElementById("savedWorksList");
  const savedContent = document.getElementById("savedContent");
  const emptySaved = document.getElementById("emptySaved");

  if (savedAuthors.length === 0 && savedWorks.length === 0) {
    savedContent.classList.add("hidden");
    emptySaved.classList.remove("hidden");
    return;
  }
  savedContent.classList.remove("hidden");
  emptySaved.classList.add("hidden");

  savedAuthorsList.innerHTML = "";
  savedAuthors.forEach((author) => {
    const item = document.createElement("div");
    item.className = "saved-item saved-author-item";
    const meta = [
      author.works_count != null && `${author.works_count} papers`,
      author.cited_by_count != null && author.cited_by_count > 0 && `${author.cited_by_count} citations`,
      author.h_index != null && `h-index ${author.h_index}`,
      author.institution,
    ].filter(Boolean);
    item.innerHTML = `
      <div class="saved-item-main">
        <button type="button" class="saved-item-link">${escapeHtml(author.display_name)}</button>
        <span class="saved-item-meta">${escapeHtml(meta.join(" · "))}</span>
      </div>
      <button type="button" class="btn-unsave" title="Remove from saved">×</button>
    `;
    item.querySelector(".saved-item-link").addEventListener("click", () => {
      document.querySelectorAll(".icon-nav-btn[data-tab]").forEach((b) => b.classList.remove("active"));
      document.querySelector(".icon-nav-btn[data-tab='search']")?.classList.add("active");
      openProfile(author.id);
    });
    item.querySelector(".btn-unsave").addEventListener("click", () => removeSavedAuthor(author.id));
    savedAuthorsList.appendChild(item);
  });

  savedWorksList.innerHTML = "";
  savedWorks.forEach((work) => {
    const item = document.createElement("div");
    item.className = "saved-item saved-work-item";
    const meta = [
      work.publication_year && String(work.publication_year),
      work.venue,
      work.cited_by_count > 0 && `${work.cited_by_count} cited`,
    ].filter(Boolean);
    item.innerHTML = `
      <div class="saved-item-main">
        <span class="saved-item-title">${escapeHtml(work.title)}</span>
        <span class="saved-item-meta">${escapeHtml(meta.join(" · "))}</span>
      </div>
      <div class="saved-work-actions">
        <button type="button" class="btn-summary btn-sm" data-work-id="${escapeHtml(work.id)}" title="View assessment summary">Summary</button>
        <button type="button" class="btn-unsave" title="Remove from saved">×</button>
      </div>
    `;
    item.querySelector(".btn-summary").addEventListener("click", (e) => {
      e.stopPropagation();
      openSummaryModal(work.id, work.title);
    });
    item.querySelector(".btn-unsave").addEventListener("click", () => removeSavedWork(work.id));
    savedWorksList.appendChild(item);
  });
}

function openCompareModal() {
  const modal = document.getElementById("compareModal");
  const faculty1Label = document.getElementById("compareFaculty1Label");
  const faculty2Label = document.getElementById("compareFaculty2Label");
  const pickerPanel = document.getElementById("comparePickerPanel");
  const pickerTitle = document.getElementById("comparePickerTitle");
  const pickerSearch = document.getElementById("comparePickerSearch");
  const pickerList = document.getElementById("comparePickerList");
  const compareSearchInput = document.getElementById("compareSearchInput");
  const compareSearchBtn = document.getElementById("compareSearchBtn");
  const closePickerBtn = document.getElementById("compareClosePicker");
  const runBtn = document.getElementById("compareRunBtn");
  const loadingEl = document.getElementById("compareModalLoading");
  const resultEl = document.getElementById("compareResult");
  const compareGrid = document.getElementById("compareGrid");
  const assessmentEl = document.getElementById("compareAssessment");
  const errorEl = document.getElementById("compareModalError");
  const compareChatMessages = document.getElementById("compareChatMessages");
  const compareChatInput = document.getElementById("compareChatInput");
  const compareChatSend = document.getElementById("compareChatSend");

  let faculty1 = null;
  let faculty2 = null;
  let currentPickerSlot = null;
  let lastCompareAssessment = null;
  let lastCompareAuthor1Id = null;
  let lastCompareAuthor2Id = null;

  faculty1Label.textContent = "— Select —";
  faculty2Label.textContent = "— Select —";
  faculty1 = null;
  faculty2 = null;
  pickerPanel.classList.add("hidden");
  runBtn.classList.add("hidden");
  resultEl.classList.add("hidden");
  loadingEl.classList.add("hidden");
  assessmentEl.innerHTML = "";
  compareGrid.innerHTML = "";
  const chartsElReset = document.getElementById("compareCharts");
  const chartsTitleElReset = document.getElementById("compareChartsTitle");
  if (chartsElReset) { chartsElReset.innerHTML = ""; chartsElReset.classList.add("hidden"); }
  if (chartsTitleElReset) chartsTitleElReset.classList.add("hidden");
  compareChatMessages.innerHTML = "";
  errorEl.classList.add("hidden");
  errorEl.textContent = "";
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  function updateRunButton() {
    if (faculty1 && faculty2) runBtn.classList.remove("hidden");
    else runBtn.classList.add("hidden");
  }

  function selectFaculty(slot, author) {
    const id = author.id;
    const name = author.display_name || "Unknown";
    if (slot === 1) {
      faculty1 = { id, display_name: name };
      faculty1Label.textContent = name;
    } else {
      faculty2 = { id, display_name: name };
      faculty2Label.textContent = name;
    }
    pickerPanel.classList.add("hidden");
    updateRunButton();
  }

  function openPicker(slot, source) {
    currentPickerSlot = slot;
    pickerTitle.textContent = `Select Faculty ${slot}`;
    pickerSearch.classList.toggle("hidden", source !== "search");
    pickerList.innerHTML = "";
    if (source === "saved") {
      const saved = getSavedAuthors();
      if (saved.length === 0) {
        pickerList.innerHTML = "<p class=\"compare-empty-hint\">No saved authors. Save from search first.</p>";
      } else {
        saved.forEach((a) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "compare-author-btn";
          btn.textContent = `${a.display_name}${a.institution ? ` · ${a.institution}` : ""}`;
          btn.addEventListener("click", () => selectFaculty(slot, a));
          pickerList.appendChild(btn);
        });
      }
    } else {
      compareSearchInput.value = "";
    }
    pickerPanel.classList.remove("hidden");
  }

  async function onCompareSearch() {
    const q = compareSearchInput.value.trim();
    if (q.length < 2) return;
    pickerList.innerHTML = "<div class=\"loading\">Searching…</div>";
    try {
      const r = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error("Search failed");
      const data = await r.json();
      pickerList.innerHTML = "";
      if (!data.results || data.results.length === 0) {
        pickerList.innerHTML = "<p class=\"empty-state\">No researchers found.</p>";
      } else {
        data.results.forEach((author) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "compare-author-btn";
          btn.textContent = `${author.display_name}${author.institution ? ` · ${author.institution}` : ""}`;
          btn.addEventListener("click", () => selectFaculty(currentPickerSlot, author));
          pickerList.appendChild(btn);
        });
      }
    } catch (e) {
      pickerList.innerHTML = `<p class="modal-error">${escapeHtml(e.message)}</p>`;
    }
  }

  async function runCompare() {
    if (!faculty1 || !faculty2) return;
    loadingEl.classList.remove("hidden");
    resultEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    try {
      const r = await fetch(`${API_BASE}/api/compare-authors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_id_1: faculty1.id, author_id_2: faculty2.id }),
      });
      let data;
      try {
        data = await r.json();
      } catch (_) {
        data = { detail: r.statusText || "Request failed" };
      }
      loadingEl.classList.add("hidden");
      if (r.ok) {
        lastCompareAssessment = data.assessment;
        lastCompareAuthor1Id = faculty1.id;
        lastCompareAuthor2Id = faculty2.id;
        const a1 = data.author_1;
        const a2 = data.author_2;
        compareGrid.innerHTML = `
          <div class="compare-col">
            <h4 class="compare-name">${escapeHtml(a1.display_name)}</h4>
            <p class="compare-inst">${escapeHtml(a1.institutions || "—")}</p>
            <div class="compare-stats">
              <div class="stat"><span class="stat-value">${a1.works_count ?? "—"}</span><span class="stat-label">Publications</span></div>
              <div class="stat"><span class="stat-value">${a1.cited_by_count ?? "—"}</span><span class="stat-label">Citations</span></div>
              <div class="stat"><span class="stat-value">${a1.h_index ?? "—"}</span><span class="stat-label">h-index</span></div>
              <div class="stat"><span class="stat-value">${a1.i10_index ?? "—"}</span><span class="stat-label">i10-index</span></div>
            </div>
          </div>
          <div class="compare-col">
            <h4 class="compare-name">${escapeHtml(a2.display_name)}</h4>
            <p class="compare-inst">${escapeHtml(a2.institutions || "—")}</p>
            <div class="compare-stats">
              <div class="stat"><span class="stat-value">${a2.works_count ?? "—"}</span><span class="stat-label">Publications</span></div>
              <div class="stat"><span class="stat-value">${a2.cited_by_count ?? "—"}</span><span class="stat-label">Citations</span></div>
              <div class="stat"><span class="stat-value">${a2.h_index ?? "—"}</span><span class="stat-label">h-index</span></div>
              <div class="stat"><span class="stat-value">${a2.i10_index ?? "—"}</span><span class="stat-label">i10-index</span></div>
            </div>
          </div>
        `;
        const chartsEl = document.getElementById("compareCharts");
        const w1 = Number(a1.works_count) || 0, w2 = Number(a2.works_count) || 0;
        const c1 = Number(a1.cited_by_count) || 0, c2 = Number(a2.cited_by_count) || 0;
        const h1 = Number(a1.h_index) || 0, h2 = Number(a2.h_index) || 0;
        const i1 = Number(a1.i10_index) || 0, i2 = Number(a2.i10_index) || 0;
        const maxW = Math.max(w1, w2, 1), maxC = Math.max(c1, c2, 1), maxH = Math.max(h1, h2, 1), maxI = Math.max(i1, i2, 1);
        chartsEl.innerHTML = `
          <div class="compare-chart">
            <div class="compare-chart-label">Publications</div>
            <div class="compare-chart-bars">
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a1.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-1" style="width:${(w1 / maxW) * 100}%"></div></div><span class="compare-bar-num">${w1}</span></div>
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a2.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-2" style="width:${(w2 / maxW) * 100}%"></div></div><span class="compare-bar-num">${w2}</span></div>
            </div>
          </div>
          <div class="compare-chart">
            <div class="compare-chart-label">Citations</div>
            <div class="compare-chart-bars">
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a1.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-1" style="width:${(c1 / maxC) * 100}%"></div></div><span class="compare-bar-num">${c1}</span></div>
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a2.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-2" style="width:${(c2 / maxC) * 100}%"></div></div><span class="compare-bar-num">${c2}</span></div>
            </div>
          </div>
          <div class="compare-chart">
            <div class="compare-chart-label">h-index</div>
            <div class="compare-chart-bars">
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a1.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-1" style="width:${(h1 / maxH) * 100}%"></div></div><span class="compare-bar-num">${h1}</span></div>
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a2.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-2" style="width:${(h2 / maxH) * 100}%"></div></div><span class="compare-bar-num">${h2}</span></div>
            </div>
          </div>
          <div class="compare-chart">
            <div class="compare-chart-label">i10-index</div>
            <div class="compare-chart-bars">
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a1.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-1" style="width:${(i1 / maxI) * 100}%"></div></div><span class="compare-bar-num">${i1}</span></div>
              <div class="compare-bar-wrap"><span class="compare-bar-label">${escapeHtml(a2.display_name)}</span><div class="compare-bar"><div class="compare-bar-fill compare-bar-2" style="width:${(i2 / maxI) * 100}%"></div></div><span class="compare-bar-num">${i2}</span></div>
            </div>
          </div>
        `;
        chartsEl.classList.remove("hidden");
        const chartsTitleEl = document.getElementById("compareChartsTitle");
        if (chartsTitleEl) chartsTitleEl.classList.remove("hidden");
        const printBtn = document.getElementById("comparePrintBtn");
        printBtn.onclick = () => openPrintView("compare", {
          name1: a1.display_name, name2: a2.display_name,
          inst1: a1.institutions, inst2: a2.institutions,
          w1: a1.works_count, w2: a2.works_count, c1: a1.cited_by_count, c2: a2.cited_by_count,
          h1: a1.h_index, h2: a2.h_index, i1: a1.i10_index, i2: a2.i10_index,
          assessment: data.assessment,
        });
        assessmentEl.innerHTML = formatSummaryForDisplay(data.assessment || "");
        compareChatMessages.innerHTML = "";
        resultEl.classList.remove("hidden");
      } else {
        const msg = Array.isArray(data.detail) ? data.detail.map((o) => o.msg || o).join(" ") : (data.detail || data.message || "Failed to compare.");
        errorEl.textContent = msg;
        errorEl.classList.remove("hidden");
      }
    } catch (e) {
      loadingEl.classList.add("hidden");
      errorEl.textContent = e.message || "Network error.";
      errorEl.classList.remove("hidden");
    }
  }

  function appendCompareChatMessage(question, answer, isPending) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg-wrap";
    wrap.innerHTML = `
      <div class="chat-msg chat-msg-user">${escapeHtml(question)}</div>
      <div class="chat-msg chat-msg-bot">${isPending ? "<span class=\"chat-pending\">Thinking…</span>" : formatSummaryForDisplay(answer)}</div>
    `;
    compareChatMessages.appendChild(wrap);
    compareChatMessages.scrollTop = compareChatMessages.scrollHeight;
  }

  function updateLastCompareChatAnswer(text) {
    const wraps = compareChatMessages.querySelectorAll(".chat-msg-wrap");
    const last = wraps[wraps.length - 1];
    if (last) {
      const botMsg = last.querySelector(".chat-msg-bot");
      if (botMsg) botMsg.innerHTML = formatSummaryForDisplay(text);
    }
    compareChatMessages.scrollTop = compareChatMessages.scrollHeight;
  }

  function sendCompareChat() {
    const text = (compareChatInput.value || "").trim();
    if (!text || !lastCompareAssessment) return;
    compareChatInput.value = "";
    appendCompareChatMessage(text, "", true);
    compareChatSend.disabled = true;
    fetch(`${API_BASE}/api/chat-compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_id_1: lastCompareAuthor1Id,
        author_id_2: lastCompareAuthor2Id,
        assessment: lastCompareAssessment,
        message: text,
      }),
    })
      .then(async (r) => {
        let data;
        try {
          data = await r.json();
        } catch (_) {
          data = { detail: r.statusText || "Request failed" };
        }
        return { ok: r.ok, data };
      })
      .then(({ ok, data }) => {
        compareChatSend.disabled = false;
        if (ok) updateLastCompareChatAnswer(data.answer || "No response.");
        else updateLastCompareChatAnswer("Error: " + (data.detail || data.message || "Failed."));
      })
      .catch((err) => {
        compareChatSend.disabled = false;
        updateLastCompareChatAnswer("Error: " + (err.message || "Network error."));
      });
  }

  document.querySelectorAll(".compare-pick-btn").forEach((btn) => {
    btn.addEventListener("click", () => openPicker(parseInt(btn.dataset.slot, 10), btn.dataset.source));
  });
  closePickerBtn.addEventListener("click", () => pickerPanel.classList.add("hidden"));
  compareSearchBtn.onclick = onCompareSearch;
  compareSearchInput.onkeydown = (e) => { if (e.key === "Enter") onCompareSearch(); };
  runBtn.onclick = runCompare;
  compareChatSend.onclick = sendCompareChat;
  compareChatInput.onkeydown = (e) => { if (e.key === "Enter") sendCompareChat(); };
}

function closeCompareModal() {
  const modal = document.getElementById("compareModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if (document.querySelector(".icon-nav-btn[data-tab='compare']")?.classList.contains("active")) {
    document.querySelectorAll(".icon-nav-btn[data-tab]").forEach((b) => b.classList.remove("active"));
    document.querySelector(".icon-nav-btn[data-tab='search']")?.classList.add("active");
    showSearch();
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    if (tab === "search") showSearch();
    else if (tab === "saved") showSaved();
    else if (tab === "compare") showCompareTab();
    else if (tab === "batch") showBatch();
    else if (tab === "dashboard") showDashboard();
  });
});

document.getElementById("worksApplyFilters").addEventListener("click", applyWorksFilters);

// Rank Papers button - automatically select quality rank and apply
document.getElementById("rankPapersBtn")?.addEventListener("click", () => {
  const sortBySelect = document.getElementById("worksSortBy");
  if (sortBySelect) {
    sortBySelect.value = "quality_rank";
    applyWorksFilters();
  }
});

document.getElementById("exportSavedCsvBtn").addEventListener("click", () => {
  const authors = getSavedAuthors();
  const works = getSavedWorks();
  const rows = [
    ["Type", "Name/Title", "Publications", "Citations", "h-index", "Institution/Venue", "Year"],
    ...authors.map((a) => ["Author", a.display_name, a.works_count ?? "", a.cited_by_count ?? "", a.h_index ?? "", a.institution ?? "", ""]),
    ...works.map((w) => ["Paper", w.title, "", w.cited_by_count ?? "", "", w.venue ?? "", w.publication_year ?? ""]),
  ];
  downloadCsv("saved_export.csv", rows);
});

let lastBatchResults = null;
let pendingSelections = [];

document.getElementById("batchRunBtn").addEventListener("click", async () => {
  const text = (document.getElementById("batchNamesInput").value || "").trim();
  const names = text.split(/\n/).map((n) => n.trim()).filter(Boolean).slice(0, 50);
  if (names.length === 0) return;
  const loadingEl = document.getElementById("batchLoading");
  const resultEl = document.getElementById("batchResult");
  const errorEl = document.getElementById("batchError");
  const selectionEl = document.getElementById("batchSelection");
  
  loadingEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  if (selectionEl) selectionEl.classList.add("hidden");
  
  try {
    const r = await fetch(`${API_BASE}/api/batch-faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    const data = await r.json();
    loadingEl.classList.add("hidden");
    if (!r.ok) throw new Error(data.detail || "Request failed");
    
    // Check if there are names that need selection
    if (data.needs_selection && data.needs_selection.length > 0) {
      pendingSelections = data.needs_selection;
      lastBatchResults = data.results || [];
      showBatchSelectionUI(data.needs_selection, data.results);
      return;
    }
    
    lastBatchResults = data.results || [];
    displayBatchResults(lastBatchResults);
    resultEl.classList.remove("hidden");
  } catch (e) {
    loadingEl.classList.add("hidden");
    errorEl.textContent = e.message || "Request failed.";
    errorEl.classList.remove("hidden");
  }
});

function showBatchSelectionUI(needsSelection, confirmedResults) {
  console.log("needsSelection:", needsSelection); // Debug log
  
  const selectionEl = document.getElementById("batchSelection");
  if (!selectionEl) {
    // Create selection UI if it doesn't exist
    const batchSection = document.getElementById("batchSection");
    const selectionDiv = document.createElement("div");
    selectionDiv.id = "batchSelection";
    selectionDiv.className = "batch-selection";
    batchSection.insertBefore(selectionDiv, document.getElementById("batchResult"));
  }
  
  const selectionContainer = document.getElementById("batchSelection");
  
  console.log("Building HTML for", needsSelection.length, "names"); // Debug log
  
  const html = `
    <div class="batch-selection-header">
      <h3>Multiple Matches Found</h3>
      <p>Please select the correct researcher for each name:</p>
    </div>
    <div class="batch-selection-list">
      ${needsSelection.map((item, index) => {
        console.log(`Name ${index}:`, item.name_requested, "has", item.options.length, "options"); // Debug log
        return `
        <div class="batch-selection-item" data-index="${index}">
          <div class="batch-selection-name">
            <strong>${escapeHtml(item.name_requested)}</strong>
            <span class="batch-selection-count">${item.options.length} matches found</span>
          </div>
          <div class="batch-selection-options">
            ${item.options.map((option, optIndex) => {
              console.log(`  Option ${optIndex}:`, option.display_name); // Debug log
              return `
              <label class="batch-selection-option">
                <input type="radio" name="selection-${index}" value="${optIndex}" ${optIndex === 0 ? 'checked' : ''}>
                <div class="batch-selection-option-content">
                  <div class="batch-selection-option-name">${escapeHtml(option.display_name)}</div>
                  <div class="batch-selection-option-meta">
                    ${option.institution ? escapeHtml(option.institution) + ' · ' : ''}
                    ${option.works_count || 0} publications · 
                    ${option.cited_by_count || 0} citations · 
                    h-index: ${option.h_index || 0}
                  </div>
                </div>
              </label>
            `;
            }).join('')}
          </div>
        </div>
      `;
      }).join('')}
    </div>
    <div class="batch-selection-actions">
      <button type="button" id="batchConfirmSelections" class="search-btn">Confirm Selections</button>
      <button type="button" id="batchCancelSelections" class="back-btn">Cancel</button>
    </div>
  `;
  
  selectionContainer.innerHTML = html;
  selectionContainer.classList.remove("hidden");
  
  // Add event listeners
  document.getElementById("batchConfirmSelections").addEventListener("click", () => {
    const selectedResults = [];
    needsSelection.forEach((item, index) => {
      const selected = document.querySelector(`input[name="selection-${index}"]:checked`);
      if (selected) {
        const optIndex = parseInt(selected.value);
        const option = item.options[optIndex];
        selectedResults.push({
          name_requested: item.name_requested,
          found: true,
          author_id: option.author_id,
          display_name: option.display_name,
          works_count: option.works_count,
          cited_by_count: option.cited_by_count,
          h_index: option.h_index,
          i10_index: option.i10_index,
          institution: option.institution,
        });
      }
    });
    
    lastBatchResults = [...confirmedResults, ...selectedResults];
    displayBatchResults(lastBatchResults);
    selectionContainer.classList.add("hidden");
    document.getElementById("batchResult").classList.remove("hidden");
  });
  
  document.getElementById("batchCancelSelections").addEventListener("click", () => {
    selectionContainer.classList.add("hidden");
  });
}

function displayBatchResults(results) {
  const wrap = document.getElementById("batchTableWrap");
  wrap.innerHTML = "<table class=\"batch-table\"><thead><tr><th>Name requested</th><th>Matched name</th><th>Institution</th><th>Publications</th><th>Citations</th><th>h-index</th><th>i10-index</th></tr></thead><tbody>" +
    results.map((row) => "<tr>" +
      "<td>" + escapeHtml(row.name_requested) + "</td>" +
      "<td>" + (row.found ? escapeHtml(row.display_name || "—") : "<em>Not found</em>") + "</td>" +
      "<td>" + escapeHtml(row.institution || "—") + "</td>" +
      "<td>" + (row.works_count ?? "—") + "</td>" +
      "<td>" + (row.cited_by_count ?? "—") + "</td>" +
      "<td>" + (row.h_index ?? "—") + "</td>" +
      "<td>" + (row.i10_index ?? "—") + "</td>" +
      "</tr>").join("") + "</tbody></table>";
}
document.getElementById("batchExportCsvBtn").addEventListener("click", () => {
  if (!lastBatchResults || lastBatchResults.length === 0) return;
  const rows = [
    ["Name requested", "Matched name", "Institution", "Publications", "Citations", "h-index", "i10-index"],
    ...lastBatchResults.map((r) => [
      r.name_requested,
      r.found ? (r.display_name || "") : "Not found",
      r.institution || "",
      r.works_count ?? "",
      r.cited_by_count ?? "",
      r.h_index ?? "",
      r.i10_index ?? "",
    ]),
  ];
  downloadCsv("batch_faculty_summary.csv", rows);
});

// CSV Upload and Dashboard Functions
async function handleCsvUpload(file) {
  if (!file) return;
  
  try {
    let facultyNames = [];
    
    // Check file type
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      // Handle CSV/TXT files
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
      
      // Try to parse CSV (handle comma-separated values)
      facultyNames = lines.map(line => {
        // Split by comma and take first column
        const parts = line.split(',');
        return parts[0].trim();
      }).filter(name => name && !name.toLowerCase().includes('name') && !name.toLowerCase().includes('faculty'));
      
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // For Excel files, show instructions
      alert("Excel files are not directly supported. Please:\n\n1. Open your Excel file\n2. Copy the column with faculty names\n3. Paste it into a text editor (Notepad)\n4. Save as .txt or .csv file\n5. Upload that file\n\nOR\n\nIn Excel: File → Save As → Choose 'CSV (Comma delimited)' format");
      return;
    } else {
      alert("Please upload a CSV or TXT file with faculty names (one per line).");
      return;
    }
    
    if (facultyNames.length === 0) {
      alert("No faculty names found in file. Make sure each name is on a separate line.");
      return;
    }
    
    if (facultyNames.length > 100) {
      alert(`Found ${facultyNames.length} names. Maximum 100 allowed. Only the first 100 will be analyzed.`);
      facultyNames = facultyNames.slice(0, 100);
    }
    
    console.log("Found faculty names:", facultyNames); // Debug
    
    const dashboardLoading = document.getElementById("dashboardLoading");
    const statsGrid = document.getElementById("statsGrid");
    
    dashboardLoading.classList.remove("hidden");
    statsGrid.classList.add("hidden");
    dashboardStats.classList.remove("hidden");
    
    console.log("Analyzing", facultyNames.length, "faculty members..."); // Debug
    
    const response = await fetch(`${API_BASE}/api/batch-faculty-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faculty_names: facultyNames }),
    });
    
    console.log("Response status:", response.status); // Debug
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Received data:", data); // Debug
    
    dashboardLoading.classList.add("hidden");
    populateDashboardStats(data);
    statsGrid.classList.remove("hidden");
    
  } catch (e) {
    console.error("CSV upload error:", e); // Debug
    alert("Error processing file: " + (e.message || "Unknown error"));
    document.getElementById("dashboardLoading").classList.add("hidden");
    dashboardStats.classList.add("hidden");
  }
}

let lastDashboardData = null;

function populateDashboardStats(data) {
  lastDashboardData = data; // Store for export
  const stats = data.department_stats;
  const statsGrid = document.getElementById("statsGrid");
  
  let html = `
    <div class="stat-card">
      <div class="stat-value">${stats.faculty_found}/${stats.total_faculty}</div>
      <div class="stat-label">Faculty Found</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.total_publications}</div>
      <div class="stat-label">Total Publications</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.total_citations}</div>
      <div class="stat-label">Total Citations</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avg_publications.toFixed(1)}</div>
      <div class="stat-label">Avg Publications/Faculty</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avg_citations.toFixed(1)}</div>
      <div class="stat-label">Avg Citations/Faculty</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avg_h_index.toFixed(1)}</div>
      <div class="stat-label">Avg h-index</div>
    </div>
  `;
  
  // Add faculty detail cards
  if (data.faculty && data.faculty.length > 0) {
    html += `<div style="grid-column: 1/-1; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);"><h3 style="margin: 0 0 15px 0;">Faculty Details</h3></div>`;
    data.faculty.forEach(f => {
      if (!f.error) {
        html += `
          <div class="stat-card">
            <div style="font-weight: 600;">${escapeHtml(f.name)}</div>
            <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 5px;">
              Pubs: ${f.works_count} | Citations: ${f.cited_by_count} | h-index: ${f.h_index ?? "—"}
            </div>
          </div>
        `;
      }
    });
  }
  
  statsGrid.innerHTML = html;
}

document.getElementById("compareModalClose").addEventListener("click", closeCompareModal);
document.getElementById("compareModal").addEventListener("click", (e) => {
  if (e.target.id === "compareModal") closeCompareModal();
});

initTheme();

searchBtn.addEventListener("click", doSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});
backToSearch.addEventListener("click", () => {
  goBackToResults();
});
backToResults.addEventListener("click", () => {
  goBackToResults();
});
loadMoreBtn.addEventListener("click", loadMoreWorks);
downloadPdfBtn.addEventListener("click", downloadAccreditationPdf);

// CSV Dashboard Event Listeners
csvPickBtn.addEventListener("click", () => {
  csvFileInput.click();
});

csvFileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    handleCsvUpload(e.target.files[0]);
  }
});

// Drag and drop support
csvUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  csvUploadArea.style.opacity = "0.5";
});

csvUploadArea.addEventListener("dragleave", () => {
  csvUploadArea.style.opacity = "1";
});

csvUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  csvUploadArea.style.opacity = "1";
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleCsvUpload(e.dataTransfer.files[0]);
  }
});

// Back button handler for dashboard
document.getElementById("backFromDashboard")?.addEventListener("click", () => {
  document.querySelectorAll(".icon-nav-btn[data-tab]").forEach((b) => b.classList.remove("active"));
  document.querySelector(".icon-nav-btn[data-tab='search']")?.classList.add("active");
  showSearch();
});

// Export dashboard report button
document.getElementById("exportDashboardBtn")?.addEventListener("click", () => {
  if (!lastDashboardData || !lastDashboardData.faculty) {
    alert("No dashboard data to export. Please upload a CSV file first.");
    return;
  }
  
  const stats = lastDashboardData.department_stats;
  const rows = [
    ["Department Dashboard Report"],
    [""],
    ["Summary Statistics"],
    ["Total Faculty", stats.total_faculty],
    ["Faculty Found", stats.faculty_found],
    ["Total Publications", stats.total_publications],
    ["Total Citations", stats.total_citations],
    ["Avg Publications/Faculty", stats.avg_publications],
    ["Avg Citations/Faculty", stats.avg_citations],
    ["Avg h-index", stats.avg_h_index],
    [""],
    ["Faculty Details"],
    ["Name", "Publications", "Citations", "h-index", "i10-index"],
    ...lastDashboardData.faculty.map(f => [
      f.name,
      f.works_count || 0,
      f.cited_by_count || 0,
      f.h_index ?? "—",
      f.i10_index ?? "—"
    ])
  ];
  
  downloadCsv("department_dashboard_report.csv", rows);
});


// Browser back button support
window.addEventListener("popstate", (e) => {
  if (e.state && e.state.view) {
    switch (e.state.view) {
      case "search":
        showSearch();
        break;
      case "results":
        showResults();
        break;
      case "profile":
        if (e.state.authorId) {
          openProfile(e.state.authorId);
        }
        break;
      default:
        showSearch();
    }
  }
});

// Update history when navigating
const originalShowResults = showResults;
showResults = function() {
  originalShowResults();
  if (window.history.state?.view !== "results") {
    window.history.pushState({ view: "results" }, "", "#results");
  }
};

const originalShowProfile = showProfile;
showProfile = function() {
  originalShowProfile();
  if (currentAuthorId && window.history.state?.authorId !== currentAuthorId) {
    window.history.pushState({ view: "profile", authorId: currentAuthorId }, "", `#profile/${currentAuthorId}`);
  }
};

const originalShowSearch = showSearch;
showSearch = function() {
  originalShowSearch();
  if (window.history.state?.view !== "search") {
    window.history.pushState({ view: "search" }, "", "#search");
  }
};


// ===== RANK PAPERS BY TOPIC =====

async function searchPapersByTopic() {
  const topic = rankTopicInput.value.trim();
  if (topic.length < 2) {
    alert("Please enter at least 2 characters");
    return;
  }

  rankResults.classList.remove("hidden");
  rankEmptyState.classList.add("hidden");
  rankPapersList.innerHTML = "";
  rankLoading.classList.remove("hidden");
  rankResultsTitle.textContent = `Searching for "${topic}"...`;
  rankStats.textContent = "";

  const enableLlm = true; // Always enable AI evaluation
  const yearFrom = rankYearFrom.value;
  const yearTo = rankYearTo.value;

  try {
    const params = new URLSearchParams({
      topic: topic,
      per_page: 25,
      enable_llm: enableLlm
    });
    
    if (yearFrom) params.append("year_from", yearFrom);
    if (yearTo) params.append("year_to", yearTo);

    const response = await fetch(`${API_BASE}/api/search/papers?${params}`);
    if (!response.ok) throw new Error("Search failed");
    
    const data = await response.json();
    rankLoading.classList.add("hidden");

    if (!data.results || data.results.length === 0) {
      rankResults.classList.add("hidden");
      rankEmptyState.classList.remove("hidden");
      return;
    }

    rankResultsTitle.textContent = `Top Ranked Papers for "${topic}"`;
    rankStats.innerHTML = `
      <span>Found ${data.meta.count} papers</span>
      <span>•</span>
      <span>Showing top ${data.results.length}</span>
      <span>•</span>
      <span>${data.llm_enabled ? 'AI Evaluation: ON' : 'AI Evaluation: OFF'}</span>
    `;

    renderRankedPapers(data.results);
  } catch (error) {
    rankLoading.classList.add("hidden");
    rankResults.classList.add("hidden");
    rankEmptyState.classList.remove("hidden");
    rankEmptyState.textContent = `Error: ${error.message}. Please try again.`;
  }
}

function renderRankedPapers(papers) {
  rankPapersList.innerHTML = "";

  papers.forEach((paper) => {
    const card = document.createElement("div");
    card.className = "rank-paper-card";

    // Rank badge
    const rankBadge = document.createElement("div");
    rankBadge.className = "rank-badge-large";
    rankBadge.textContent = `#${paper.rank}`;

    // Integrity badge
    const integrityBadge = document.createElement("span");
    const riskLevel = paper.integrity?.risk_level || "MEDIUM";
    integrityBadge.className = `integrity-badge integrity-${riskLevel.toLowerCase()}`;
    integrityBadge.textContent = riskLevel;

    // Score
    const scoreDiv = document.createElement("div");
    scoreDiv.className = "rank-score";
    scoreDiv.innerHTML = `
      <div class="rank-score-value">${paper.final_score?.toFixed(1) || "N/A"}</div>
      <div class="rank-score-label">Quality Score</div>
    `;

    // Title
    const title = document.createElement("h3");
    title.className = "rank-paper-title";
    title.textContent = paper.title || "Untitled";

    // Authors and year
    const meta = document.createElement("div");
    meta.className = "rank-paper-meta";
    const authors = paper.authors && paper.authors.length > 0 
      ? paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "")
      : "Unknown authors";
    meta.textContent = `${authors} (${paper.year || "N/A"})`;

    // Venue
    const venue = document.createElement("div");
    venue.className = "rank-paper-venue";
    venue.textContent = paper.venue || "Unknown venue";

    // Citations
    const citations = document.createElement("div");
    citations.className = "rank-paper-citations";
    citations.innerHTML = `<strong>${paper.cited_by_count || 0}</strong> citations`;

    // Explanation
    const explanation = document.createElement("div");
    explanation.className = "rank-explanation-box";
    explanation.innerHTML = `<strong>Why this rank:</strong> ${paper.rank_explanation || "No explanation available"}`;

    // Integrity flags
    if (paper.integrity && paper.integrity.flags && paper.integrity.flags.length > 0) {
      const flagsDiv = document.createElement("div");
      flagsDiv.className = "rank-integrity-flags";
      flagsDiv.innerHTML = `<strong>⚠️ Integrity Issues:</strong> ${paper.integrity.flags.join(", ")}`;
      card.appendChild(flagsDiv);
    }

    // LLM scores - with better messaging
    if (paper.llm) {
      const llmScores = document.createElement("div");
      llmScores.className = "rank-llm-scores";
      
      // Check if LLM evaluation actually ran or if these are default scores
      const isDefaultScore = paper.llm.quality_score === 5 && 
                            paper.llm.credibility_score === 5 && 
                            paper.llm.relevance_score === 5;
      
      const isCreditIssue = paper.llm.reason && 
                           (paper.llm.reason.includes("credit") || 
                            paper.llm.reason.includes("quota") || 
                            paper.llm.reason.includes("balance") ||
                            paper.llm.reason.includes("PRO"));
      
      if (isDefaultScore && isCreditIssue) {
        llmScores.innerHTML = `
          <div class="rank-llm-disabled rank-llm-credit-warning">
            <span class="rank-llm-icon">⚠️</span>
            <span class="rank-llm-message">${escapeHtml(paper.llm.reason)}</span>
          </div>
          <div class="rank-llm-note">Papers are ranked by citations, recency, and integrity analysis. Visit <a href="https://huggingface.co/pricing" target="_blank">HuggingFace Pricing</a> to add credits.</div>
        `;
      } else if (isDefaultScore) {
        llmScores.innerHTML = `
          <div class="rank-llm-disabled">
            <span class="rank-llm-icon">ℹ️</span>
            <span class="rank-llm-message">AI Evaluation: ${escapeHtml(paper.llm.reason)}</span>
          </div>
          <div class="rank-llm-note">Papers are ranked by citations, recency, and integrity analysis.</div>
        `;
      } else {
        llmScores.innerHTML = `
          <div class="rank-llm-score">
            <span class="rank-llm-label">Quality:</span>
            <span class="rank-llm-value">${paper.llm.quality_score}/10</span>
          </div>
          <div class="rank-llm-score">
            <span class="rank-llm-label">Credibility:</span>
            <span class="rank-llm-value">${paper.llm.credibility_score}/10</span>
          </div>
          <div class="rank-llm-score">
            <span class="rank-llm-label">Relevance:</span>
            <span class="rank-llm-value">${paper.llm.relevance_score}/10</span>
          </div>
        `;
        
        if (paper.llm.suspicious) {
          const suspiciousWarning = document.createElement("div");
          suspiciousWarning.className = "rank-suspicious-warning";
          suspiciousWarning.textContent = "⚠️ Flagged as potentially suspicious";
          llmScores.appendChild(suspiciousWarning);
        }
      }
      
      card.appendChild(llmScores);
    }

    // DOI link
    if (paper.doi) {
      const doiLink = document.createElement("a");
      doiLink.href = paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`;
      doiLink.target = "_blank";
      doiLink.className = "rank-doi-link";
      doiLink.textContent = "View Paper →";
      card.appendChild(doiLink);
    }

    // Assemble card
    card.appendChild(rankBadge);
    card.appendChild(integrityBadge);
    card.appendChild(scoreDiv);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(venue);
    card.appendChild(citations);
    card.appendChild(explanation);

    rankPapersList.appendChild(card);
  });
}

// Event listeners for rank tab
rankSearchBtn?.addEventListener("click", searchPapersByTopic);
rankTopicInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchPapersByTopic();
});

// Tab/Icon navigation switching
document.querySelectorAll(".icon-nav-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".icon-nav-btn[data-tab]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    if (tab === "search") showSearch();
    else if (tab === "rank") showRank();
    else if (tab === "saved") showSaved();
    else if (tab === "compare") showCompareTab();
    else if (tab === "batch") showBatch();
    else if (tab === "dashboard") showDashboard();
  });
});
