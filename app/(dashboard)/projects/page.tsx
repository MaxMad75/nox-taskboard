import { FolderKanban } from "lucide-react";
import ComingSoon from "../../components/ComingSoon";

export default function ProjectsPage() {
  return (
    <ComingSoon
      icon={FolderKanban}
      title="Projects"
      description="Organize your work into projects, track milestones, and see the big picture across all your initiatives."
      accentColor="#6366f1"
    />
  );
}
