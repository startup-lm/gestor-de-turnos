import Link from "next/link";

type Props = {
  url: string;
  icon: React.ReactNode;
  text: string;
};

export default function BarberSocialMedia({ url, icon, text }: Readonly<Props>) {
  return (
    <p>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline flex items-center gap-2"
        prefetch
      >
        {icon}
        {text}
      </Link>
    </p>
  );
}