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
 * - Hiding is only safe where the user cannot see the element: either it is
 *   off screen, or we are inside a MutationObserver microtask (which runs
 *   after the DOM change and before paint). An element that is already on
 *   screen during the post-paint boot scan is shown, never revealed.
 * - No geometry reads interleaved with writes: one batched read pass, then
 *   the writes.
 * - No `will-change`. Transform and opacity transitions are promoted by the
 *   browser while they run, and pre-promoting a waiting element would hold a
 *   layer for as long as it stays off screen (restraint.md B8, fluidity.md F5).
 * - Reduced motion tears the observers down and releases every hidden state.
 */
const REVEAL = '[data-reveal="io"]';
const PENDING = 'is-pending';
const IN = 'is-in';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly destroyRef = inject(DestroyRef);

  private observer?: IntersectionObserver;
  private mutations?: MutationObserver;
  private media?: MediaQueryList;
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

    // Post-paint scan: only elements the user cannot see may be hidden.
    this.scan(document.body, false);

    this.mutations = new MutationObserver(this.onMutations);
    this.mutations.observe(document.body, { childList: true, subtree: true });
  }

  private stopObservers(): void {
    this.observer?.disconnect();
    this.mutations?.disconnect();
    this.observer = undefined;
    this.mutations = undefined;
  }

  private stop(): void {
    this.media?.removeEventListener('change', this.onPreferenceChange);
    this.stopObservers();
    const root = document.documentElement;
    root.classList.remove('motion-ready', 'reduce');
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
          // Pre-paint, so hiding even an on-screen element cannot be seen.
          this.arm(element);
        }
        this.scan(element, true);
      }
    }
  };

  /**
   * @param prePaint true when called from a MutationObserver, which runs as a
   * microtask after the DOM change and therefore before the browser paints.
   */
  private scan(root: ParentNode, prePaint: boolean): void {
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL),
    ).filter(
      (element) =>
        !element.classList.contains(PENDING) && !element.classList.contains(IN),
    );
    if (candidates.length === 0) {
      return;
    }

    // S13: every geometry read happens here, before a single style write.
    const onScreen = candidates.map(
      (element) =>
        !prePaint &&
        element.getBoundingClientRect().top < window.innerHeight * 0.94,
    );

    candidates.forEach((element, index) => {
      if (onScreen[index]) {
        // Already on screen and already painted: show it, do not reveal it.
        // A fade here would be content disappearing and coming back.
        element.classList.add(IN);
        return;
      }
      this.arm(element);
    });
  }

  /** Applies the hidden start state and hands the element to the observer. */
  private arm(element: HTMLElement): void {
    if (element.classList.contains(PENDING) || element.classList.contains(IN)) {
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
      element.addEventListener(
        'transitionend',
        () => element.classList.remove(PENDING),
        { once: true },
      );
    }
  };

  private releasePending(): void {
    for (const element of document.querySelectorAll(REVEAL)) {
      element.classList.remove(PENDING);
    }
  }
}
