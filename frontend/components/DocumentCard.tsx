'use client';

export default function DocumentCard({ documents, note }: { documents: string[]; note?: string }) {
  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📋</span>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Required Documents</h3>
      </div>

      <ul className="space-y-1.5 mb-3">
        {documents.map((doc, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--foreground)' }}>
            <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }}>✓</span>
            <span>{doc}</span>
          </li>
        ))}
      </ul>

      {note && (
        <div
          className="text-xs p-2 rounded-lg"
          style={{ background: 'var(--background)', color: 'var(--muted)' }}
        >
          ⚠ {note}
        </div>
      )}
    </div>
  );
}
