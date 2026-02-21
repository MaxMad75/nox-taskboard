import { Brain } from "lucide-react";
import ComingSoon from "../../components/ComingSoon";

export default function MemoryPage() {
  return (
    <ComingSoon
      icon={Brain}
      title="Memory"
      description="A persistent knowledge base for your team — notes, learnings, decisions, and institutional memory in one place."
      accentColor="#8b5cf6"
    />
  );
}
