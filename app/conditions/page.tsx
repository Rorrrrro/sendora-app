import Header from "@/components/Header";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function ConditionsPage() {
  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Conditions générales d’utilisation</h1>
        <p className="mb-4">
          Les présentes conditions générales régissent l’utilisation de la plateforme <b>Sendora</b> par tout utilisateur. En accédant à la plateforme, vous acceptez sans réserve ces conditions.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">1. Objet</h2>
        <p>
          Sendora propose une solution d’emailing et de gestion de campagnes marketing accessible en ligne, permettant d’importer des contacts, créer des campagnes, suivre des statistiques et automatiser des envois.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">2. Création et gestion du compte</h2>
        <p>
          L’utilisation des services nécessite la création d’un compte. L’utilisateur s’engage à fournir des informations exactes, à les tenir à jour et à préserver la confidentialité de ses identifiants. Toute activité réalisée via le compte est réputée effectuée par l’utilisateur.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">3. Utilisation des services</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Respecter la législation en vigueur (notamment RGPD, anti-spam, etc.)</li>
          <li>Ne pas utiliser la plateforme à des fins illégales, frauduleuses ou contraires à l’ordre public</li>
          <li>Respecter la confidentialité des accès à son compte</li>
          <li>Ne pas porter atteinte aux droits de tiers (propriété intellectuelle, vie privée, etc.)</li>
        </ul>
        <p className="mb-4">
          L’envoi d’e-mails non sollicités (“spam”) est strictement interdit. Chaque utilisateur est tenu de respecter la législation applicable en matière d’email marketing et de recueillir un consentement explicite préalable de ses destinataires.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">4. Propriété intellectuelle</h2>
        <p>
          Tous les contenus, marques, logiciels et technologies présents sur Sendora sont protégés et restent la propriété de leurs titulaires respectifs. Toute reproduction ou utilisation non autorisée est interdite.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">5. Données personnelles</h2>
        <p>
          Les modalités de collecte et de traitement des données sont détaillées dans notre <Link href="/confidentialite" className="underline text-[#6c43e0]">Politique de confidentialité</Link>. L’utilisateur est responsable de la conformité de ses propres fichiers de contacts.
        </p>
        <p className="mb-4">
          Chaque campagne marketing devra comporter un lien de désinscription fonctionnel et permanent. Les utilisateurs de la plateforme sont responsables de la gestion des demandes de retrait de leurs propres listes.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">6. Résiliation</h2>
        <p>
          L’utilisateur peut résilier son compte à tout moment. Sendora se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des présentes conditions ou d’utilisation abusive du service.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">7. Responsabilité</h2>
        <p>
          Sendora ne saurait être tenue responsable des dommages indirects, pertes de données ou préjudices liés à une mauvaise utilisation du service. L’utilisateur est seul responsable du contenu envoyé via la plateforme.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">8. Sécurité</h2>
        <p>
          Sendora met en œuvre des mesures de sécurité pour protéger les données et l’accès à la plateforme, mais ne peut garantir une sécurité absolue. L’utilisateur doit veiller à la sécurité de ses propres accès.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">9. Force majeure</h2>
        <p>
          Aucune des parties ne pourra être tenue responsable en cas d’événement de force majeure rendant impossible l’exécution du contrat (catastrophe, panne majeure, etc.).
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">10. Modification des conditions</h2>
        <p>
          Sendora se réserve le droit de modifier à tout moment les présentes conditions. L’utilisateur sera informé en cas de changement majeur. La version en vigueur est toujours disponible sur cette page.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">11. Loi applicable et juridiction</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux compétents seront ceux du siège de Sendora.
        </p>
        <p className="mt-8 text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>
      <Footer />
    </>
  );
} 