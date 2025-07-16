import Header from "@/components/Header";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Politique de confidentialité</h1>
        <p className="mb-4">
          Chez <b>Sendora</b>, la protection de vos données personnelles et de votre vie privée est une priorité. Nous nous engageons à respecter la réglementation en vigueur, notamment le RGPD et la loi Informatique et Libertés.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">1. Qui est responsable de vos données ?</h2>
        <p>
          Sendora, société éditrice de la plateforme, est responsable du traitement de vos données personnelles. Pour toute question, contactez-nous à <a href="mailto:contact@sendora.fr" className="underline text-[#6c43e0]">contact@sendora.fr</a>.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">2. Quelles données collectons-nous ?</h2>
        <p>
          Nous collectons uniquement les données nécessaires à la création de votre compte, à l’utilisation de nos services et à l’amélioration de votre expérience : nom, prénom, email, informations de connexion, statistiques d’utilisation, et données techniques (adresse IP, logs, cookies).
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">3. Pourquoi utilisons-nous vos données ?</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Envoi d’e-mails transactionnels (confirmation de compte, réinitialisation de mot de passe, etc.)</li>
          <li>(Prochainement) Envoi d’e-mails marketing à vos propres contacts, sous votre responsabilité</li>
          <li>Support client et assistance</li>
          <li>Amélioration de nos services et statistiques d’utilisation</li>
          <li>Respect de nos obligations légales et lutte contre la fraude</li>
        </ul>
        <h2 className="text-xl font-semibold mt-8 mb-2">4. Base légale des traitements</h2>
        <p>
          Vos données sont traitées sur la base de l’exécution du contrat (création et gestion de votre compte), de votre consentement (newsletter, cookies non essentiels) ou de notre intérêt légitime (sécurité, amélioration du service).
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">5. Qui a accès à vos données ?</h2>
        <p>
          Vos données sont accessibles uniquement par les équipes de Sendora et nos prestataires techniques (hébergement, emailing, analytics), dans le strict cadre de la fourniture du service. Nous ne vendons ni ne louons jamais vos données à des tiers.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">6. Sous-traitants et transferts hors UE</h2>
        <p>
          Certaines données (notamment les e-mails) sont traitées via Amazon Web Services (AWS), qui héberge l’infrastructure d’envoi. Lorsque ces données sont transférées hors de l’Union européenne, nous nous assurons que des garanties adéquates sont en place (clauses contractuelles types).
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir la sécurité et la confidentialité de vos données : chiffrement, contrôle d’accès, sauvegardes, audits réguliers, etc.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">8. Durée de conservation</h2>
        <p>
          Vos données sont conservées tant que votre compte est actif, puis supprimées à votre demande ou après une période d’inactivité (2 ans maximum pour les comptes inactifs). Certaines données peuvent être conservées plus longtemps pour répondre à nos obligations légales.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">9. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement. Pour exercer vos droits, contactez-nous à <a href="mailto:contact@sendora.fr" className="underline text-[#6c43e0]">contact@sendora.fr</a>.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">10. Cookies</h2>
        <p>
          Nous utilisons des cookies pour améliorer votre expérience, mesurer l’audience et sécuriser la plateforme. Vous pouvez gérer vos préférences dans votre navigateur ou via le bandeau cookies.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">11. Gestion des incidents</h2>
        <p>
          En cas de violation de données personnelles, nous vous informerons dans les meilleurs délais conformément à la réglementation.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-2">12. Modification de la politique</h2>
        <p>
          Nous pouvons modifier la présente politique à tout moment : la version en vigueur est toujours disponible sur cette page. Vous serez informé en cas de changement majeur.
        </p>
        <p className="mt-8 text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>
      <Footer />
    </>
  );
} 