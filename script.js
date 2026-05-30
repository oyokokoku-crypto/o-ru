(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealGroups = [
    [".value-panel", 0],
    [".value-panel .section-heading", 0],
    [".value-card", 1],
    [".value-cta", 0],
    [".compare-panel", 0],
    [".compare-head", 0],
    [".compare-card", 1],
    [".compare-note", 0],
    [".works-head", 0],
    [".works-list-hero", 0],
    [".work-card", 1],
    [".works-source", 0],
    [".service-panel", 0],
    [".service-intro", 0],
    [".service-card", 1],
    [".service-support", 0],
    [".cta-section", 0],
    [".cta-section__photo", 0],
    [".cta-section__content", 1]
  ];

  var items = [];

  revealGroups.forEach(function (group) {
    var selector = group[0];
    var shouldStagger = group[1];

    document.querySelectorAll(selector).forEach(function (element, index) {
      if (element.classList.contains("reveal-item")) {
        return;
      }

      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-index", shouldStagger ? index % 4 : 0);
      items.push(element);
    });
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (element) {
      element.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12
  });

  items.forEach(function (element) {
    observer.observe(element);
  });
})();

/* 制作実績の横スクロール */
(function () {
  var track = document.querySelector("[data-works-track]");
  if (!track) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isHovering = false;
  var isDragging = false;
  var movedWhileDragging = false;
  var suppressClick = false;
  var pauseUntil = 0;
  var startX = 0;
  var startLeft = 0;
  var loopWidth = 0;
  var resizeTimer = 0;
  var previousTime = 0;
  var speed = 34 / 1000;

  function prepareLoop() {
    var existingClones = track.querySelectorAll("[data-loop-clone]");
    existingClones.forEach(function (clone) {
      clone.remove();
    });

    var originalCards = Array.prototype.slice.call(track.children);
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute("data-loop-clone", "true");
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      clone.querySelectorAll("a, button, input, textarea, select, [tabindex]").forEach(function (element) {
        element.tabIndex = -1;
      });
      track.appendChild(clone);
    });

    window.requestAnimationFrame(updateLoopWidth);
  }

  function updateLoopWidth() {
    var firstCard = track.querySelector(".work-card:not([data-loop-clone])");
    var firstClone = track.querySelector(".work-card[data-loop-clone]");
    loopWidth = firstCard && firstClone ? firstClone.offsetLeft - firstCard.offsetLeft : 0;
  }

  function maxScrollLeft() {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  function pauseFor(duration) {
    pauseUntil = Date.now() + duration;
  }

  function shouldPause() {
    return reduceMotion || document.hidden || isHovering || isDragging || Date.now() < pauseUntil || maxScrollLeft() <= 1;
  }

  function normalizeScroll() {
    if (!loopWidth) return;
    while (track.scrollLeft >= loopWidth) {
      track.scrollLeft -= loopWidth;
    }
  }

  function releaseDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");
    if (track.releasePointerCapture && event && event.pointerId) {
      try {
        track.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore release errors when the pointer was already released by the browser.
      }
    }
    if (movedWhileDragging) {
      suppressClick = true;
      window.setTimeout(function () {
        suppressClick = false;
      }, 120);
    }
    pauseFor(1400);
  }

  track.addEventListener("mouseenter", function () {
    isHovering = true;
  });

  track.addEventListener("mouseleave", function () {
    isHovering = false;
    releaseDrag();
  });

  track.addEventListener("focusin", function () {
    isHovering = true;
  });

  track.addEventListener("focusout", function () {
    isHovering = false;
  });

  track.addEventListener("wheel", function () {
    pauseFor(1600);
  }, { passive: true });

  track.addEventListener("touchstart", function () {
    pauseFor(2400);
  }, { passive: true });

  track.addEventListener("touchend", function () {
    pauseFor(1800);
  }, { passive: true });

  track.addEventListener("pointerdown", function (event) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    isDragging = true;
    movedWhileDragging = false;
    startX = event.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    if (track.setPointerCapture) {
      track.setPointerCapture(event.pointerId);
    }
  });

  track.addEventListener("pointermove", function (event) {
    if (!isDragging) return;
    var delta = event.clientX - startX;
    if (Math.abs(delta) > 4) {
      movedWhileDragging = true;
    }
    track.scrollLeft = startLeft - delta;
    event.preventDefault();
  });

  track.addEventListener("pointerup", releaseDrag);
  track.addEventListener("pointercancel", releaseDrag);

  track.addEventListener("click", function (event) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  function animate(timestamp) {
    if (!previousTime) {
      previousTime = timestamp;
    }
    var elapsed = timestamp - previousTime;
    previousTime = timestamp;

    if (!shouldPause()) {
      var nextLeft = track.scrollLeft + elapsed * speed;
      if (loopWidth && nextLeft >= loopWidth) {
        nextLeft -= loopWidth;
      }
      track.scrollLeft = nextLeft;
    } else {
      normalizeScroll();
    }

    window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateLoopWidth, 120);
  });

  prepareLoop();
  window.requestAnimationFrame(animate);
})();

/* スクロールで追従ヘッダーにヘアラインを出す */
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var ticking = false;
  function update() {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
})();

/* ヒーローのコピーを1文字ずつ <span> に分割（脈打つアニメ用） */
(function () {
  var targets = document.querySelectorAll("[data-pulse]");
  targets.forEach(function (el) {
    var text = el.textContent;
    el.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement("span");
      span.className = "hero__ch";
      span.textContent = text[i];
      span.style.setProperty("--i", i);
      frag.appendChild(span);
    }
    el.appendChild(frag);
  });
})();
