import { FileText } from "lucide-react";
import ComingSoon from "../../components/ComingSoon";

export default function DocsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Docs"
      description="Collaborative documentation, runbooks, and guides — everything your team needs to know, right where you work."
      accentColor="#3b82f6"
    />
  );
}
