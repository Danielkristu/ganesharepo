import { ShieldCheck } from "lucide-react";
import RoleLoginPage from "@/components/auth/RoleLoginPage";

export default function AdminLoginPage() {
  return (
    <RoleLoginPage
      role="admin"
      title="Sign in as Admin"
      description="Use your ITB faculty email address to manage documents and rooms."
      heroIcon={<ShieldCheck size={24} className="text-white" />}
      successRedirect="/dashboard"
      mismatchMessage="You do not have Admin privileges."
    />
  );
}
