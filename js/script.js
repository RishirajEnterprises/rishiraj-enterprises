/*
  Main site script
  - Handles: mobile menu/drawer, smooth scroll, back-to-top, fade-in observer, contact form validation
  - Optimizations added:
    * Debug logging controlled by `DEBUG` flag (set false for production)
    * Cache DOM queries where appropriate
    * Clear, commented functions for maintainability
*/
const DEBUG = false; // set to true to enable verbose console logs during development

function log(...args) { if (DEBUG) console.log(...args); }

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const menuToggle = document.getElementById('mobile-menu');
  const navMenu = document.getElementById('nav-menu');
  const backToTop = document.getElementById('backToTop');
  const header = document.getElementById('header');

  // MOBILE MENU: toggle 'show' on #nav-menu for CSS media queries
  // Simplified: use a single click handler (and keyboard) so we don't receive duplicate touch/pointer events.
  if (menuToggle && navMenu) {
    if (!menuToggle.hasAttribute('aria-expanded')) menuToggle.setAttribute('aria-expanded', 'false');

    // small timing guard to avoid accidental double-toggle from weird device events
    let _lastToggle = 0;
    /**
     * Legacy toggle (used on desktop fallback)
     * We keep this small and side-effect free; mobile uses the drawer.
     */
    const mobileToggleHandler = (e) => {
      const now = Date.now();
      if (now - _lastToggle < 300) {
        log('mobileToggleHandler: ignored rapid toggle', e.type, now - _lastToggle);
        return;
      }
      _lastToggle = now;

      log('mobileToggleHandler: before toggle', { event: e.type, classes: navMenu.className });
      const isOpen = navMenu.classList.toggle('show');
      menuToggle.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      log('mobileToggleHandler: after toggle', { isOpen, classes: navMenu.className });
    };

    // NOTE: actual activation listener is attached later (mobileMenuActivator)
    // to avoid duplicate handlers (desktop vs mobile behaviors). Do not attach here.

    // MutationObserver (debug only) - logs unexpected class changes on navMenu
    if (window.MutationObserver && DEBUG) {
      try {
        const mo = new MutationObserver((mutations) => {
          mutations.forEach(m => {
            if (m.attributeName === 'class') {
              console.log('MutationObserver: #nav-menu class changed ->', navMenu.className, new Date().toISOString());
            }
          });
        });
        mo.observe(navMenu, { attributes: true, attributeFilter: ['class'] });
      } catch (err) { log('MutationObserver error', err); }
    }
  }

  // --- Mobile drawer implementation (reliable full-width mobile menu) ---
  const mobileDrawer = document.getElementById('mobile-drawer');
  const cloneNavToDrawer = () => {
    if (!mobileDrawer || !navMenu) return;
    const sourceUL = navMenu.querySelector('ul');
    const destUL = mobileDrawer.querySelector('ul');
    if (!sourceUL || !destUL) return;
    // clone links (deep copy) so original markup stays intact
    destUL.innerHTML = sourceUL.innerHTML;
  };
  cloneNavToDrawer();

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  const openDrawer = () => {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
  };
  const closeDrawer = () => {
    if (!mobileDrawer) return;
    // add closing class to animate items out, then remove open after animation
    mobileDrawer.classList.add('closing');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    // wait for the closing animation to finish (match CSS ~260ms)
    setTimeout(() => {
      mobileDrawer.classList.remove('open');
      mobileDrawer.classList.remove('closing');
    }, 300);
  };

  // toggle based on viewport: on mobile, use drawer; otherwise, fallback to existing navMenu toggle
  const mobileMenuActivator = (e) => {
    if (isMobile()) {
      if (mobileDrawer && mobileDrawer.classList.contains('open')) closeDrawer(); else openDrawer();
    } else {
      // desktop behaviour: keep legacy toggle
      if (navMenu) navMenu.classList.toggle('show');
      if (menuToggle) menuToggle.classList.toggle('active');
    }
  };

  if (menuToggle) {
    menuToggle.removeEventListener('click', () => {}); // harmless: ensure no duplicates
    menuToggle.addEventListener('click', mobileMenuActivator);
  }

  // close drawer when a link inside it is clicked (and smooth-scroll will occur)
  if (mobileDrawer) {
    mobileDrawer.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('#')) {
        // allow smooth scroll handler to run; then close
        setTimeout(closeDrawer, 250);
      }
    });
  }

  // ESC to close drawer
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) closeDrawer();
  });

  // ensure drawer nav is freshly cloned on resize (in case of dynamic changes)
  window.addEventListener('resize', () => { cloneNavToDrawer(); });

  // SMOOTH SCROLL FOR INTERNAL LINKS (single handler)
  // cache anchors for efficiency
  const internalAnchors = Array.from(document.querySelectorAll('a[href^="#"]'));
  internalAnchors.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return; // allow no-op anchors
      const targetId = href.substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // close mobile drawer if open (mobile drawer handled separately)
        const mobileDrawer = document.getElementById('mobile-drawer');
        if (mobileDrawer && mobileDrawer.classList.contains('open')) {
          // closing handled elsewhere; call close flow via dispatch
          // small delay so scroll begins before closing UI
          setTimeout(() => mobileDrawer.classList.remove('open'), 260);
        }
        // also close legacy nav if present
        if (navMenu && navMenu.classList.contains('show')) navMenu.classList.remove('show');
        if (menuToggle && menuToggle.classList.contains('active')) menuToggle.classList.remove('active');
      }
    });
  });

  // BACK TO TOP (use class 'show' — CSS controls visibility)
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) backToTop.classList.add('show'); else backToTop.classList.remove('show');
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // FADE-IN ON SCROLL using IntersectionObserver (single observer)
  const fadeObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('show');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in-up, .fade-up, .fade-left, .fade-right').forEach(el => fadeObserver.observe(el));

  // CONTACT FORM HANDLING
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('name') || {}).value || '';
      const email = (document.getElementById('email') || {}).value || '';
      const phone = (document.getElementById('phone') || {}).value || '';
      const service = (document.getElementById('service') || {}).value || '';
      const message = (document.getElementById('message') || {}).value || '';

      if (!name.trim() || !email.trim() || !phone.trim() || !service.trim() || !message.trim()) {
        showMessage('⚠️ Please fill in all fields.', 'warning');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('⚠️ Please enter a valid email address.', 'warning');
        return;
      }

      // Basic phone validation (10 digits)
      if (!/^\d{10}$/.test(phone.replace(/\D/g, '')) ) {
        showMessage('⚠️ Please enter a valid 10-digit phone number.', 'warning');
        return;
      }

      // Show simulated success; replace with real email sending logic as needed
      showMessage('✅ Thank you! Your message has been sent successfully.', 'success');
      contactForm.reset();

      /* Example: EmailJS integration (optional)
         Ensure emailjs SDK is loaded before calling init/send (it's included in index.html).
      try {
        emailjs.init('YOUR_USER_ID');
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', { from_name: name, from_email: email, phone, service, message });
        showMessage('✅ Message sent successfully!', 'success');
      } catch (err) {
        showMessage('❌ Failed to send. Please try again later.', 'error');
      }
      */
    });
  }

  function showMessage(text, type) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.style.fontWeight = '600';
    formStatus.style.textAlign = 'center';
    formStatus.style.marginTop = '10px';
    formStatus.style.color = (type === 'success') ? '#00e676' : (type === 'warning') ? '#fda43a' : (type === 'error') ? '#ff5252' : '#fff';
  }

  // NAVBAR HIDE ON SCROLL (uses header element)
  if (header) {
    let lastY = window.scrollY;
    // set CSS var for header height so mobile overlay can align below it
    const setHeaderHeightVar = () => {
      try {
        const h = header.getBoundingClientRect().height || header.offsetHeight || 64;
        document.documentElement.style.setProperty('--header-h', Math.round(h) + 'px');
      } catch (err) {
        console.warn('Failed to set --header-h', err);
      }
    };
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
    // header may change size when scrolled to compact state; update after transitions
    header.addEventListener('transitionend', setHeaderHeightVar);
    window.addEventListener('scroll', () => {
      // Toggle compact header when user has scrolled past a small threshold
      const compactThreshold = 80;
      const isCompact = window.scrollY > compactThreshold;
      if (isCompact) header.classList.add('scrolled'); else header.classList.remove('scrolled');

      // hide header when scrolling down fast, show when scrolling up
      // BUT do not fully hide the header when it's in compact mode: keep compact header visible
      if (!isCompact) {
        if (window.scrollY > lastY && window.scrollY > 150) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
      } else {
        // ensure compact header stays visible
        header.style.transform = 'translateY(0)';
      }

      // Also explicitly toggle logo visibility via inline styles to avoid any stylesheet/inline-style conflicts
      const logoFull = document.getElementById('logo-full');
      const logoSmall = document.getElementById('logo-small');
      const logoInline = document.getElementById('logo-inline');
      if (isCompact) {
        if (logoFull) logoFull.style.display = 'none';
        if (logoSmall) logoSmall.style.display = 'inline-block';
        if (logoInline && logoSmall && logoSmall.naturalWidth === 0) logoInline.style.display = 'inline-flex';
      } else {
        if (logoFull) logoFull.style.display = 'inline-block';
        if (logoSmall) logoSmall.style.display = 'none';
        if (logoInline) logoInline.style.display = 'none';
      }

      lastY = window.scrollY;
    });
  }
  // no separate close button; hamburger toggles the menu
});
