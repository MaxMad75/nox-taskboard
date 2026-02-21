import { UsersRound } from "lucide-react";
import ComingSoon from "../../components/ComingSoon";

export default function TeamPage() {
  return (
    <ComingSoon
      icon={UsersRound}
      title="Team"
      description="Team management, roles, permissions, and org structure — everything to keep your crew organized and aligned."
      accentColor="#22c55e"
    />
  );
}
