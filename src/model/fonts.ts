export const CIRCUIT_FONT =
  '"Comic Relief", "DrawCircuit Symbols", "DrawCircuit Blackboard", "DrawCircuit Script", "DrawCircuit Fraktur", cursive';

/** Load the complete local handwriting stack before any canvas/export measurement. */
export async function prepareCircuitFonts(fonts = document.fonts): Promise<void> {
  if (!fonts) return;
  await Promise.all([
    fonts.load(`400 22px ${CIRCUIT_FONT}`),
    fonts.load(`700 22px ${CIRCUIT_FONT}`),
    fonts.load('400 22px "DrawCircuit Symbols"'),
    fonts.load('700 22px "DrawCircuit Symbols"'),
    ...[1, 2, 3, 4].map((size) => fonts.load(`400 22px "DrawCircuit Size${size}"`)),
    ...['Blackboard', 'Script', 'Fraktur'].flatMap((style) =>
      [400, 700].map((weight) => fonts.load(`${weight} 22px "DrawCircuit ${style}"`)),
    ),
  ]);
}
