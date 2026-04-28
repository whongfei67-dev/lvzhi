type SparkProps = {
  points: string;
  stroke: string;
  strokeWidth?: number;
};

export function WorkbenchSpark({ points, stroke, strokeWidth = 2.2 }: SparkProps) {
  return (
    <svg className="spark" viewBox="0 0 100 26" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 横轴：时间标签；纵轴：数值（示意数据，便于阅读趋势） */
export type WorkbenchAxisPoint = { label: string; value: number };

type AxisChartProps = {
  points: WorkbenchAxisPoint[];
  stroke: string;
  yAxisLabel?: string;
};

export function WorkbenchAxisChart({ points, stroke, yAxisLabel = "数值" }: AxisChartProps) {
  const w = 220;
  const h = 96;
  const padL = 34;
  const padB = 26;
  const padT = 10;
  const padR = 10;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const vals = points.map((p) => p.value);
  const maxV = Math.max(1, ...vals);
  const minV = 0;
  const n = Math.max(1, points.length);

  const linePoints = points
    .map((p, i) => {
      const x = padL + (n <= 1 ? chartW / 2 : (chartW * i) / (n - 1));
      const y = padT + chartH - ((p.value - minV) / (maxV - minV)) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const y0 = padT + chartH;
  const yTop = padT;

  return (
    <svg className="wb-axis-chart" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1={padL} y1={y0} x2={padL + chartW} y2={y0} stroke="#c9b8a8" strokeWidth={1} />
      <line x1={padL} y1={yTop} x2={padL} y2={y0} stroke="#c9b8a8" strokeWidth={1} />
      <text x={4} y={yTop + 8} fontSize={7} fill="#8a7a6c">
        {yAxisLabel}
      </text>
      <text x={padL - 2} y={y0 + 2} fontSize={7} fill="#8a7a6c" textAnchor="end">
        0
      </text>
      <text x={padL - 2} y={yTop + 6} fontSize={7} fill="#8a7a6c" textAnchor="end">
        {Math.round(maxV)}
      </text>
      {points.map((p, i) => {
        const x = padL + (n <= 1 ? chartW / 2 : (chartW * i) / (n - 1));
        return (
          <text key={`x-${i}`} x={x} y={h - 4} fontSize={7} textAnchor="middle" fill="#7a6a5c">
            {p.label}
          </text>
        );
      })}
      <text x={padL + chartW / 2} y={h - 1} fontSize={6} textAnchor="middle" fill="#a09082">
        时间
      </text>
      <polyline fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
    </svg>
  );
}
