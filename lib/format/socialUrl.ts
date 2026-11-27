/** Arma el link público de una red social a partir de lo guardado (usuario, dominio sin protocolo o URL completa). */
export function buildSocialUrl(name: string, value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) {
    return v;
  }

  const startsWithWww = /^www\./i.test(v);
  const firstSlashIndex = v.indexOf("/");
  const hasSlashAndDotBeforeSlash =
    firstSlashIndex !== -1 && v.slice(0, firstSlashIndex).includes(".");

  if (startsWithWww || hasSlashAndDotBeforeSlash) {
    return `https://${v}`;
  }

  const user = v.replace(/^@+/, "");
  if (!user) return null;

  switch (name.toLowerCase()) {
    case "instagram":
      return `https://www.instagram.com/${user}`;
    case "facebook":
      return `https://www.facebook.com/${user}`;
    case "tiktok":
      return `https://www.tiktok.com/@${user}`;
    default:
      return null;
  }
}
