/** Roughly how a result looks on Google. */
export default function SearchPreview({ url, title, description }: { url: string; title: string; description: string }) {
  const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  return (
    <div className="adm-serp" dir="ltr">
      <small>{url}</small>
      <b>{cut(title, 60)}</b>
      <p>{cut(description, 160)}</p>
    </div>
  );
}
