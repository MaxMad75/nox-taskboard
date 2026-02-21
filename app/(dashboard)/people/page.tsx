import { Users } from "lucide-react";
import ComingSoon from "../../components/ComingSoon";

export default function PeoplePage() {
  return (
    <ComingSoon
      icon={Users}
      title="People"
      description="Team directory, profiles, and contact info — know who's who and how to reach them."
      accentColor="#ec4899"
    />
  );
}
