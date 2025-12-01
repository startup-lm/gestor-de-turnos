import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/logo.png";

export default function LinkBarberLogo({ onClick, className = "", }: Readonly<{ onClick?: () => void; className?: string; }>) {
  return (
    <Link href="/" className={`flex items-center ${className}`} prefetch onClick={onClick}>
      <div className=" relative rounded-full overflow-hidden w-16 h-16 md:w-20 md:h-20 lg:w-20 lg:h-20 " >
        <Image
          src={logo}
          alt="Logo"
          fill 
          sizes="(min-width:1024px) 4rem, (min-width:768px) 3.5rem, 3rem"
          className="object-cover"
        />
      </div>
    </Link>
  );
}
