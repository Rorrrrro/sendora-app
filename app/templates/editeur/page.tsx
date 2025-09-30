"use client";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/dashboard-layout";
import { useUser } from "@/contexts/user-context";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

const UnlayerEditor = dynamic(
  () => import("@/components/UnlayerEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center">
        Chargement de l'éditeur...
      </div>
    ),
  }
);

function EditorContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/connexion");
    }
  }, [user, isLoading, router]);

  // Afficher un écran de chargement pendant la vérification
  if (isLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        Vérification de l'authentification...
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
      <div style={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10
      }}>
        <UnlayerEditor />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center">
        Chargement de l'éditeur...
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

