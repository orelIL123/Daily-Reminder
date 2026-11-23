/* Thin line icons for the category strip and menu. Unknown categories fall back to the tee. */
const ICONS: Record<string, React.ReactNode> = {
  tee: <path d="M8 4l-5 3 2 4 3-1v10h10V10l3 1 2-4-5-3c-.5 1.6-2 2.6-4 2.6S8.5 5.6 8 4z" />,
  layered: <><path d="M8 4l-5 3 2 4 3-1v10h10V10l3 1 2-4-5-3c-.5 1.6-2 2.6-4 2.6S8.5 5.6 8 4z" /><path d="M5 11l-1.6 9.4h2.8L8 13M19 11l1.6 9.4h-2.8L16 13" /></>,
  hoodie: <><path d="M9 4c0-1.2 1.4-2 3-2s3 .8 3 2l4 2 2 9-3 .5V21H6v-5.5L3 15l2-9 4-2z" /><path d="M9 4c0 2 1.3 4 3 4s3-2 3-4M11 8v3M13 8v3M8 17h8" /></>,
  jacket: <><path d="M9 3l3 2 3-2 4 2 2 10-3 .5V21H6v-5.5L3 15 5 5l4-2z" /><path d="M12 5v16M9 3l1 4M15 3l-1 4M8 14h2M14 14h2" /></>,
  sweatshirt: <><path d="M9 4c.6 1.4 1.7 2 3 2s2.4-.6 3-2l4 2 2 9-3 .5V21H6v-5.5L3 15l2-9 4-2z" /><path d="M6 19h12" /></>,
  pants: <><path d="M6 3h12l1 18h-5l-2-11-2 11H5L6 3z" /><path d="M6 6h12M12 3v3" /></>,
  hat: <><path d="M4 15c0-4.4 3.6-8 8-8s8 3.6 8 8" /><path d="M2 15h13c3 0 6 .8 7 2-2 .8-5 1-7 1H4c-1.1 0-2-.9-2-2v-1zM12 7V5.5" /></>,
  kippah: <><path d="M3.5 15.5C4 10.5 7.6 7 12 7s8 3.5 8.5 8.5c-2.6 1-5.4 1.5-8.5 1.5s-5.9-.5-8.5-1.5z" /><path d="M6 13.5c1.9.6 3.9.9 6 .9s4.1-.3 6-.9M12 7v2" /></>,
  shoe: <><path d="M3 17v-6.5c0-.8.7-1.5 1.5-1.5H7l2 2.5c2.5 1 6 1.6 9 2.2 2 .4 3 1.4 3 2.8V17H3z" /><path d="M3 17v1.5h18V17M10 12l1-1.5M12.5 12.8l1-1.5" /></>,
};

const BY_SLUG: Record<string, keyof typeof ICONS> = {
  tees: 'tee', 't-shirts': 'tee', tzitzit: 'tee', 'layered-tees': 'layered', hoodies: 'hoodie', outerwear: 'jacket',
  jackets: 'jacket', sweatshirts: 'sweatshirt', pants: 'pants', hats: 'hat', caps: 'hat', kippot: 'kippah', shoes: 'shoe',
};

export default function CategoryIcon({ slug, size = 30 }: { slug: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {ICONS[BY_SLUG[slug] ?? 'tee']}
    </svg>
  );
}
