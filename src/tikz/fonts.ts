import { EMBEDDED_CIRCUIT_FONTS } from '../fonts/embedded';

// This trusted SVG contains only bundled fonts and their license. TeX must see
// short input lines, but CSS data URLs cannot contain the spaces TeX normally
// inserts at line endings. Commented line endings preserve every font byte.
const payload = EMBEDDED_CIRCUIT_FONTS.replace(/\r?\n/g, ' ').replace(/#/g, '\\string#');
const chunks = payload.match(/.{1,1000}/g)!.join('%\n');

/** Emit inside circuitikz: TikZJax discards SVG specials outside the picture. */
export const OBSIDIAN_FONT_DEFINITIONS = `\\ifdcSvg
\\special{dvisvgm:raw ${chunks}}
\\fi`;
