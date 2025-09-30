"use client";
import dynamic from "next/dynamic";
import Head from "next/head";

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

export default function Page() {
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

