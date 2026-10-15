import type { CircuitDocument } from '../../src/model/types';
import { exportObsidian as exportCurrent } from '../../src/tikz/exporter';

/** Legacy tests assert explicit paths/comments. Keep checking that fallback;
 * obsidian-compact.test.ts checks expansion equivalence of the default output. */
export const exportObsidian = (doc: CircuitDocument) => exportCurrent(doc, { compact: false });
