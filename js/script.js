// -------------------------
// Rishiraj Enterprises Website Script
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Navbar toggle
  const navToggle = document.getElementById("mobile-menu");
  const navMenu = document.getElementById("nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !expanded);
      navMenu.classList.toggle("show");
    });

    // Close menu on link click
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("show");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Back to Top button
  const backToTop = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  });

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Contact Form Validation
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const service = document.getElementById("service").value;
      const message = document.getElementById("message").value.trim();
      const formStatus = document.getElementById("formStatus");

      // Validate all fields
      if (!name || !email || !phone || !service || !message) {
        showStatus(formStatus, "⚠️ Please fill out all fields.", "warning");
        return;
      }

      // Email validation
      const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailPattern.test(email)) {
        showStatus(formStatus, "⚠️ Please enter a valid email address.", "warning");
        return;
      }

      // Phone validation (basic)
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(phone)) {
        showStatus(formStatus, "⚠️ Please enter a valid 10-digit phone number.", "warning");
        return;
      }

      // Simulate success
      showStatus(formStatus, "✅ Thank you! We’ll get back to you soon.", "success");
      contactForm.reset();
    });
  }

  // Helper function for status messages
  function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.color = type === "success" ? "#00c46a" : "#fda43a";
    element.style.fontWeight = "500";
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth"
        });
      }
    });
  });
});
