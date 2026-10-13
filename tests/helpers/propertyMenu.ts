import { fireEvent, screen, within } from '@testing-library/react';

/** Pick the same visible option the user chooses from a property menu. */
export function choosePropertyOption(control: string | HTMLElement, option: string) {
  const trigger = typeof control === 'string' ? screen.getByLabelText(control) : control;
  fireEvent.click(trigger);
  const menu = screen.getByRole('menu', { name: trigger.getAttribute('aria-label')! });
  fireEvent.click(within(menu).getByRole('menuitemradio', { name: option }));
}

export function propertyOptions(label: string) {
  const trigger = screen.getByLabelText(label);
  fireEvent.click(trigger);
  const options = within(screen.getByRole('menu', { name: label }))
    .getAllByRole('menuitemradio')
    .map((option) => option.getAttribute('aria-label')!);
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  return options;
}
