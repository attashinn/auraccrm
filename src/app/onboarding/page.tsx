import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const status = await getOnboardingStatusAction();
  if (status.success && !status.needsOnboarding) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      initialStep={status.success ? status.step : 1}
      initialData={status.success && "data" in status ? status.data : undefined}
    />
  );
}
