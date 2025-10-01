"use client";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/user-context";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

const StripoEditor = dynamic(
  () => import("@/components/StripoEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center">
        Chargement de l'éditeur Stripo...
      </div>
    ),
  }
);

function EditorContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/connexion");
    }
  }, [user, isLoading, router]);

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
        <StripoEditor />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center">
        Chargement de l'éditeur Stripo...
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

