"use client";
import dynamic from "next/dynamic";
const App = dynamic(() => import("@/components/App"), { ssr: false });
export default function EditorPage({ params }: { params: { id: string } }) {
  return <App manuscriptId={Number(params.id)} />;
}
