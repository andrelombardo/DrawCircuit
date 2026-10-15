import regular from './comic-relief/ComicRelief-Regular.woff2?inline';
import bold from './comic-relief/ComicRelief-Bold.woff2?inline';
import license from './comic-relief/OFL.txt?raw';

/** SVG images have their own font context, including when rasterized to PNG. */
export const EMBEDDED_CIRCUIT_FONTS = `<style><![CDATA[/* ${license} */
@font-face{font-family:'Comic Relief';font-style:normal;font-weight:400;src:url(${regular}) format('woff2');}
@font-face{font-family:'Comic Relief';font-style:normal;font-weight:700;src:url(${bold}) format('woff2');}
]]></style>`;
