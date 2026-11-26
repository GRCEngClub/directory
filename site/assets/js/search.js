(function () {
  var searchInput = document.getElementById("search-input");
  var sortSelect = document.getElementById("sort-select");
  var filterOptionInput = document.querySelector(".filter-option-input");
  var cards = Array.from(document.querySelectorAll(".engineer-card"));
  var cardGrid = document.querySelector(".directory .card-grid");
  var chips = Array.from(document.querySelectorAll(".chip"));
  var clearButtons = Array.from(document.querySelectorAll("[data-clear-filters]"));
  var compactClear = document.querySelector("[data-compact-clear]");
  var compactPillsEl = document.querySelector("[data-compact-pills]");
  var compactNounEl = document.querySelector("[data-compact-noun]");
  var countEl = document.getElementById("results-count");
  var compactCountEl = document.querySelector("[data-compact-results]");
  var noResults = document.getElementById("no-results");
  var summaryEl = document.getElementById("active-filters-summary");
  var pillsEl = document.getElementById("active-filter-pills");
  var presetButtons = Array.from(document.querySelectorAll(".filter-preset"));
  var showMoreWrap = document.querySelector("[data-show-more]");
  var showMoreBtn = showMoreWrap ? showMoreWrap.querySelector("button") : null;
  var showMoreStatus = showMoreWrap ? showMoreWrap.querySelector("[data-show-more-status]") : null;

  // Render matching rows in pages so the list stays scannable as it grows.
  // Without JS every row is shown; filtering or searching starts from page one.
  var PAGE_SIZE = 30;
  var pageLimit = PAGE_SIZE;
  var matchFlags = [];

  var FILTER_KEYS = ["specializations", "frameworks", "languages", "available", "certifications"];
  var activeFilters = {};
  FILTER_KEYS.forEach(function (k) { activeFilters[k] = []; });

  /* --- Chip lookup cache: O(1) instead of querySelector per chip --- */
  var chipCache = {};
  chips.forEach(function (chip) {
    var group = chip.closest("[data-filter]");
    if (!group) return;
    var key = group.dataset.filter + ":" + chip.dataset.value;
    chipCache[key] = chip;
  });

  function getChip(filterKey, value) {
    return chipCache[filterKey + ":" + value] || null;
  }

  /* --- Badge element cache --- */
  var badgeCache = {};
  FILTER_KEYS.forEach(function (key) {
    var group = document.querySelector('.filter-group[data-group="' + key + '"]');
    if (group) badgeCache[key] = group.querySelector(".count-badge");
  });

  /* --- Pre-parse card data (avoids re-splitting on every filter) --- */
  var cardData = cards.map(function (card) {
    var parsed = {};
    FILTER_KEYS.forEach(function (k) {
      var attr = k === "available" ? "available" : k;
      parsed[k] = (card.dataset[attr] || "").split(",").filter(Boolean);
    });
    parsed.name = card.dataset.name || "";
    parsed.title = card.dataset.title || "";
    parsed.company = card.dataset.company || "";
    parsed.location = card.dataset.location || "";
    parsed.profileDepth = parseInt(card.dataset.profileDepth || "0", 10);
    parsed.hasAvailability = parsed.available.length > 0 ? 1 : 0;
    parsed.allText = [
      parsed.name,
      parsed.title,
      parsed.company,
      parsed.location
    ].concat(FILTER_KEYS.map(function (k) { return parsed[k].join(" "); })).join(" ");
    return parsed;
  });

  /* --- Debounce helper --- */
  function debounce(fn, delay) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  /* --- Show/hide cards immediately: filtering is high-frequency, so no fades --- */
  function hideCard(card) {
    card.hidden = true;
  }

  function showCard(card) {
    card.hidden = false;
  }

  /* --- Tag layout: matched tags first, then the rest, capped per group --- */
  var tagGroups = cards.map(function (card) {
    return Array.from(card.querySelectorAll("[data-tag-group]")).map(function (group) {
      var list = group.querySelector(".card-tags");
      return {
        list: list,
        limit: parseInt(group.dataset.limit || "3", 10),
        tags: list ? Array.from(list.querySelectorAll(".tag[data-value]")) : [],
        more: list ? list.querySelector(".tag-more") : null
      };
    }).filter(function (group) { return group.list; });
  });

  function layoutTags(cardIndex) {
    tagGroups[cardIndex].forEach(function (group) {
      var matched = [];
      var rest = [];
      group.tags.forEach(function (tag) {
        var active = activeFilters[tag.dataset.key] || [];
        var isMatch = active.indexOf(tag.dataset.value) !== -1;
        tag.classList.toggle("is-match", isMatch);
        if (isMatch) matched.push(tag);
        else if (!tag.hasAttribute("data-match-only")) rest.push(tag);
        else tag.hidden = true;
      });
      var ordered = matched.concat(rest);
      var limit = Math.max(group.limit, matched.length);
      ordered.forEach(function (tag, i) {
        tag.hidden = i >= limit;
        group.list.insertBefore(tag, group.more);
      });
      if (group.more) {
        var overflow = ordered.length - Math.min(ordered.length, limit);
        group.more.hidden = overflow <= 0;
        group.more.textContent = "+" + overflow;
      }
    });
  }

  var _skipUrlSync = false;

  function sortCards() {
    if (!cardGrid || !sortSelect) return;

    var mode = sortSelect.value || "name";
    var indexed = cards.map(function (card, index) {
      return { card: card, data: cardData[index], index: index };
    });

    indexed.sort(function (a, b) {
      if (mode === "available") {
        if (b.data.hasAvailability !== a.data.hasAvailability) return b.data.hasAvailability - a.data.hasAvailability;
      } else if (mode === "profileDepth") {
        if (b.data.profileDepth !== a.data.profileDepth) return b.data.profileDepth - a.data.profileDepth;
      }

      return a.data.name.localeCompare(b.data.name) || a.index - b.index;
    });

    indexed.forEach(function (item) {
      cardGrid.appendChild(item.card);
    });
  }

  // Show the first `pageLimit` matches in current sort order; hide the rest.
  // Returns the first row revealed beyond `previouslyShown`, for focus.
  function renderPage(previouslyShown) {
    var order = cardGrid ? Array.from(cardGrid.children) : cards;
    var shown = 0;
    var total = 0;
    var firstNew = null;

    order.forEach(function (card) {
      var i = cards.indexOf(card);
      if (i === -1) return;
      if (matchFlags[i]) {
        total++;
        if (shown < pageLimit) {
          showCard(card);
          layoutTags(i);
          if (previouslyShown !== undefined && shown === previouslyShown) firstNew = card;
          shown++;
          return;
        }
      }
      hideCard(card);
    });

    if (showMoreWrap) {
      var rest = total - shown;
      showMoreWrap.hidden = rest <= 0;
      if (showMoreBtn) showMoreBtn.textContent = "Show " + Math.min(PAGE_SIZE, rest) + " more";
      if (showMoreStatus) showMoreStatus.textContent = "Showing " + shown + " of " + total;
    }

    return { shown: shown, firstNew: firstNew };
  }

  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", function () {
      var before = Math.min(pageLimit, matchFlags.filter(Boolean).length);
      pageLimit += PAGE_SIZE;
      var result = renderPage(before);
      // Keep keyboard and screen reader users at the newly revealed rows.
      var link = result.firstNew && result.firstNew.querySelector(".card-name");
      if (link) link.focus({ preventScroll: false });
    });
  }

  function updateCards() {
    var query = (searchInput.value || "").toLowerCase().trim();
    var visible = 0;

    sortCards();
    pageLimit = PAGE_SIZE;

    cards.forEach(function (card, i) {
      var data = cardData[i];
      var show = true;

      if (query && data.allText.indexOf(query) === -1) show = false;

      for (var fi = 0; show && fi < FILTER_KEYS.length; fi++) {
        var key = FILTER_KEYS[fi];
        if (activeFilters[key].length > 0) {
          var vals = data[key];
          var has = activeFilters[key].some(function (v) { return vals.indexOf(v) !== -1; });
          if (!has) show = false;
        }
      }

      matchFlags[i] = show;
      if (show) visible++;
    });

    renderPage();

    if (countEl) countEl.textContent = visible;
    if (compactCountEl) compactCountEl.textContent = visible;
    if (compactNounEl) {
      compactNounEl.textContent = visible === 1 ? compactNounEl.dataset.singular : compactNounEl.dataset.plural;
    }
    if (noResults) noResults.hidden = visible !== 0;

    if (!_skipUrlSync) syncFiltersToUrl();
    updateSummary();
    updateBadgeCounts();
    updatePresetStates();
  }

  /* --- Filter workbench --- */
  var groupHeaders = Array.from(document.querySelectorAll(".filter-group-header"));
  var mobileTabs = createMobileTabs();

  function createMobileTabs() {
    var groups = document.querySelector(".filter-groups");
    if (!groups || !groupHeaders.length || document.querySelector(".filter-mobile-tabs")) return [];

    var tabs = document.createElement("div");
    tabs.className = "filter-mobile-tabs";
    tabs.setAttribute("aria-label", "Filter categories");

    groupHeaders.forEach(function (header) {
      var group = header.closest(".filter-group");
      if (!group) return;

      var label = header.querySelector("span") ? header.querySelector("span").textContent : header.textContent.trim();
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "filter-mobile-tab";
      tab.dataset.group = group.dataset.group || "";
      tab.textContent = label;
      tab.addEventListener("click", function () {
        setOpenGroup(group);
      });
      tabs.appendChild(tab);
    });

    groups.parentNode.insertBefore(tabs, groups);
    return Array.from(tabs.querySelectorAll(".filter-mobile-tab"));
  }

  function syncWorkbenchTabs() {
    var openGroup = document.querySelector(".filter-group.open");
    if (!openGroup) return;

    mobileTabs.forEach(function (tab) {
      var isActive = tab.dataset.group === openGroup.dataset.group;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function filterOptionChips() {
    var query = filterOptionInput ? filterOptionInput.value.toLowerCase().trim() : "";
    var openGroup = document.querySelector(".filter-group.open");
    if (!openGroup) return;

    Array.from(openGroup.querySelectorAll(".chip")).forEach(function (chip) {
      chip.classList.toggle("option-hidden", Boolean(query) && chip.textContent.toLowerCase().indexOf(query) === -1);
    });
  }

  function setOpenGroup(group) {
    if (!group) return;
    document.querySelectorAll(".filter-group.open").forEach(function (openGroup) {
      if (openGroup !== group) {
        openGroup.classList.remove("open");
        var openHeader = openGroup.querySelector(".filter-group-header");
        if (openHeader) openHeader.setAttribute("aria-expanded", "false");
      }
    });
    group.classList.add("open");
    var header = group.querySelector(".filter-group-header");
    if (header) header.setAttribute("aria-expanded", "true");
    if (filterOptionInput) filterOptionInput.value = "";
    document.querySelectorAll(".chip.option-hidden").forEach(function (chip) {
      chip.classList.remove("option-hidden");
    });
    syncWorkbenchTabs();
  }

  groupHeaders.forEach(function (header) {
    header.addEventListener("click", function () {
      var group = header.closest(".filter-group");
      setOpenGroup(group);
    });
  });

  if (filterOptionInput) {
    filterOptionInput.addEventListener("input", filterOptionChips);
  }

  /* --- Active filter pills: rendered in the palette and in the always-visible bar --- */
  function buildPills(container, pills) {
    if (!container) return;
    var fragment = document.createDocumentFragment();
    pills.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "active-filter-pill";
      btn.dataset.filterKey = p.key;
      btn.dataset.filterValue = p.value;
      btn.setAttribute("aria-label", "Remove filter: " + p.label);
      var text = document.createElement("span");
      text.textContent = p.label;
      var x = document.createElement("span");
      x.className = "pill-x";
      x.setAttribute("aria-hidden", "true");
      x.textContent = "\u00d7";
      btn.appendChild(text);
      btn.appendChild(x);
      fragment.appendChild(btn);
    });
    container.textContent = "";
    container.appendChild(fragment);
  }

  function updateSummary() {
    var pills = [];
    FILTER_KEYS.forEach(function (key) {
      activeFilters[key].forEach(function (val) {
        var chip = getChip(key, val);
        if (chip) pills.push({ key: key, value: val, label: chip.textContent.trim() });
      });
    });

    var hasActive = pills.length > 0;
    var hasQuery = Boolean(searchInput && searchInput.value.trim());
    if (summaryEl) summaryEl.hidden = !hasActive;
    buildPills(pillsEl, pills);
    buildPills(compactPillsEl, pills);
    if (compactClear) compactClear.hidden = !(hasActive || hasQuery);
  }

  function removeFilter(e) {
    var pill = e.target.closest(".active-filter-pill");
    if (!pill) return;
    var key = pill.dataset.filterKey;
    var value = pill.dataset.filterValue;
    var chip = getChip(key, value);
    if (chip) {
      chip.classList.remove("active");
      chip.setAttribute("aria-pressed", "false");
    }
    var idx = activeFilters[key].indexOf(value);
    if (idx !== -1) activeFilters[key].splice(idx, 1);
    updateCards();
  }

  if (pillsEl) pillsEl.addEventListener("click", removeFilter);
  if (compactPillsEl) compactPillsEl.addEventListener("click", removeFilter);

  /* --- Badge counts on group headers --- */
  function updateBadgeCounts() {
    FILTER_KEYS.forEach(function (key) {
      var badge = badgeCache[key];
      if (!badge) return;
      var count = activeFilters[key].length;
      badge.textContent = count;
      badge.hidden = count === 0;
    });
  }

  /* --- URL-based filter persistence --- */
  function syncFiltersToUrl() {
    var params = new URLSearchParams();
    var query = searchInput.value.trim();
    if (query) params.set("q", query);
    if (sortSelect && sortSelect.value && sortSelect.value !== "name") params.set("sort", sortSelect.value);
    Object.keys(activeFilters).forEach(function(key) {
      if (activeFilters[key].length) {
        params.set(key, activeFilters[key].join(","));
      }
    });
    var search = params.toString() ? "?" + params.toString() : "";
    history.replaceState(null, "", window.location.pathname + search + window.location.hash);
    try { sessionStorage.setItem("directoryQuery", search); } catch (e) {}
  }

  function restoreFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) searchInput.value = q;
    var sort = params.get("sort");
    if (sort && sortSelect && sortSelect.querySelector('option[value="' + sort.replace(/[^a-zA-Z]/g, "") + '"]')) {
      sortSelect.value = sort;
    }
    FILTER_KEYS.forEach(function(key) {
      var val = params.get(key);
      if (val) {
        // Only accept values that exist as filter options; anything else in
        // the URL is ignored (and never rendered).
        activeFilters[key] = val.split(",").map(function (v) {
          return v.trim().toLowerCase();
        }).filter(function (v) {
          return Boolean(getChip(key, v));
        });
        activeFilters[key].forEach(function(v) {
          var chip = getChip(key, v);
          if (chip) {
            chip.classList.add("active");
            chip.setAttribute("aria-pressed", "true");
          }
        });
        // Auto-expand groups that have active filters
        var group = document.querySelector('.filter-group[data-group="' + key + '"]');
        if (group && activeFilters[key].length && !document.querySelector(".filter-group.open .chip.active")) {
          setOpenGroup(group);
        }
      }
    });
    if (!document.querySelector(".filter-group.open")) {
      setOpenGroup(document.querySelector(".filter-group"));
    }
    _skipUrlSync = true;
    updateCards();
    _skipUrlSync = false;
    try { sessionStorage.setItem("directoryQuery", window.location.search); } catch (e) {}
  }

  function parsePresetValues(value) {
    return (value || "").split("|").map(function (item) {
      return item.trim().toLowerCase();
    }).filter(Boolean);
  }

  function syncChipState() {
    chips.forEach(function (chip) {
      var group = chip.closest("[data-filter]");
      if (!group) return;

      var key = group.dataset.filter;
      var isActive = activeFilters[key].indexOf(chip.dataset.value) !== -1;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function applyPreset(preset) {
    searchInput.value = "";
    FILTER_KEYS.forEach(function (key) {
      activeFilters[key] = parsePresetValues(preset.dataset[key]);
    });
    syncChipState();

    var firstActiveKey = FILTER_KEYS.find(function (key) {
      return activeFilters[key].length > 0;
    });
    if (firstActiveKey) {
      setOpenGroup(document.querySelector('.filter-group[data-group="' + firstActiveKey + '"]'));
    }

    updateCards();
  }

  function updatePresetStates() {
    presetButtons.forEach(function (preset) {
      var hasPreset = false;
      var matches = true;

      FILTER_KEYS.forEach(function (key) {
        var values = parsePresetValues(preset.dataset[key]);
        if (values.length) hasPreset = true;

        values.forEach(function (value) {
          if (activeFilters[key].indexOf(value) === -1) matches = false;
        });
      });

      preset.classList.toggle("active", hasPreset && matches);
      preset.setAttribute("aria-pressed", hasPreset && matches ? "true" : "false");
    });
  }

  /* --- Chip click --- */
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.closest("[data-filter]");
      if (!group) return;
      var filterKey = group.dataset.filter;
      var value = chip.dataset.value;

      var idx = activeFilters[filterKey].indexOf(value);
      if (idx !== -1) {
        activeFilters[filterKey].splice(idx, 1);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeFilters[filterKey].push(value);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }

      updateCards();
    });
  });

  presetButtons.forEach(function (preset) {
    preset.addEventListener("click", function () {
      applyPreset(preset);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", debounce(updateCards, 150));
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", updateCards);
  }

  function clearAll() {
    searchInput.value = "";
    FILTER_KEYS.forEach(function (key) { activeFilters[key] = []; });
    syncChipState();
    updateCards();
  }

  clearButtons.forEach(function (btn) {
    btn.addEventListener("click", clearAll);
  });

  /* --- Restore filters from URL on load --- */
  restoreFiltersFromUrl();
})();
