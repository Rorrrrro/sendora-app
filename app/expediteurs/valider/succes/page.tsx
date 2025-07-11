import { CheckCircle2 } from "lucide-react";

export default function ValiderExpediteurSucces() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-green-700 mb-4">Adresse validée !</h1>
        <p className="mb-2 text-gray-700 text-base text-center">
          Votre adresse d'expéditeur a bien été validée.<br />
          Vous pouvez maintenant envoyer des emails avec cette adresse.
        </p>
      </div>
    </div>
  );
} 