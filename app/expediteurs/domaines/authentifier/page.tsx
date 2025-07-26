import { Suspense } from "react";
import AuthentifierDomaineClient from "./AuthentifierDomaineClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AuthentifierDomaineClient />
    </Suspense>
  );
} 