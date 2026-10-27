import Image from "next/image";
import BarberInstagram from "./BarberInstagram";
import logo from "@/public/images/logo.png";

export default function BarberCard({ name, photo, instagram }: Readonly<{ name: string; photo: string; instagram: string; }>) {
    const isValidImage = photo && photo !== "null" && photo !== "";

    return (
        <div className="group relative border border-[var(--foreground)]/10 rounded-2xl p-5 text-center bg-gradient-to-b from-[var(--foreground)]/8 to-[var(--foreground)]/4 backdrop-blur-sm w-56 sm:w-60 min-h-[300px] shadow-lg hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-between">
            <div className="w-32 h-32 rounded-full border-2 border-[var(--accent)]/30 group-hover:border-[var(--accent)]/80 overflow-hidden mb-4 shadow-md transition-colors duration-300 relative shrink-0">
                <Image
                    alt={name}
                    src={isValidImage ? photo : logo}
                    fill
                    className="object-cover bg-[var(--background)] group-hover:scale-110 transition-transform duration-500"
                    sizes="128px"
                />
            </div>
            <div className="w-full flex-1 flex flex-col justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-wide mb-1 group-hover:text-[var(--accent)] transition-colors min-h-[3.25rem] flex items-center justify-center text-center px-1">
                    {name}
                </h3>
                {instagram && instagram !== "@" && instagram !== "" && (
                    <div className="mt-2 w-full flex items-center justify-center font-semibold">
                        <BarberInstagram username={instagram} />
                    </div>
                )}
            </div>
        </div>
    );
}