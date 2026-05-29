import { User } from "lucide-react";
import RoleLoginPage from "@/components/auth/RoleLoginPage";

export default function StudentLoginPage() {
  return (
    <RoleLoginPage
      role="student"
      title="Sign in as Student"
      description="Use your ITB student email address to access the repository and webinars."
      heroIcon={<User size={24} className="text-blue-600" />}
      successRedirect="/repository"
      mismatchMessage="This login is for students only. Please use the admin login page."
    />
  );
}
