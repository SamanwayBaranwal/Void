/** Single shimmering placeholder block. */
export function Skeleton({
  w = '100%', h = 14, r = 4, style,
}: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** Table-shaped skeleton (rows × columns) inside the standard card frame. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
      {/* header row */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} w={i === 0 ? 90 : `${100 / cols}%`} h={9} />
        ))}
      </div>
      {/* body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 16px', borderTop: r ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} w={c === 0 ? 110 : `${100 / cols}%`} h={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card-grid skeleton (e.g. dashboard stat cards). */
export function CardsSkeleton({ count = 4, height = 92 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count},1fr)`, gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px 18px', height }}>
          <Skeleton w={70} h={9} style={{ marginBottom: 14 }} />
          <Skeleton w={90} h={20} style={{ marginBottom: 10 }} />
          <Skeleton w={50} h={9} />
        </div>
      ))}
    </div>
  );
}
