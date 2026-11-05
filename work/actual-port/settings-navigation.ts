import type {InputAction} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/gamepad-input';

export function navigateConsoleSettings(root: HTMLElement, action: InputAction) {
  const categoryButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.console-columns nav button'));
  const category = categoryButtons.find(button => button.getAttribute('aria-pressed') === 'true');
  const controls = Array.from(root.querySelectorAll<HTMLElement>(
    '.console-pane button:not(:disabled), .console-pane input:not(:disabled), .console-pane select:not(:disabled)',
  ));
  const active = document.activeElement as HTMLElement | null;
  const row = categoryButtons.indexOf(active as HTMLButtonElement);
  const control = controls.indexOf(active as HTMLElement);
  const direction = action === 'up' || action === 'left' ? -1 : 1;

  if (action === 'b') {
    root.querySelector<HTMLButtonElement>('[data-console-back]')?.click();
  } else if (action === 'lb') {
    category?.focus();
  } else if (action === 'rb') {
    controls[0]?.focus();
  } else if (action === 'a') {
    if (active instanceof HTMLSelectElement) {
      active.selectedIndex = (active.selectedIndex + 1) % active.options.length;
      active.dispatchEvent(new Event('change', {bubbles: true}));
    } else if (active instanceof HTMLButtonElement || active?.matches('input[type=checkbox]')) {
      active.click();
    }
  } else if (action === 'up' || action === 'down') {
    if (row >= 0) {
      const next = categoryButtons[row + direction];
      next?.focus();
      next?.click();
    } else if (control >= 0) {
      (controls[control + direction] ?? (action === 'up' ? category : undefined))?.focus();
    } else {
      category?.focus();
    }
  } else if (action === 'left' || action === 'right') {
    if (row >= 0 && action === 'right') {
      controls[0]?.focus();
    } else if (active instanceof HTMLInputElement && active.type === 'range') {
      if (direction < 0) active.stepDown();
      else active.stepUp();
      active.dispatchEvent(new Event('input', {bubbles:true}));
      active.dispatchEvent(new KeyboardEvent('keyup', {key: action === 'left' ? 'ArrowLeft' : 'ArrowRight', bubbles:true}));
    } else if (active instanceof HTMLSelectElement) {
      const index = Math.max(0, Math.min(active.options.length - 1, active.selectedIndex + direction));
      if (index !== active.selectedIndex) {
        active.selectedIndex = index;
        active.dispatchEvent(new Event('change', {bubbles:true}));
      }
    } else if (action === 'left') {
      category?.focus();
    }
  }
  return true;
}
