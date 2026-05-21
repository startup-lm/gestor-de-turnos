import Link from "next/link";

type Props = {
  url: string;
  icon: React.ReactNode;
  text: string;
};

export default function BarberSocialMedia({ url, icon, text }: Readonly<Props>) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between w-full max-w-md p-4 rounded-xl border border-[var(--foreground)]/10 bg-gradient-to-r from-[var(--foreground)]/8 to-[var(--foreground)]/4 hover:border-[var(--accent)]/40 hover:from-[var(--accent)]/10 hover:to-[var(--accent)]/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="bg-[var(--accent)]/10 p-2.5 rounded-lg border border-[var(--accent)]/20 text-[var(--accent)] group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-[var(--primary)] transition-all duration-300 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm md:text-base font-semibold text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors">
          {text}
        </span>
      </div>
      <div className="text-[var(--accent)] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>
    </Link>
  );
}