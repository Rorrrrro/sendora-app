import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="mr-2 h-8 w-8 rounded bg-[#FFFEFF]/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">S</span>
              </div>
              <span className="text-xl font-bold">Sendora</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produits</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Pour les PME
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Pour les Grandes Entreprises
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Intégration IA
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Gestion des Contacts
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Témoignages clients
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Presse
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Carrières
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Ressources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/conditions" className="text-gray-400 hover:text-white">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-gray-400 hover:text-white">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© Sendora 2025</p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a6.25 6.25 0 1 1-6.25 6.25 6.25 6.25 0 0 1 6.25-6.25zm0 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6.25 1.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
                />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M19.633 7.997c.013.176.013.353.013.53 0 5.386-4.099 11.6-11.6 11.6-2.307 0-4.453-.676-6.26-1.84.324.038.636.05.972.05 1.92 0 3.684-.655 5.09-1.755-1.8-.037-3.322-1.22-3.843-2.85.25.037.5.062.763.062.367 0 .735-.05 1.078-.138-1.877-.375-3.29-2.03-3.29-4.017v-.05c.553.307 1.19.49 1.867.514a4.07 4.07 0 0 1-1.81-3.39c0-.75.2-1.45.553-2.05a11.61 11.61 0 0 0 8.42 4.27c-.062-.3-.1-.6-.1-.92a4.07 4.07 0 0 1 7.04-3.71 8.1 8.1 0 0 0 2.58-.98 4.07 4.07 0 0 1-1.79 2.25 8.13 8.13 0 0 0 2.34-.64 8.73 8.73 0 0 1-2.03 2.11z"
                />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">YouTube</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21.8 8.001s-.2-1.4-.8-2c-.7-.8-1.5-.8-1.9-.9C16.1 5 12 5 12 5h-.1s-4.1 0-7.1.1c-.4.1-1.2.1-1.9.9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.6c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.9.1 6.9.1s4.1 0 7.1-.1c.4-.1 1.2-.1 1.9-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.6c0-1.6-.2-3.2-.2-3.2zM9.8 15.2V8.8l6.4 3.2-6.4 3.2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 