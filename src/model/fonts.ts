export const CIRCUIT_FONT = '"Comic Relief", cursive';

/** Load both bundled faces before mounting the canvas or measuring its labels. */
export async function prepareCircuitFonts(fonts = document.fonts): Promise<void> {
  if (!fonts) return;
  await Promise.all([
    fonts.load(`400 22px ${CIRCUIT_FONT}`),
    fonts.load(`700 22px ${CIRCUIT_FONT}`),
  ]);
}
