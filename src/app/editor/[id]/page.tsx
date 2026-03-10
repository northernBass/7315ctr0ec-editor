"use client";
import { use } from "react";
import dynamic from "next/dynamic";
const App = dynamic(() => import("@/components/App"), { ssr: false });
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <App manuscriptId={Number(id)} />;
}
