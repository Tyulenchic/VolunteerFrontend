/**
 * Side backdrop of the light pages: two vector strips down the left and right edges (src/assets/backdrop).
 * The parent must be `relative` and clip overflow; content above it needs `relative z-10`. Shown only from 1520px (see .vol-side-art).
 */
export function SideArt() {
  return (
    <>
      <div className="vol-side-art vol-side-art-l" aria-hidden="true" />
      <div className="vol-side-art vol-side-art-r" aria-hidden="true" />
    </>
  );
}
