import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { clerkLightAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="h-9 w-9 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-sm font-black text-foreground">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight">AuraCRM</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <SignIn appearance={clerkLightAppearance} />
      </div>
    </div>
  );
}
