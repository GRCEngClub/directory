(function () {
  var searchInput = document.getElementById("search");
  var cardGrid = document.querySelector(".chapters-directory .card-grid");
  var resultCount = document.getElementById("result-count");
  var noResults = document.getElementById("no-results");
  if (!cardGrid) return;

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
    var attr = card.getAttribute("data-" + key) || "";
    return attr.indexOf(value) !== -1;
  }

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : "");
    var visible = 0;

    cards.forEach(function (card) {
      var show =
        matchesSearch(card, query) &&
        matchesFilter(card, "status", activeFilters.status) &&
        matchesFilter(card, "region", activeFilters.region);

      card.classList.toggle("hidden", !show);
      if (show) visible += 1;
    });

    if (resultCount) resultCount.textContent = String(visible);
    if (noResults) noResults.style.display = visible ? "none" : "block";
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll(".filter-chips[data-filter]"),
    function (group) {
      var key = group.getAttribute("data-filter");
      Array.prototype.forEach.call(group.querySelectorAll(".filter-chip"), function (chip) {
        chip.addEventListener("click", function () {
          var value = chip.getAttribute("data-value");
          var isActive = chip.classList.contains("active");

          Array.prototype.forEach.call(group.querySelectorAll(".filter-chip"), function (other) {
            other.classList.remove("active");
          });

          if (isActive) {
            activeFilters[key] = null;
          } else {
            chip.classList.add("active");
            activeFilters[key] = value;
          }

          applyFilters();
        });
      });
    }
  );

  applyFilters();
})();
