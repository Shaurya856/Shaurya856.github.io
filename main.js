/* === SCROLL-SPY ===
 * Watches main sections and keeps the matching sidebar link marked .active. */
const sections = document.querySelectorAll('main section[id]');
const links = document.querySelectorAll('.sidebar-link');
const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(link => link.classList.toggle('active', link.dataset.section === entry.target.id));
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });
sections.forEach(s => spyObserver.observe(s));


/* === ICON RENDERING ===
 * Lucide UMD bundle and DOM finish in different orders depending on cache
 * state, so createIcons() is called on both events to cover both orderings. */
window.addEventListener('DOMContentLoaded', () => { if (window.lucide) lucide.createIcons(); });
document.addEventListener('readystatechange', () => { if (document.readyState === 'complete' && window.lucide) lucide.createIcons(); });


/* === UTILITIES === */
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

/* Collapsing a tall card can remove hundreds of px of height above the
 * viewport, teleporting the user mid-list. If the card's top ended up above
 * the viewport after collapsing, restore it into view (78 = topbar + margin). */
function restoreCardIntoView(card) {
  requestAnimationFrame(() => {
    const top = card.getBoundingClientRect().top;
    if (top < 68) window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 78, behavior: 'auto' });
  });
}


/* === EXPERIENCE CARDS ===
 * Mobile only: tap to toggle .expanded (CSS :hover handles desktop). */
document.querySelectorAll('.exp-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!isMobile()) return;
    const wasExpanded = card.classList.contains('expanded');
    card.classList.toggle('expanded');
    if (wasExpanded) restoreCardIntoView(card);
  });
});


/* === PER-ROW HEIGHT LOCK ===
 * Locks every card in a row to the same height: the tallest expanded content in
 * that row. Measurement happens at expanded flex width so text wrap is accurate.
 * Transitions are disabled during the entire measurement pass so no previous
 * style.height value can animate and corrupt the reading. */
function lockCardHeights() {
  const allCards = Array.from(document.querySelectorAll('.project-card'));

  if (isMobile()) {
    allCards.forEach(c => { c.style.height = ''; c.style.transition = ''; });
    return;
  }

  // Kill transitions so clearing/setting style.height doesn't animate
  allCards.forEach(c => {
    c.style.transition = 'none';
    c.style.height = '';
  });
  void document.body.offsetHeight; // flush — all cards now auto-height, no animation pending

  document.querySelectorAll('.project-row').forEach(row => {
    const cards = Array.from(row.querySelectorAll('.project-card'));
    let maxH = 0;

    cards.forEach(card => {
      const summary    = card.querySelector('.project-summary');
      const highlights = card.querySelector('.project-highlights');
      const tags       = card.querySelector('.project-tags');
      const hint       = card.querySelector('.toggle-hint');

      // Add .open → CSS gives this card flex: 2.5 (expanded main-axis width).
      // Force inner content to its "open" visual state via inline styles so the
      // correct amount of text is laid out at the correct expanded width.
      // align-self:flex-start opts this card out of the row's align-items:stretch —
      // otherwise offsetHeight reads the ROW height (tallest sibling, whose content
      // is mid-collapse and still full-size at narrow width), not this card's own.
      card.classList.add('open');
      card.style.alignSelf = 'flex-start';
      if (summary)    summary.style.cssText = 'max-height:0;opacity:0;margin-bottom:0;transition:none';
      if (highlights) highlights.style.cssText = 'max-height:none;opacity:1;margin-bottom:12px;transition:none';
      if (tags)       tags.style.cssText = 'max-height:200px;opacity:1;transition:none';
      if (hint)       hint.style.cssText = 'max-height:60px;opacity:1;transition:none';

      // Single forced reflow: the row's flex layout is computed at this point,
      // so the card is at its true expanded flex width when offsetHeight is read.
      void card.offsetHeight;
      maxH = Math.max(maxH, card.offsetHeight);

      // Restore to collapsed state before measuring the next sibling
      card.classList.remove('open');
      card.style.alignSelf = '';
      if (summary)    summary.style.cssText = '';
      if (highlights) highlights.style.cssText = '';
      if (tags)       tags.style.cssText = '';
      if (hint)       hint.style.cssText = '';

      void card.offsetHeight; // flush collapse before next iteration
    });

    // Lock every card in this row to the tallest expanded height
    cards.forEach(c => { c.style.height = maxH + 'px'; });
  });

  // Re-enable transitions. Height is not in the CSS transition list, so the
  // locked heights above apply instantly even with transitions active again.
  allCards.forEach(c => { c.style.transition = ''; });
}

window.addEventListener('load', lockCardHeights);
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(lockCardHeights, 150);
});


/* === PROJECT CARDS — hover expand, click-pin, mobile tap ===
 *
 * Height is per-card and animates freely on open/close (no row-wide lock).
 * A `transitioning` guard prevents a new open/close request from firing while
 * a transition is still running — this is what stops bounce, not a static
 * height. The guard always clears via transitionend OR a hard timeout
 * fallback (duration + 100ms), so a missed event can never leave a card stuck.
 * If a timer fires while locked, it re-checks once the lock clears instead of
 * silently dropping the action, so a real hover-leave is never lost. */
document.querySelectorAll('.project-card').forEach(card => {
  const hint = card.querySelector('.toggle-hint');
  let enterTimer = null;
  let leaveTimer = null;
  let transitioning = false;

  function setOpen(shouldOpen) {
    if (transitioning) {
      // Don't drop the request — re-run once the current transition clears.
      setTimeout(() => setOpen(shouldOpen), 60);
      return;
    }
    if (card.classList.contains('open') === shouldOpen) return; // already in target state

    transitioning = true;
    const clear = () => { transitioning = false; };
    const onEnd = (e) => {
      if (e.propertyName !== 'flex-grow') return;
      card.removeEventListener('transitionend', onEnd);
      clear();
    };
    card.addEventListener('transitionend', onEnd);
    setTimeout(clear, 600); // hard fallback: 0.5s transition + 100ms buffer

    if (shouldOpen) {
      const row = card.closest('.project-row');
      if (row) {
        row.querySelectorAll('.project-card.open:not(.pinned)').forEach(c => {
          if (c !== card) c.classList.remove('open');
        });
      }
      card.classList.add('open');
    } else {
      card.classList.remove('open');
    }
  }

  card.addEventListener('mouseenter', () => {
    if (isMobile() || card.classList.contains('pinned')) return;
    const row = card.closest('.project-row');
    if (row && row.querySelector('.project-card.pinned')) return;
    clearTimeout(leaveTimer);
    enterTimer = setTimeout(() => setOpen(true), 500);
  });

  card.addEventListener('mouseleave', () => {
    if (isMobile() || card.classList.contains('pinned')) return;
    clearTimeout(enterTimer);
    leaveTimer = setTimeout(() => setOpen(false), 1000);
  });

  card.addEventListener('click', () => {
    if (!isMobile()) return;
    const wasOpen = card.classList.contains('open');
    setOpen(!wasOpen);
    if (wasOpen) restoreCardIntoView(card);
  });

  hint.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobile()) {
      const wasOpen = card.classList.contains('open');
      setOpen(!wasOpen);
      if (wasOpen) restoreCardIntoView(card);
      return;
    }
    const wasPinned = card.classList.contains('pinned');
    document.querySelectorAll('.project-card.pinned').forEach(c => {
      c.classList.remove('pinned', 'open');
    });
    if (!wasPinned) {
      card.classList.add('pinned', 'open');
    }
  });
});


/* === VIEWPORT-AWARE COLLAPSE ===
 * When a row scrolls off screen, collapse any open card in it regardless of
 * cursor position. Cursor is irrelevant — exit from viewport triggers collapse. */
const rowObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting && !isMobile()) {
      entry.target.querySelectorAll('.project-card.open:not(.pinned)').forEach(c => {
        c.classList.remove('open');
      });
    }
  });
}, { threshold: 0 });

document.querySelectorAll('.project-row').forEach(row => rowObserver.observe(row));


/* === PROJECT LINK TAP GUARD ===
 * Prevents tapping the GitHub pill from also toggling the accordion card. */
document.querySelectorAll('.project-link').forEach(a =>
  a.addEventListener('click', e => e.stopPropagation()));


/* === MOBILE DRAWER === */
const menuBtn = document.querySelector('.topbar-menu');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('drawer-open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.mobile-drawer a').forEach(a =>
    a.addEventListener('click', () => document.body.classList.remove('drawer-open')));
}
