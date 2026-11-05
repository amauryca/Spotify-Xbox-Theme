import {navigateConsoleSettings} from './settings-navigation';
import {view} from './bridge';
import {useGamepad} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/use-gamepad';
import type {InputAction} from '../zip-reference/Audio-Visualizer-main/frontend/app/blade-dashboard-mockups/_components/gamepad-input';

const surfaces = '.spotify-search,.spotify-visuals,.xbox-lyrics,.xbox-photos';
const controls = 'button:not(:disabled),input:not(:disabled),select:not(:disabled)';
function visibleControls(root:ParentNode) {
  return Array.from(root.querySelectorAll<HTMLElement>(controls)).filter(element =>
    element.getClientRects().length && getComputedStyle(element).visibility === 'visible');
}

export function navigateSpotify(action:InputAction) {
  const settings = document.querySelector<HTMLElement>('.console-settings');
  if (settings) return navigateConsoleSettings(settings, action);
  const surface = document.querySelector<HTMLElement>(surfaces);
  const toolbar = document.querySelector<HTMLElement>('.spotify-toolbar');
  const active = document.activeElement as HTMLElement | null;
  if (!surface && action === 'lb' && toolbar?.getClientRects().length) {
    visibleControls(toolbar)[0]?.focus();
    return true;
  }
  const root = surface || (active && toolbar?.contains(active) ? toolbar : null);
  if (!root) return false;
  if (action === 'b') {
    if (!surface) document.querySelector<HTMLElement>('[data-nav-item]:not(:disabled)')?.focus();
    else if (surface.matches('.spotify-visuals')) document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    else if (surface.matches('.xbox-lyrics')) view('visualizer');
    else view('dashboard');
    return true;
  }
  const candidates = visibleControls(root);
  if (action === 'lb' || action === 'rb') {
    const group = action === 'lb' ? candidates.filter(element=>toolbar?.contains(element)) : candidates.filter(element=>!toolbar?.contains(element));
    group[0]?.focus();
    return true;
  }
  if (!active || !candidates.includes(active)) {
    candidates[0]?.focus();
    return true;
  }
  if (action === 'a') {
    if (active instanceof HTMLButtonElement || active.matches('input[type=checkbox],input[type=file]')) active.click();
    else if (active instanceof HTMLSelectElement && active.options.length) {
      active.selectedIndex = (active.selectedIndex + 1) % active.options.length;
      active.dispatchEvent(new Event('change',{bubbles:true}));
    }
    else active.focus();
    return true;
  }
  if (action !== 'up' && action !== 'down' && action !== 'left' && action !== 'right') return true;
  const horizontal = action === 'left' || action === 'right';
  const direction = action === 'left' || action === 'up' ? -1 : 1;
  if (horizontal && active instanceof HTMLInputElement && active.type === 'range') {
    if (direction < 0) active.stepDown(); else active.stepUp();
    active.dispatchEvent(new Event('input',{bubbles:true}));
    active.dispatchEvent(new KeyboardEvent('keyup',{key:direction < 0 ? 'ArrowLeft' : 'ArrowRight',bubbles:true}));
    return true;
  }
  const from = active.getBoundingClientRect();
  let best:HTMLElement | undefined;
  let score = Infinity;
  for (const candidate of candidates) {
    if (candidate === active) continue;
    const to = candidate.getBoundingClientRect();
    const dx = to.left+to.width/2-from.left-from.width/2;
    const dy = to.top+to.height/2-from.top-from.height/2;
    const forward = direction*(horizontal ? dx : dy);
    if (forward < 5) continue;
    const distance = forward + 3*Math.abs(horizontal ? dy : dx);
    if (distance < score) { score = distance; best = candidate; }
  }
  best?.focus();
  return true;
}

export function SpotifyController() {
  useGamepad(navigateSpotify);
  return null;
}
