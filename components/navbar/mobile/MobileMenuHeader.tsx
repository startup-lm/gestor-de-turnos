import LinkBarberLogo from "../LinkBarberLogo";

export default function MobileMenuHeader({ closeMenu }: Readonly<{ closeMenu: () => void; }>) {
    return (
        <div className="flex flex-col items-center p-6">
            <LinkBarberLogo onClick={closeMenu} />
            <h1 className="text-4xl sm:text-5xl font-bold text-center">
                Barbería<br />Hooligans
            </h1>
        </div>
    )
}