import { DestroyRef, Injectable, afterNextRender, inject } from '@angular/core';

/**
 * Motion controller — Tier 1.
 *
 * Owns exactly one thing: the below-the-fold reveal. Above-the-fold entrances
 * are pure CSS keyframes gated on `html.motion-ready`; hovers and press
 * feedback are pure CSS transitions. Nothing else lives here, so nothing else
 * can be blocked by a slow main thread.
 *
 * Invariants this file must keep (odd/tasks/motion-system.md, S7-S20):
 * - Never hides content before it knows the browser is running. The hidden
 *   start state (`is-pending`) is applied here, never in a stylesheet.
 * - `is-pending` is stamped inside a MutationObserver microtask, which runs
 *   before paint: a revealed block never flashes visible first.
 * - No geometry reads at all. IntersectionObserver answers the only question
 *   we have, so there is no read/write interleaving to get wrong.
 * - `will-change` arrives with `is-pending` and leaves with it, once the
 *   transition has settled. It is never left on a resting element.
 * - Reduced motion tears the observers down and releases every hidden state.
 */
const REVEAL = '[data-reveal="io"]';
const PENDING = 'is-pending';
const IN = 'is-in';

/** Safety net for elements removed mid-transition: a stray `will-change`. */
const SETTLE_CEILING_MS = 2000;

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly destroyRef = inject(DestroyRef);

  private observer?: IntersectionObserver;
  private mutations?: MutationObserver;
  private media?: MediaQueryList;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private booted = false;

  /** Call once from a component constructor (browser render, SSR-safe). */
  boot(): void {
    afterNextRender(() => this.start());
  }

  private start(): void {
    if (this.booted) {
      return;
    }
    this.booted = true;

    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.media.addEventListener('change', this.onPreferenceChange);

    // Until this class exists, no rule in motion.css can animate anything.
    document.documentElement.classList.add('motion-ready');

    this.syncPreference();
    this.destroyRef.onDestroy(() => this.stop());
  }

  private get reduced(): boolean {
    return this.media?.matches ?? false;
  }

  private syncPreference(): void {
    const reduced = this.reduced;
    document.documentElement.classList.toggle('reduce', reduced);

    if (reduced) {
      this.stopObservers();
      this.releasePending();
      return;
    }

    this.startObservers();
  }

  private readonly onPreferenceChange = (): void => {
    this.syncPreference();
  };

  private startObservers(): void {
    if (this.observer || !document.body) {
      return;
    }

    this.observer = new IntersectionObserver(this.onIntersect, {
      // Slightly inside the viewport so a block settles as it arrives rather
      // than after the user has already read the top of it.
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px',
    });

    this.scan(document.body, false);

    this.mutations = new MutationObserver(this.onMutations);
    this.mutations.observe(document.body, { childList: true, subtree: true });
  }

  private stopObservers(): void {
    this.observer?.disconnect();
    this.mutations?.disconnect();
    this.observer = undefined;
    this.mutations = undefined;
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private stop(): void {
    this.media?.removeEventListener('change', this.onPreferenceChange);
    this.stopObservers();
  }

  /** New route content arrives as DOM, not as an Angular event we can hook. */
  private readonly onMutations = (records: MutationRecord[]): void => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        const element = node as HTMLElement;
        if (element.matches(REVEAL)) {
          this.prepare(element, true);
        }
        this.scan(element, true);
      }
    }
  };

  /**
   * @param prePaint true when called from a MutationObserver, which runs as a
   * microtask after the DOM change and therefore before the browser paints.
   * Hiding there is invisible to the user. The initial scan is post-paint, so
   * it must never hide something the user can already see.
   */
  private scan(root: ParentNode, prePaint: boolean): void {
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL),
    ).filter(
      (element) =>
        !element.classList.contains(PENDING) &&
        !element.classList.contains(IN),
    );
    if (candidates.length === 0) {
      return;
    }

    // S13: every geometry read happens here, before a single style write.
    const visible = prePaint
      ? []
      : candidates.map(
          (element) =>
            element.getBoundingClientRect().top < window.innerHeight * 0.94,
        );

    candidates.forEach((element, index) => {
      if (visible[index]) {
        // Already on screen: show it, do not reveal it. A fade here would be a
        // flash of content disappearing and coming back.
        element.classList.add(IN);
        return;
      }
      this.prepare(element, prePaint);
    });
  }

  /** Applies the hidden start state and hands the element to the observer. */
  private prepare(element: Element, allowHide: boolean): void {
    if (element.classList.contains(PENDING) || element.classList.contains(IN)) {
      return;
    }
    if (!allowHide) {
      return;
    }
    element.classList.add(PENDING);
    this.observer?.observe(element);
  }

  private readonly onIntersect = (entries: IntersectionObserverEntry[]): void => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      const element = entry.target as HTMLElement;
      this.observer?.unobserve(element);

      element.classList.add(IN);
      element.addEventListener('transitionend', () => this.release(element), {
        once: true,
      });

      // Nothing to transition (tokens at 0ms, or a browser that skipped the
      // transition) still owes us the release so `will-change` never lingers.
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.release(element);
      }, SETTLE_CEILING_MS);
      this.timers.add(timer);
    }
  };

  private release(element: HTMLElement): void {
    element.classList.remove(PENDING);
  }

  private releasePending(): void {
    for (const element of document.querySelectorAll(REVEAL)) {
      element.classList.remove(PENDING);
    }
  }
}
