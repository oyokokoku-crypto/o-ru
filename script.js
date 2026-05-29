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
    [".service-panel", 0],
    [".service-intro", 0],
    [".service-card", 1],
    [".service-support", 0],
    [".cta-section", 0],
    [".cta-section__photo", 0],
    [".cta-section__content", 1],
    [".site-footer > *", 1]
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
