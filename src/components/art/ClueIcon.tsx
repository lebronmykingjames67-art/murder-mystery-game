const paths: Record<string, string> = {
  note: 'M6 3h9l3 3v15H6z M15 3v3h3 M9 11h6 M9 15h6',
  blade: 'M5 19l9-9 M14 10l3-3 2 2-3 3 M17 7l-2-2 1.5-1.5 2 2z M5 19l-1 2 2-1',
  drawer: 'M4 4h16v16H4z M4 10h16 M9 13h1 M4 4h16v6H4z M9 7h1',
  phone: 'M8 2h8v20H8z M11 19h2',
  lock: 'M6 11V8a6 6 0 0112 0v3 M5 11h14v10H5z M12 15v3',
  fabric: 'M4 6c4 2 4-2 8 0s4-2 8 0v4c-4-2-4 2-8 0s-4 2-8 0z M8 10l-2 8 M14 10l2 8',
  footprint: 'M9 3c2 0 3 2 3 5s-1 4-1 7-1 5-3 5-3-2-3-5 1-4 1-7 1-5 3-5z M17 9c1.6 0 2.4 1.6 2.4 4s-.8 3.2-.8 5.6-.8 4-2.4 4-2.4-1.6-2.4-4 .8-3.2.8-5.6.8-4 2.4-4z',
  glass: 'M6 3h6l-1 9a2 2 0 01-4 0z M9 12v6 M6 21h6 M16 3h4v14a2 2 0 01-4 0z',
  printout: 'M6 2h9l3 3v17H6z M15 2v3h3 M8 10h8 M8 13h8 M8 16h5',
  notebook: 'M5 3h13v18H5z M5 7h13 M8 3v18 M11 11h5 M11 15h5',
  document: 'M6 2h8l4 4v16H6z M14 2v4h4 M9 12h6 M9 16h6',
  shards: 'M4 20l5-12 3 6 4-9 4 15z',
  key: 'M9 15a5 5 0 114-8.7A5 5 0 019 15zM12.5 13.5L20 21m-4-4l2-2m-6 2l2-2',
  napkin: 'M4 4h16v16l-4-3-4 3-4-3-4 3z M8 10h8 M8 14h5',
  quote: 'M7 8c-2 0-3.5 1.6-3.5 4S5 16 7 16c.3 2-1 3.5-3 4 M17 8c-2 0-3.5 1.6-3.5 4s1.5 4 3.5 4c.3 2-1 3.5-3 4',
};

export default function ClueIcon({ icon, size = 20, className }: { icon: string; size?: number; className?: string }) {
  const d = paths[icon] ?? paths.note;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
