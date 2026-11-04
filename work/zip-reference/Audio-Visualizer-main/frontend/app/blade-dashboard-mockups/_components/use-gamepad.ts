"use client";

import { useEffect, useRef } from "react";
import {
  INITIAL_GAMEPAD_STATE,
  stepGamepadInput,
  type GamepadInputState,
  type InputAction,
} from "./gamepad-input";

type Layout = "standard" | "powera-wired" | "standard-shaped";

function detectLayout(pad: Gamepad): Layout | null {
  if (pad.mapping === "standard") return "standard";
  if (pad.mapping) return null;

  const powerA = /vendor:\s*20d6\s+product:\s*a711\b/i.test(pad.id);
  if (powerA && pad.buttons.length >= 6 && pad.axes.length >= 10) {
    return "powera-wired";
  }
  if (pad.buttons.length >= 16 && pad.buttons.length <= 17 && pad.axes.length === 4) {
    return "standard-shaped";
  }
  return null;
}

function readInput(pad: Gamepad, layout: Layout) {
  const pressed = pad.buttons.map((button) => button.pressed);
  if (layout === "powera-wired") {
    // Chromium on macOS exposes HID Hat Switch (usage 0x39) at axis 9.
    // It encodes eight clockwise directions, starting at -1 for up.
    const hat = pad.axes[9];
    const direction = Math.round((hat + 1) * 3.5);
    const hasDirection = hat >= -1 && hat <= 1
      && Math.abs(hat - (direction / 3.5 - 1)) < 0.05;
    pressed[12] = hasDirection && (direction === 7 || direction <= 1);
    pressed[13] = hasDirection && direction >= 3 && direction <= 5;
    pressed[14] = hasDirection && direction >= 5;
    pressed[15] = hasDirection && direction >= 1 && direction <= 3;
  }
  return { axes: pad.axes, pressed };
}

/**
 * Reads supported connected controllers and calls `onAction` for each
 * action that `stepGamepadInput` fires (DESIGN.md §8).
 *
 * Poll while the dashboard is open so a controller can appear even
 * when the embedded Spotify window misses the connection event.
 * Prefer the browser mapping and fall back to recognizable raw layouts.
 *
 * The code reads the callbacks through refs, thus a caller can pass new
 * closures at each render and the loop does not restart.
 */
export function useGamepad(
  onAction: (action: InputAction) => void,
  onConnect?: (pad: Gamepad) => void,
) {
  const callback = useRef(onAction);
  const connectCallback = useRef(onConnect);
  useEffect(() => {
    callback.current = onAction;
    connectCallback.current = onConnect;
  });

  useEffect(() => {
    let frame = 0;
    const states = new Map<string, GamepadInputState>();

    const sources = [navigator];
    try {
      if (window.parent !== window) sources.push(window.parent.navigator);
    } catch {
      // A cross-origin host cannot share its navigator.
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const seen = new Set<string>();
      const actions = new Set<InputAction>();
      for (const source of sources) {
        try {
          for (const pad of source.getGamepads?.() ?? []) {
            if (!pad?.connected) continue;
            const layout = detectLayout(pad);
            if (!layout) continue;
            const identity = `${pad.index}:${pad.id}:${layout}`;
            if (seen.has(identity)) continue;
            seen.add(identity);

            const previous = states.get(identity);
            const result = stepGamepadInput(
              previous ?? INITIAL_GAMEPAD_STATE,
              readInput(pad, layout),
              now,
            );
            states.set(identity, result.state);
            if (!previous) connectCallback.current?.(pad);
            for (const action of result.actions) actions.add(action);
          }
        } catch (error) {
          if ((error as { name?: string } | null)?.name !== "SecurityError") throw error;
        }
      }
      for (const identity of states.keys()) {
        if (!seen.has(identity)) states.delete(identity);
      }
      for (const action of actions) callback.current(action);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
}
