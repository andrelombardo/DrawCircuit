import { fireEvent, screen } from '@testing-library/react';
import { useEditorStore } from '../../src/store/editorStore';

export function openSelectionMenu() {
  const { selection, activeLabel } = useEditorStore.getState();
  const canvas = screen.getByTestId('circuit-canvas');
  const attribute = activeLabel ? 'data-label' : 'data-object';
  const target = [...canvas.querySelectorAll(`[${attribute}]`)].find(
    (element) => element.getAttribute(attribute) === (activeLabel ?? selection[0]),
  );
  if (!target) throw new Error('Select a rendered object before opening its context menu.');
  fireEvent.contextMenu(target, { clientX: 400, clientY: 300 });
}
export function chooseSelectionCommand(name: string) {
  if (/^Ruota|^Inverti|^Specchia|^Polarità/.test(name)) {
    fireEvent.click(screen.getByRole('button', { name }));
    return;
  }
  openSelectionMenu();
  fireEvent.click(
    screen.getByRole('menuitem', { name: name.replace(/ \((?:⌘\/Ctrl|Delete).*\)$/, '') }),
  );
}

export function chooseSelectionColor(scope: string, color: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Colore ' + scope.toLowerCase() }));
  fireEvent.click(screen.getByRole('menuitem', { name: scope + ': ' + color }));
}
