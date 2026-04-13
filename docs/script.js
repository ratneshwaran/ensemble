/* ═══════════════════════════════════════════════════════════
   Ensemble — Minimal Vanilla JS
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Mobile nav toggle ──────────────────────────────────── */
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      const isOpen = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ── Scroll-reveal animations ───────────────────────────── */
  var reveals = document.querySelectorAll(".reveal");

  if (reveals.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything
    reveals.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  /* ── Active nav link highlighting ───────────────────────── */
  var currentPath = window.location.pathname.replace(/\/$/, "");
  document.querySelectorAll(".nav-item > a, .nav-dropdown a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href && href !== "/" && currentPath.endsWith(href.replace(/\/$/, ""))) {
      link.style.color = "var(--heading)";
    }
  });
})();
