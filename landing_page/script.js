/* ================================
   TASKFORGE LANDING JS
================================ */

"use strict";

/* ================================
   SELECTORS
================================ */
const navbar = document.querySelector(".navbar");
const links = document.querySelectorAll('a[href^="#"]');
const animatedElements = document.querySelectorAll(
  ".feature-card, .pricing-card, .hero-text, .hero-image, .why-text, .why-image, .cta-content"
);

/* ================================
   SMOOTH SCROLL
================================ */
links.forEach(link => {
  link.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");

    if (targetId.startsWith("#")) {
      e.preventDefault();

      const target = document.querySelector(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  });
});

/* ================================
   NAVBAR SCROLL EFFECT
================================ */
window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.style.background = "rgba(10,10,15,0.95)";
    navbar.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
  } else {
    navbar.style.background = "rgba(10,10,15,0.7)";
    navbar.style.borderBottom = "1px solid rgba(255,255,255,0.06)";
  }
});

/* ================================
   SCROLL ANIMATIONS (FADE-IN)
================================ */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.15
  }
);

animatedElements.forEach(el => {
  el.classList.add("hidden");
  observer.observe(el);
});

/* ================================
   BUTTON RIPPLE EFFECT
================================ */
const buttons = document.querySelectorAll(".btn");

buttons.forEach(btn => {
  btn.addEventListener("click", function (e) {
    const circle = document.createElement("span");

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${e.clientX - rect.left - size / 2}px`;
    circle.style.top = `${e.clientY - rect.top - size / 2}px`;

    circle.classList.add("ripple");

    this.appendChild(circle);

    setTimeout(() => circle.remove(), 600);
  });
});

/* ================================
   HERO PARALLAX EFFECT
================================ */
window.addEventListener("scroll", () => {
  const heroImage = document.querySelector(".hero-image img");

  if (!heroImage) return;

  const offset = window.scrollY * 0.15;
  heroImage.style.transform = `translateY(${offset}px)`;
});

/* ================================
   ACTIVE NAV LINK HIGHLIGHT
================================ */
const sections = document.querySelectorAll("section");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.clientHeight;

    if (window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight) {
      current = section.getAttribute("id");
    }
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.remove("active");

    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});

/* ================================
   SCROLL TO TOP (OPTIONAL)
================================ */
const scrollBtn = document.createElement("button");
scrollBtn.innerText = "↑";
scrollBtn.className = "scroll-top";
document.body.appendChild(scrollBtn);

scrollBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollBtn.style.opacity = "1";
    scrollBtn.style.pointerEvents = "auto";
  } else {
    scrollBtn.style.opacity = "0";
    scrollBtn.style.pointerEvents = "none";
  }
});

/* ================================
   PAGE LOAD ANIMATION
================================ */
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});