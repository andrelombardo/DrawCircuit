import regular from './comic-relief/ComicRelief-Regular.woff2?inline';
import bold from './comic-relief/ComicRelief-Bold.woff2?inline';
import license from './comic-relief/OFL.txt?raw';
import symbols from './math-symbols/DrawCircuitSymbols-Regular.woff2?inline';
import symbolsBold from './math-symbols/DrawCircuitSymbols-Bold.woff2?inline';
import size1 from './math-symbols/DrawCircuitSize1-Regular.woff2?inline';
import size2 from './math-symbols/DrawCircuitSize2-Regular.woff2?inline';
import size3 from './math-symbols/DrawCircuitSize3-Regular.woff2?inline';
import size4 from './math-symbols/DrawCircuitSize4-Regular.woff2?inline';
import mathLicense from './math-symbols/OFL.txt?raw';
import blackboard from './math-symbols/DrawCircuitBlackboard-Regular.woff2?inline';
import blackboardBold from './math-symbols/DrawCircuitBlackboard-Bold.woff2?inline';
import script from './math-symbols/DrawCircuitScript-Regular.woff2?inline';
import scriptBold from './math-symbols/DrawCircuitScript-Bold.woff2?inline';
import fraktur from './math-symbols/DrawCircuitFraktur-Regular.woff2?inline';
import frakturBold from './math-symbols/DrawCircuitFraktur-Bold.woff2?inline';

/** SVG images have their own font context, including when rasterized to PNG. */
// /*! preserves the license when the embedded SVG CSS is minified.
export const EMBEDDED_CIRCUIT_FONTS = `<style><![CDATA[/*! ${license} */
@font-face{font-family:'Comic Relief';font-style:normal;font-weight:400;src:url(${regular}) format('woff2');}
@font-face{font-family:'Comic Relief';font-style:normal;font-weight:700;src:url(${bold}) format('woff2');}
/*! ${mathLicense} */
${[
  ['DrawCircuit Symbols', 400, symbols],
  ['DrawCircuit Symbols', 700, symbolsBold],
  ['DrawCircuit Size1', 400, size1],
  ['DrawCircuit Size2', 400, size2],
  ['DrawCircuit Size3', 400, size3],
  ['DrawCircuit Size4', 400, size4],
  ['DrawCircuit Blackboard', 400, blackboard],
  ['DrawCircuit Blackboard', 700, blackboardBold],
  ['DrawCircuit Script', 400, script],
  ['DrawCircuit Script', 700, scriptBold],
  ['DrawCircuit Fraktur', 400, fraktur],
  ['DrawCircuit Fraktur', 700, frakturBold],
].map(([family, weight, data]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${data}) format('woff2');}`).join('\n')}
]]></style>`;
