import Image from "next/image";
import BarberInstagram from "./BarberInstagram";
import logo from "@/public/images/logo.png";

export default function BarberCard({ name, photo, instagram }: Readonly<{ name: string; photo: string; instagram: string; }>) {
    const isValidImage = photo && photo !== "null" && photo !== "";

    return (
        <div className="border rounded-lg p-4 text-center bg-[var(--accent)] border border-[var(--primary)] shadow" >
            <div className="w-48 h-48 overflow-hidden rounded-lg mb-4">
                <Image
                    alt={name}
                    src={isValidImage ? photo : logo}
                    width={200}
                    height={200}
                    className="object-cover bg-[var(--background)] w-full h-full"
                />
            </div>
            <h3 className="heading-black font-bold mb-2">{name}</h3>
            {instagram && instagram !== "@" && instagram !== "" && (
                <p className="mt-2 flex items-center justify-center font-semibold gap-2">
                    <BarberInstagram username={instagram} />
                </p>
            )}
        </div>
    )
}