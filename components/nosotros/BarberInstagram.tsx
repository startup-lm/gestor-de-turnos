import Link from "next/link";
import Image from "next/image";

export default function BarberInstagram({ username }: Readonly<{username: string;}>) {
  return (
    <Link href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer" className="barber-instagram" >
      <Image src="/images/instagram.png" alt="Instagram" width={20} height={20} className="inline-block mr-1" />
      <span className="handle">{username.includes('@') ? username : `@${username}`}</span>
    </Link>
  );
}
