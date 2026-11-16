/** Keep a stable canvas while reserving the mobile drawer's visible area. */
export function mobileFraming(width: number, height: number, detailsOpen: boolean) {
  const visibleHeight = detailsOpen ? Math.max(1, (height + 144) / 2 - 96) : height;
  return {
    distanceScale: (Math.max(1, (0.95 * visibleHeight) / width) * height) / visibleHeight,
    offsetY: (height - visibleHeight) / 2,
  };
}
