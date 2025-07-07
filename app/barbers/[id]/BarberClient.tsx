"use client";

import { useState, useMemo } from "react";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import { uploadImage } from "@/lib/repository/storage";
import { updateBarber } from "@/lib/repository/barbers";
import Image from "next/image";
import SaveButton from "@/components/buttons/SaveButton";
import { Barber } from "@/lib/types/Barbers";
import { updatePassword } from "@/lib/repository/auth";
import { useRouter } from "next/navigation";
import InputPassword from "@/components/input/InputPassword";

export default function BarberClient({ barber }: { barber: Barber }) {
    const router = useRouter();
    const [name, setName] = useState(barber.name);
    const [email, setEmail] = useState(barber.email);
    const [instagram, setInstagram] = useState(barber.instagram);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const popup = usePopup();
    const hasChanges = useMemo(() => {
        const changedPassword = password.length >= 6 && password === confirmPassword;
        return (
            name !== barber.name ||
            email !== barber.email ||
            instagram !== (barber.instagram || "") ||
            imageFile !== null ||
            changedPassword
        );
    }, [name, email, instagram, imageFile, barber, password, confirmPassword]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges) return;
        const wantsToChangePassword = password.length > 0 || confirmPassword.length > 0;
        if (wantsToChangePassword) {
            if (password.length < 6) {
                popup.open("La contraseña debe tener al menos 6 caracteres", false);
                return;
            }
            if (password !== confirmPassword) {
                popup.open("Las contraseñas no coinciden", false);
                return;
            }
        }
        setLoading(true);
        let imageUrl = barber.image || "";
        if (imageFile) {
            try {
                imageUrl = await uploadImage("barbers", imageFile);
            } catch {
                popup.open("Error al subir la imágen. La imágen es demasiado grande", false);
                setLoading(false);
                return;
            }
        }
        const barberUpdated = await updateBarber(barber.id!, { name, email, instagram, image: imageUrl, });
        let passwordUpdated = true;
        if (wantsToChangePassword) passwordUpdated = await updatePassword(confirmPassword);
        const success = barberUpdated && passwordUpdated;
        popup.open(success ? "Barbero actualizado correctamente" : "Error al actualizar el barbero", success);
        setPassword("");
        setConfirmPassword("");
        setLoading(false);
    };

    return (
        <div className="p-6 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-10 text-center">Mi Perfil</h1>
            <div className="bg-[var(--bg-carousel)] py-6 rounded-xl shadow-md w-full max-w-md">
                <form onSubmit={handleSave} className="px-16">
                    <div className="text-left rounded-2lg mt-5 shadow-lg">
                        <div className="flex flex-col items-center justify-center mb-4">
                            <label className="cursor-pointer">
                                <Image src={barber.image || "/images/logo_hooligans.png"} alt={barber.name} width={128} height={128} className="w-32 h-32 rounded-full object-cover bg-[var(--background)]" />
                                <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="hidden" />
                            </label>
                        </div>


                        <label className="block text-sm font-medium mb-1 mt-4">
                            Nombre
                        </label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="border p-2 rounded w-full" />

                        <label className="block text-sm font-medium mb-1 mt-4">
                            Instagram
                        </label>
                        <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} required placeholder="@instagram" className="border p-2 rounded w-full" />

                        <label className="block text-sm font-medium mb-1 mt-4">
                            Email
                        </label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tumail@gmail.com" className="border p-2 rounded w-full" />

                        <InputPassword
                            label="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            error={password && password.length < 6 ? "La contraseña debe tener al menos 6 caracteres." : undefined}
                        />

                        <InputPassword
                            label="Confirmar nueva contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="******"
                            error={confirmPassword && confirmPassword !== password ? "Las contraseñas no coinciden." : undefined}
                        />
                    </div>


                    <div className="flex justify-center mt-10">
                        <SaveButton type="submit" loading={loading} disabled={!hasChanges} />
                    </div>
                </form>
            </div>

            {popup.show && (
                <PopupModal message={popup.message} success={popup.success}
                    onClose={() => {
                        popup.close();
                        if (popup.success) router.refresh();
                    }}
                />
            )}
        </div>
    );
}
