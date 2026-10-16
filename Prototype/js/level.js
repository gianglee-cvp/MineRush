// Level data loading and ore display names.
export const ORE_INFO = {
  G: { name: 'Vàng', css: '#f6b91d' },
  C: { name: 'Đồng', css: '#e0612a' },
  J: { name: 'Ngọc', css: '#22c55e' },
  I: { name: 'Sắt', css: '#b9c2cc' },
};

export async function loadLevel(id = 'lv01') {
  const r = await fetch(`levels/${id}.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error('Level not found: ' + id);
  return r.json();
}
