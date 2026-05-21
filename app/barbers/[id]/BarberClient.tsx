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
import logo from "@/public/images/logo.png";
import { User, Mail, Camera, KeyRound, Instagram } from "lucide-react";

export default function BarberClient({ barber }: { barber: Barber }) {
    const router = useRouter();
    const [name, setName] = useState(barber.name);
    const [email, setEmail] = useState(barber.email);
    const [instagram, setInstagram] = useState<string>(barber.instagram ?? "");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const popup = usePopup();

    const norm = (value: string | null | undefined) => (value ?? "").trim();
    
    const hasChanges = useMemo(() => {
        const changedPassword = password.length >= 6 && password === confirmPassword;
        return (
            name !== barber.name ||
            email !== barber.email ||
            norm(instagram) !== norm(barber.instagram) ||
            imageFile !== null ||
            changedPassword
        );
    }, [name, email, instagram, imageFile, barber, password, confirmPassword]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

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
        const barberUpdated = await updateBarber(barber.id!, { name, email, instagram: norm(instagram), image: imageUrl, });
        let passwordUpdated = true;
        if (wantsToChangePassword) passwordUpdated = await updatePassword(confirmPassword);
        const success = barberUpdated && passwordUpdated;
        popup.open(success ? "Barbero actualizado correctamente" : "Error al actualizar el barbero", success);
        setPassword("");
        setConfirmPassword("");
        setImageFile(null);
        setLoading(false);
    };

    const currentImageUrl = imagePreview || barber.image || logo;

    return (
        <div className="p-5 flex flex-col items-center text-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <h1 className="text-3xl font-bold mb-5 relative z-10">
                Mi Perfil
            </h1>

            <div className="relative z-10 w-full max-w-md bg-[#0a0f1d]/85 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] p-8 sm:p-10">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Contenedor del Avatar Circular */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative group">
                            <label className="cursor-pointer block relative">
                                <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-tr from-[var(--accent)] to-[#fcebb6] shadow-lg transition-transform duration-300 group-hover:scale-105">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative">
                                        <Image
                                            src={currentImageUrl}
                                            alt={name}
                                            width={120}
                                            height={120}
                                            unoptimized
                                            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
                                        />
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                                            <span className="text-white text-xs font-semibold tracking-wider uppercase">Cambiar</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Badge de Cámara */}
                                <div className="absolute bottom-1 right-1 p-2.5 bg-[var(--accent)] text-[var(--primary)] rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-md border border-[#fcebb6]/30">
                                    <Camera className="w-4 h-4" />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-3">
                            Haz clic para subir foto
                        </span>
                    </div>

                    {/* SECCIÓN 1: DATOS PERSONALES */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                            <User className="w-4 h-4 text-[var(--accent)]" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                Información Personal
                            </h2>
                        </div>

                        <div className="space-y-3 text-left">
                            {/* Nombre */}
                            <div>
                                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                                    Nombre
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all !rounded-xl !pl-10 !pr-4 !py-3 !w-full !block !text-sm placeholder:text-slate-500"
                                        placeholder="Nombre completo"
                                    />
                                </div>
                            </div>

                            {/* Instagram */}
                            <div>
                                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                                    Instagram
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Instagram className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={instagram}
                                        onChange={(e) => setInstagram(e.target.value)}
                                        placeholder="@instagram"
                                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all !rounded-xl !pl-10 !pr-4 !py-3 !w-full !block !text-sm placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="tumail@gmail.com"
                                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all !rounded-xl !pl-10 !pr-4 !py-3 !w-full !block !text-sm placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: SEGURIDAD */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                            <KeyRound className="w-4 h-4 text-[var(--accent)]" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                Seguridad
                            </h2>
                        </div>

                        <div className="space-y-1 text-left">
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
                    </div>

                    {/* Botón de Guardar */}
                    <div className="flex justify-center pt-4">
                        <div className="w-[200px]">
                            <SaveButton type="submit" loading={loading} disabled={!hasChanges} />
                        </div>
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
