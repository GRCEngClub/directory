(function () {
  var filterRoot = document.getElementById("chapter-filters");
  var searchInput = document.getElementById("search-input");
  var cardGrid = document.querySelector(".chapters-directory .card-grid");
  var resultCount = document.getElementById("result-count");
  var compactResultCount = filterRoot ? filterRoot.querySelector("[data-compact-results]") : null;
  var noResults = document.getElementById("no-results");
  var compactPills = filterRoot ? filterRoot.querySelector("[data-compact-pills]") : null;
  var compactClear = filterRoot ? filterRoot.querySelector("[data-compact-clear]") : null;
  var compactNoun = filterRoot ? filterRoot.querySelector("[data-compact-noun]") : null;
  if (!filterRoot || !cardGrid) return;

  var cards = Array.prototype.slice.call(cardGrid.querySelectorAll(".chapter-card"));
  var activeFilters = {
    status: null,
    region: null
  };

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function matchesSearch(card, query) {
    if (!query) return true;
    var haystack = [
      card.getAttribute("data-city"),
      card.getAttribute("data-region"),
      card.getAttribute("data-country"),
      card.getAttribute("data-status"),
      card.getAttribute("data-leads"),
      card.getAttribute("data-roles")
    ].join(" ").toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function matchesFilter(card, key, value) {
    if (!value) return true;
    return normalize(card.getAttribute("data-" + key)) === value;
  }

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : "");
    var visible = 0;

    cards.forEach(function (card) {
      var show =
        matchesSearch(card, query) &&
        matchesFilter(card, "status", activeFilters.status) &&
        matchesFilter(card, "region", activeFilters.region);

      card.hidden = !show;
      if (show) visible += 1;
    });

    if (resultCount) resultCount.textContent = String(visible);
    if (compactResultCount) compactResultCount.textContent = String(visible);
    if (noResults) noResults.hidden = visible !== 0;
    if (compactNoun) compactNoun.textContent = visible === 1 ? compactNoun.dataset.singular : compactNoun.dataset.plural;
    renderPills(query);
  }

  function chipFor(key, value) {
    var group = filterRoot.querySelector('.filter-chips[data-filter="' + key + '"]');
    if (!group) return null;
    return Array.prototype.find.call(group.querySelectorAll(".chip"), function (chip) {
      return normalize(chip.getAttribute("data-value")) === value;
    }) || null;
  }

  function renderPills(query) {
    if (!compactPills) return;
    compactPills.textContent = "";
    var count = 0;
    Object.keys(activeFilters).forEach(function (key) {
      var value = activeFilters[key];
      var chip = value ? chipFor(key, value) : null;
      if (!chip) return;
      count += 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "active-filter-pill";
      btn.setAttribute("data-filter-key", key);
      btn.setAttribute("aria-label", "Remove filter: " + chip.textContent.trim());
      var text = document.createElement("span");
      text.textContent = chip.textContent.trim();
      var x = document.createElement("span");
      x.className = "pill-x";
      x.setAttribute("aria-hidden", "true");
      x.textContent = "\u00d7";
      btn.appendChild(text);
      btn.appendChild(x);
      compactPills.appendChild(btn);
    });
    if (compactClear) compactClear.hidden = !(count || query);
  }

  function clearFilter(key) {
    activeFilters[key] = null;
    Array.prototype.forEach.call(filterRoot.querySelectorAll('.filter-chips[data-filter="' + key + '"] .chip'), function (chip) {
      chip.classList.remove("active");
      chip.setAttribute("aria-pressed", "false");
    });
  }

  if (compactPills) {
    compactPills.addEventListener("click", function (event) {
      var pill = event.target.closest(".active-filter-pill");
      if (!pill) return;
      clearFilter(pill.getAttribute("data-filter-key"));
      applyFilters();
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-clear-filters]"), function (btn) {
    btn.addEventListener("click", function () {
      Object.keys(activeFilters).forEach(clearFilter);
      if (searchInput) searchInput.value = "";
      applyFilters();
    });
  });

  function syncMobileTabs() {
    var openGroup = filterRoot.querySelector(".filter-group.open");
    Array.prototype.forEach.call(filterRoot.querySelectorAll(".filter-mobile-tab"), function (tab) {
      var isActive = openGroup && tab.getAttribute("data-group") === openGroup.getAttribute("data-group");
      tab.classList.toggle("active", Boolean(isActive));
      tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function setOpenGroup(group) {
    if (!group) return;
    Array.prototype.forEach.call(filterRoot.querySelectorAll(".filter-group"), function (other) {
      var isOpen = other === group;
      other.classList.toggle("open", isOpen);
      var header = other.querySelector(".filter-group-header");
      if (header) header.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    syncMobileTabs();
  }

  function createMobileTabs() {
    var groups = filterRoot.querySelector(".filter-groups");
    var headers = filterRoot.querySelectorAll(".filter-group-header");
    if (!groups || !headers.length || filterRoot.querySelector(".filter-mobile-tabs")) return;

    var tabs = document.createElement("div");
    tabs.className = "filter-mobile-tabs";
    tabs.setAttribute("aria-label", "Chapter filter categories");

    Array.prototype.forEach.call(headers, function (header) {
      var group = header.closest(".filter-group");
      if (!group) return;
      var label = header.querySelector("span");
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "filter-mobile-tab";
      tab.setAttribute("data-group", group.getAttribute("data-group") || "");
      tab.setAttribute("aria-pressed", "false");
      tab.textContent = label ? label.textContent : header.textContent.trim();
      tab.addEventListener("click", function () {
        setOpenGroup(group);
      });
      tabs.appendChild(tab);
    });

    groups.parentNode.insertBefore(tabs, groups);
    syncMobileTabs();
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  Array.prototype.forEach.call(filterRoot.querySelectorAll(".filter-group-header"), function (header) {
    header.addEventListener("click", function () {
      setOpenGroup(header.closest(".filter-group"));
    });
  });

  Array.prototype.forEach.call(filterRoot.querySelectorAll(".filter-chips[data-filter]"), function (group) {
    var key = group.getAttribute("data-filter");
    Array.prototype.forEach.call(group.querySelectorAll(".chip"), function (chip) {
      chip.addEventListener("click", function () {
        var value = normalize(chip.getAttribute("data-value"));
        var isActive = chip.classList.contains("active");

        Array.prototype.forEach.call(group.querySelectorAll(".chip"), function (other) {
          other.classList.remove("active");
          other.setAttribute("aria-pressed", "false");
        });

        if (isActive) {
          activeFilters[key] = null;
        } else {
          chip.classList.add("active");
          chip.setAttribute("aria-pressed", "true");
          activeFilters[key] = value;
        }

        applyFilters();
      });
    });
  });

  createMobileTabs();
  applyFilters();
})();
