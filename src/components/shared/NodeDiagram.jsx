// NodeDiagram — decorative network placed at page corners.
// Center is pushed toward the corner (cx=220, cy=220 in a 900x900 canvas)
// so the nodes on the inward-facing angles bleed behind the portal cards.
// Radius=400 ensures the spread is large enough to cross the center of the page.

export default function NodeDiagram() {
  const cx = 220, cy = 220, r = 400;

  const nodes = [
    { label: "Patient",     angle: 270 },
    { label: "Clinician",   angle: 330 },
    { label: "Caregiver",   angle: 30  },
    { label: "Symptom Log", angle: 90  },
    { label: "Flare Data",  angle: 150 },
    { label: "Care Team",   angle: 210 },
  ];

  const toXY = (angle, radius = r) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  return (
    <svg
      width="900" height="900"
      style={{ opacity: 0.15, position: "absolute", pointerEvents: "none" }}
    >
      {/* Connection lines between every pair of nodes */}
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => {
          const p1 = toXY(a.angle);
          const p2 = toXY(b.angle);
          return (
            <line key={`${i}-${j}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#E8824A" strokeWidth="1"
            />
          );
        })
      )}

      {/* Centre hub */}
      <circle cx={cx} cy={cy} r={6} fill="#E8824A" opacity={0.5} />

      {/* Hub spokes to each node */}
      {nodes.map((n) => {
        const { x, y } = toXY(n.angle);
        return (
          <line key={`hub-${n.label}`}
            x1={cx} y1={cy} x2={x} y2={y}
            stroke="#E8824A" strokeWidth="0.75" strokeDasharray="4 6" opacity={0.5}
          />
        );
      })}

      {/* Node circles */}
      {nodes.map((n) => {
        const { x, y } = toXY(n.angle);
        return (
          <g key={n.label}>
            <circle cx={x} cy={y} r={18} fill="none" stroke="#E8824A" strokeWidth="1.5" />
            <circle cx={x} cy={y} r={9}  fill="#E8824A" />
          </g>
        );
      })}
    </svg>
  );
}
