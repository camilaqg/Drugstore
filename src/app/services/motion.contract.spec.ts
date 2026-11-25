import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contract test for the motion layer (odd/tasks/motion-system.md, S7-S11).
 *
 * The motion layer is CSS plus a DOM observer, so no behavioural test can
 * catch the failure that actually matters: content that stays invisible
 * because a stylesheet hid it. These assertions are static on purpose — they
 * fail if someone ever writes `opacity: 0` on content that only JS can show.
 */

const ROOT = 'src';

function walk(dir: string, extension: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return walk(path, extension);
    }
    return path.endsWith(extension) ? [path] : [];
  });
}

interface Block {
  selector: string;
  body: string;
  parent?: Block;
}

/** Minimal CSS block parser: enough for this repository's plain CSS. */
function parseBlocks(css: string): Block[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: Block[] = [];
  const stack: Array<{ selectorStart: number; block: Block }> = [];
  let boundary = 0;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '{') {
      const selector = source.slice(boundary, i).trim();
      const block: Block = {
        selector,
        body: '',
        parent: stack.at(-1)?.block,
      };
      stack.push({ selectorStart: i + 1, block });
      boundary = i + 1;
      continue;
    }
    if (char === '}') {
      const open = stack.pop();
      if (open) {
        open.block.body = source.slice(
          open.selectorStart,
          i,
        );
        blocks.push(open.block);
      }
      boundary = i + 1;
    }
  }
  return blocks;
}

function ownAndAncestors(block: Block): string[] {
  const chain: string[] = [];
  let current: Block | undefined = block;
  while (current) {
    chain.push(current.selector);
    current = current.parent;
  }
  return chain;
}

const cssFiles = walk(ROOT, '.css').map((path) => ({
  path,
  css: readFileSync(path, 'utf8'),
}));

describe('motion contract', () => {
  it('S10: no stylesheet hides content by itself', () => {
    const offenders: string[] = [];

    for (const { path, css } of cssFiles) {
      for (const block of parseBlocks(css)) {
        if (!/opacity\s*:\s*0[\s;}]/.test(block.body)) {
          continue;
        }
        // The start state may only live where JS owns it, or inside a keyframe
        // frame that does not exist unless the animation runs.
        const gated = ownAndAncestors(block).some((selector) =>
          /@keyframes|\.is-pending|@starting-style/.test(selector),
        );
        if (!gated) {
          offenders.push(`${path}: ${block.selector}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('S10: every entrance animation is gated on html.motion-ready', () => {
    const offenders: string[] = [];

    for (const { path, css } of cssFiles) {
      for (const block of parseBlocks(css)) {
        if (!/(^|[\s;])animation\s*:/.test(block.body)) {
          continue;
        }
        const gated = ownAndAncestors(block).some((selector) =>
          selector.includes('html.motion-ready'),
        );
        if (!gated) {
          offenders.push(`${path}: ${block.selector}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('S7: nothing animates a non-composite property, and no transition: all', () => {
    const offenders: string[] = [];
    const forbidden =
      /\b(width|height|top|left|right|bottom|box-shadow|filter|backdrop-filter|background)\b\s+var\(--dur/;

    for (const { path, css } of cssFiles) {
      for (const block of parseBlocks(css)) {
        if (/transition\s*:\s*all/.test(block.body)) {
          offenders.push(`${path}: ${block.selector} uses transition: all`);
        }
        if (forbidden.test(block.body)) {
          offenders.push(`${path}: ${block.selector} animates a paint property`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('S11: no layer-promotion hacks and no resting will-change', () => {
    const offenders: string[] = [];

    for (const { path, css } of cssFiles) {
      for (const block of parseBlocks(css)) {
        if (/translate3d\(0\s*,\s*0\s*,\s*0\)|translateZ\(0\)|backface-visibility/.test(block.body)) {
          offenders.push(`${path}: ${block.selector} uses a promotion hack`);
        }
        if (/will-change/.test(block.body)) {
          offenders.push(`${path}: ${block.selector} holds will-change`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('S15: reduced motion zeroes the duration and distance tokens', () => {
    const motion = readFileSync(join(ROOT, 'styles', 'motion.css'), 'utf8');
    const twice = (token: string, value: string) =>
      motion.split(`${token}: ${value}`).length - 1;

    // Once for the media query, once for the JS-mirrored `html.reduce` class:
    // both branches must land on identical values or they slowly drift apart.
    for (const token of [
      '--dur-instant',
      '--dur-quick',
      '--dur-base',
      '--dur-settle',
      '--dur-reveal',
    ]) {
      expect(twice(token, '0ms'), token).toBe(2);
    }
    for (const token of ['--shift-sm', '--shift-md', '--shift-lg']) {
      expect(twice(token, '0px'), token).toBe(2);
    }
    expect(twice('--stagger-step', '0ms')).toBeGreaterThanOrEqual(2);
  });

  it('every data-reveal value in a template has a rule, and vice versa', () => {
    const used = new Set<string>();
    for (const path of walk(join(ROOT, 'app'), '.html')) {
      for (const match of readFileSync(path, 'utf8').matchAll(/data-reveal="(\w+)"/g)) {
        used.add(match[1]);
      }
    }

    expect([...used].sort()).toEqual(['io', 'push', 'settle']);

    const motion = readFileSync(join(ROOT, 'styles', 'motion.css'), 'utf8');
    for (const value of used) {
      expect(motion).toContain(`[data-reveal='${value}']`);
    }
  });
});
