import { fireEvent, screen } from '@testing-library/react';

export function chooseSelectionCommand(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Comandi selezione' }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
}

export function chooseSelectionColor(scope: string, color: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Colore ' + scope.toLowerCase() }));
  fireEvent.click(screen.getByRole('menuitem', { name: scope + ': ' + color }));
}
