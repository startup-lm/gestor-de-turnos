export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Cliente

  let url = "http://localhost:3000";
  if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    url = process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : `https://${process.env.NEXT_PUBLIC_APP_URL}`;
  }

  // Quitar la barra final si existe
  url = url.replace(/\/$/, "");
  
  console.log("[API URL RESOLVED]:", url);
  return url;
}
