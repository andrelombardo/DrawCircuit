import { EMBEDDED_CIRCUIT_FONTS } from '../fonts/embedded';
import { svgSpecialPayload } from './svgSpecial';

/** Emit inside circuitikz: TikZJax discards SVG specials outside the picture. */
export const OBSIDIAN_FONT_DEFINITIONS = `\\ifdcSvg
\\special{dvisvgm:raw ${svgSpecialPayload(EMBEDDED_CIRCUIT_FONTS)}}
\\fi`;
