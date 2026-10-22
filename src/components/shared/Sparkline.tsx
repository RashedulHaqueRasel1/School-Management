import { toSmoothPath, type Point } from "@/lib/chart";

type SparklineProps = {
  data: number[];
  /** Stroke colour (any CSS colour). */
  color: string;
  /** Unique id for the gradient definition. */
  id: string;
  className?: string;
};

const W = 100;
const H = 36;

export function Sparkline({ data, color, id, className }: SparklineProps) {
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const points: Point[] = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 3 - ((v - min) / range) * (H - 6),
  ]);
  const line = toSmoothPath(points);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
