import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="/Sendora.png" alt="Sendora Logo" className="h-20 w-auto object-contain" />
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white">
              Tarifs
            </a>
            <a href="#company" className="text-gray-300 hover:text-white">
              Entreprise
            </a>
            <a href="#resources" className="text-gray-300 hover:text-white">
              Ressources
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/connexion" className="px-4 py-2 rounded-full text-white hover:bg-[#FFFEFF]/10 transition-colors">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="px-4 py-2 rounded-full bg-primary/90 text-white hover:bg-primary transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 