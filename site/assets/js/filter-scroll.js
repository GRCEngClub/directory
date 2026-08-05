(function () {
  var filters = document.querySelector(".filters");
  if (!filters) return;

  var panel = filters.querySelector(".filters-expanded-panel");
  var searchInput = filters.querySelector("#search-input");
  var backdrop = filters.querySelector("[data-filter-dismiss]");
  var toggleButtons = Array.from(filters.querySelectorAll("[data-filter-toggle]"));
  var shortcutLabels = Array.from(filters.querySelectorAll(".filter-shortcut"));
  if (!toggleButtons.length) return;
  var manuallyCollapsed = true;
  var lastTrigger = null;
  var inertedElements = [];

  shortcutLabels.forEach(function (label) {
    label.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  });

  function isTypingTarget(target) {
    if (!target) return false;
    var tag = target.tagName ? target.tagName.toLowerCase() : "";
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function getFocusableElements() {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) {
      return element.offsetParent !== null;
    });
  }

  function setBackgroundInert(shouldBeInert) {
    if (!shouldBeInert) {
      inertedElements.forEach(function (element) {
        element.inert = false;
      });
      inertedElements = [];
      return;
    }

    if (inertedElements.length) return;
    var node = filters;
    while (node.parentElement && node.parentElement !== document.documentElement) {
      Array.from(node.parentElement.children).forEach(function (sibling) {
        if (sibling !== node && sibling.tagName !== "SCRIPT" && !sibling.inert) {
          sibling.inert = true;
          inertedElements.push(sibling);
        }
      });
      node = node.parentElement;
    }
  }

  function setCollapsed(collapsed, restoreFocus) {
    manuallyCollapsed = collapsed;
    filters.classList.toggle("filters-collapsed", collapsed);
    filters.classList.remove("filters-hidden");
    document.body.classList.toggle("filter-palette-open", !collapsed);
    setBackgroundInert(!collapsed);

    toggleButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });

    if (panel) {
      panel.setAttribute("aria-hidden", collapsed ? "true" : "false");
      panel.setAttribute("tabindex", "-1");
      if (collapsed) {
        panel.removeAttribute("role");
        panel.removeAttribute("aria-modal");
        panel.removeAttribute("aria-label");
      } else {
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", "Search and filter directory");
      }
    }

    if (!collapsed) {
      window.requestAnimationFrame(function () {
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else if (panel) {
          panel.focus();
        }
      });
    } else if (restoreFocus && lastTrigger) {
      lastTrigger.focus();
    }
  }

  function openPalette(trigger) {
    if (trigger) lastTrigger = trigger;
    if (manuallyCollapsed) {
      setCollapsed(false, false);
    } else if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function closePalette(restoreFocus) {
    if (!manuallyCollapsed) setCollapsed(true, restoreFocus !== false);
  }

  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (manuallyCollapsed) {
        openPalette(button);
      } else {
        closePalette(true);
      }
    });
  });

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      closePalette(true);
    });
  }

  document.addEventListener("keydown", function (event) {
    var commandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
    var slashShortcut = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;

    if (commandShortcut || (slashShortcut && !isTypingTarget(event.target))) {
      event.preventDefault();
      openPalette(document.querySelector(".filter-command-trigger"));
      return;
    }

    if (event.key === "Escape" && !manuallyCollapsed) {
      event.preventDefault();
      closePalette(true);
      return;
    }

    if (event.key === "Tab" && !manuallyCollapsed) {
      var focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        if (panel) panel.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      var activeElement = document.activeElement;
      var activeIndex = focusable.indexOf(activeElement);

      if (!panel.contains(activeElement) || activeIndex === -1) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  setCollapsed(true, false);
  filters.classList.add("filter-palette-ready");
})();
