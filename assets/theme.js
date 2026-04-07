/**
 * Drink LLC — Theme JS
 * Minimal. Intentional.
 */

(function() {
  'use strict';

  /**
   * Intersection Observer for scroll animations
   */
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.animate-fade, .animate-slide-up');
    if (!elements.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(function(el) {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }

  /**
   * Initialize on DOM ready
   */
  document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
  });
})();
