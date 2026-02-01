import { useParams } from "react-router-dom";
import { tools } from "../data/tools.js";
import * as Icons from "lucide-react";

export default function ToolDetails() {
  const { id } = useParams();
  const tool = tools.find(t => t.id === id);
  if (!tool) return <div className="text-center py-20 text-greyMedium">Tool not found.</div>;
  const Icon = Icons[tool.icon] || Icons.Tool;
  return (
    <section className="max-w-xl mx-auto bg-offwhite2 rounded-xl shadow-card p-8 mt-8">
      <div className="flex items-center gap-4 mb-4">
        <Icon size={36} className="text-primary" />
        <h1 className="text-2xl font-bold text-black">{tool.name}</h1>
      </div>
      <p className="text-greyMedium mb-4">{tool.description}</p>
      <span className={`inline-block px-4 py-2 rounded-xl text-xs font-bold ${tool.tier === "free" ? "bg-greyLight text-greyMedium" : "bg-primary text-offwhite"}`}>{tool.tier.charAt(0).toUpperCase() + tool.tier.slice(1)}</span>
      <div className="mt-6 text-sm text-greyMedium">Category: {tool.category}</div>
    </section>
  );
}
