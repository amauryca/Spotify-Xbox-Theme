"use client";

import { useBladeNav } from "./BladeNavContext";
import { edgeOnlyClipPath, edgeOnlyClipPathFromRight } from "./blade-curve";
import { bladeTransition } from "./blade-motion";

const GUTTER_FILL = "linear-gradient(180deg,#c9c9c9,#ececec 45%,#c4c4c4)";

/**
 * The collapsed tab stack sits on a neutral gray field and not on the
 * colour of the active section (DESIGN.md §2.3: only the colour of the
 * active section is saturated). This component is behind BladeEdges,
 * with the same absolute position, and it stops exactly at the edges of
 * the panel. The edges follow the open blade (§1.2), thus the gutters
 * become wider and narrower as the panel moves, at the shared blade
 * tempo (§7.4).
 *
 * **Each gutter's own inner edge is the §1.1 curve, not a straight
 * line**, at the exact same `topX` as the panel's own edge on that side
 * (`edgeOnlyClipPath` for the left, mirrored; `edgeOnlyClipPathFromRight`
 * for the right, non-mirrored) — the same "share one curve, do not draw
 * two approximations of it" rule the Sign In drawer's panel and ribbon
 * follow (§6.22). A straight-edged gutter is opaque and sits *above* the
 * WebGL canvas in stacking order (`BladeCanvas.tsx`: the canvas paints
 * first, the gutters are part of its `children`); once the shader is
 * live, `BladeEdges`' own CSS fill stands down and the canvas alone
 * paints the curve, including its flare, which reaches past the panel's
 * nominal edge into what a straight gutter claims as its own rectangle.
 * A straight gutter then covers that flare outright, which is a hard
 * rectangular cut hiding a curve that is actually still being drawn
 * underneath it. Curving the gutter's own edge to retreat exactly where
 * the panel's flares out (and it may still reach its full nominal width
 * where the panel bows in — that sliver is the panel's own to fill or
 * not, not the gutter's) removes the conflict instead of papering over
 * it.
 */
export function BladeMenuGutters() {
  const { geometry, activeIndex, count, step } = useBladeNav();
  const transition = bladeTransition("width", "clip-path");
  const rightWidth = 1280 - geometry.rightX;
  const sides = [
    { edge: "left", width: geometry.leftPct, clipPath: edgeOnlyClipPath(geometry.leftX, true, geometry.leftX),
      delta: -1, label: "Previous blade", disabled: activeIndex === 0 },
    { edge: "right", width: geometry.rightInsetPct, clipPath: edgeOnlyClipPathFromRight(geometry.rightX, false, rightWidth),
      delta: 1, label: "Next blade", disabled: activeIndex === count - 1 },
  ];
  return sides.map(side => {
    const style = { [side.edge]: 0, width: `${side.width}%`, clipPath: side.clipPath, transition };
    return (
      <div key={side.edge}>
        <div aria-hidden="true" className="absolute inset-y-0 opacity-95 blade-motion"
          style={{ ...style, background: GUTTER_FILL }} />
        <button type="button" tabIndex={-1} aria-label={side.label} disabled={side.disabled}
          className="blade-gutter absolute inset-y-0 z-[15] blade-motion"
          style={style} onClick={() => step(side.delta)} />
      </div>
    );
  });
}
