import Link from "next/link";
import Image from "next/image";
import instagramIcon from "@/public/images/instagram.png";

export default function BarberInstagram({ username }: Readonly<{ username: string; }>) {
  const cleanUsername = username.replace(/^@+/, "");
  return (
    <Link
      href={`https://instagram.com/${cleanUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className="barber-instagram max-w-full flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
      title={`@${cleanUsername}`}
    >
      <Image
        src={instagramIcon}
        alt="Instagram"
        width={18}
        height={18}
        className="shrink-0 inline-block"
        unoptimized
      />
      <span className="handle text-xs sm:text-sm font-semibold truncate max-w-[170px]">
        @{cleanUsername}
      </span>
    </Link>
  );
}
