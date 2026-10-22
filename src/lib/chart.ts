export type Point = [x: number, y: number];

/** Smooth SVG path through points using horizontal-tangent cubic curves. */
export function toSmoothPath(points: Point[]) {
  return points
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [px, py] = points[i - 1]!;
      const mx = (px + x) / 2;
      return `C${mx},${py} ${mx},${y} ${x},${y}`;
    })
    .join(" ");
}
