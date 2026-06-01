"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { OnboardingShell } from "./onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveOnboardingStep1Action,
  saveOnboardingStep2Action,
  saveOnboardingStep3Action,
  saveOnboardingStep4Action,
  completeOnboardingAction,
} from "@/actions/onboarding";
import type { OnboardingData } from "@/lib/validations/onboarding";

const TOTAL_STEPS = 5;

const TEAM_SIZES = [
  { value: "solo", label: "Just me" },
  { value: "2-5", label: "2–5 people" },
  { value: "6-10", label: "6–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "201+", label: "201+ people" },
];

const CONTACT_VOLUMES = [
  { value: "0-500", label: "Up to 500" },
  { value: "500-2000", label: "500 – 2,000" },
  { value: "2000-10000", label: "2,000 – 10,000" },
  { value: "10000+", label: "10,000+" },
];

const PRIMARY_GOALS = [
  { value: "leads", label: "Manage leads & pipelines" },
  { value: "deals", label: "Track deals & revenue" },
  { value: "team", label: "Team collaboration" },
  { value: "relationships", label: "Customer relationships" },
  { value: "all", label: "All of the above" },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Bangladesh",
  "India",
  "Other",
];

const selectClass =
  "flex h-11 w-full rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-foreground input-focus transition-all appearance-none cursor-pointer";

type OnboardingWizardProps = {
  initialStep?: number;
  initialData?: OnboardingData;
};

export function OnboardingWizard({ initialStep = 1, initialData = {} }: OnboardingWizardProps) {
  const router = useRouter();
  const { setActive, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<OnboardingData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [step1, setStep1] = useState({
    firstName: draft.firstName ?? "",
    lastName: draft.lastName ?? "",
    companyName: draft.companyName ?? "",
    website: draft.website ?? "",
    noWebsite: draft.noWebsite ?? false,
  });

  const [step2, setStep2] = useState({
    address: draft.address ?? "",
    country: draft.country ?? "",
    postalCode: draft.postalCode ?? "",
    city: draft.city ?? "",
  });

  const [step3, setStep3] = useState({
    teamSize: draft.teamSize ?? "",
    contactVolume: draft.contactVolume ?? "",
    sellsOnline: (draft.sellsOnline as "yes" | "no") ?? "no",
    marketingConsent: draft.marketingConsent ?? false,
  });

  const [step4, setStep4] = useState({
    primaryGoal: draft.primaryGoal ?? "",
  });

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const activateOrg = useCallback(
    async (organizationId: string) => {
      if (!setActive) return;
      await setActive({ organization: organizationId });
    },
    [setActive]
  );

  const handleContinue = () => {
    setError(null);
    startTransition(async () => {
      if (step === 1) {
        const payload = {
          ...step1,
          website: step1.noWebsite ? "" : step1.website,
        };
        const res = await saveOnboardingStep1Action(payload);
        if (!res.success) {
          setError(res.error);
          return;
        }
        setDraft((d) => ({ ...d, ...res.data }));
        setStep(2);
        return;
      }

      if (step === 2) {
        const res = await saveOnboardingStep2Action(step2, { ...draft, ...step1 });
        if (!res.success) {
          setError(res.error);
          return;
        }
        setDraft(res.data);
        setStep(3);
        return;
      }

      if (step === 3) {
        const merged = { ...draft, ...step1, ...step2 };
        const res = await saveOnboardingStep3Action(step3, merged);
        if (!res.success) {
          setError(res.error);
          return;
        }
        setDraft(res.data);
        if (res.organizationId && orgListLoaded) {
          await activateOrg(res.organizationId);
        }
        setStep(4);
        router.refresh();
        return;
      }

      if (step === 4) {
        const res = await saveOnboardingStep4Action(step4, draft);
        if (!res.success) {
          setError(res.error);
          return;
        }
        setDraft(res.data);
        setStep(5);
        return;
      }

      if (step === 5) {
        const res = await completeOnboardingAction(draft);
        if (!res.success) {
          setError(res.error);
          return;
        }
        router.push("/dashboard");
      }
    });
  };

  const illustrationLabels: Record<number, string> = {
    1: "Step 1 — Your profile",
    2: "Step 2 — Company details",
    3: "Step 3 — Organization",
    4: "Step 4 — Your goals",
    5: "Step 5 — Ready to go",
  };

  return (
    <OnboardingShell
      step={step}
      totalSteps={TOTAL_STEPS}
      illustrationLabel={illustrationLabels[step]}
    >
      {step === 1 && (
        <StepBasics
          values={step1}
          onChange={setStep1}
          error={error}
          pending={pending}
          onContinue={handleContinue}
        />
      )}
      {step === 2 && (
        <StepCompany
          values={step2}
          onChange={setStep2}
          error={error}
          pending={pending}
          onBack={goBack}
          onContinue={handleContinue}
        />
      )}
      {step === 3 && (
        <StepOrganization
          values={step3}
          onChange={setStep3}
          error={error}
          pending={pending}
          onBack={goBack}
          onContinue={handleContinue}
        />
      )}
      {step === 4 && (
        <StepGoals
          values={step4}
          onChange={setStep4}
          error={error}
          pending={pending}
          onBack={goBack}
          onContinue={handleContinue}
        />
      )}
      {step === 5 && (
        <StepComplete
          companyName={draft.companyName ?? "your workspace"}
          error={error}
          pending={pending}
          onBack={goBack}
          onContinue={handleContinue}
        />
      )}
    </OnboardingShell>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
        {title}
      </h1>
      <p className="mt-3 text-base text-muted max-w-lg">{description}</p>
    </div>
  );
}

function FormActions({
  onBack,
  onContinue,
  pending,
  continueLabel = "Continue",
}: {
  onBack?: () => void;
  onContinue: () => void;
  pending: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="mt-12 flex items-center justify-between gap-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="text-sm font-semibold text-[#5B5BD6] hover:underline disabled:opacity-50"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={onContinue}
        disabled={pending}
        className="min-w-[140px] rounded-full"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : continueLabel}
      </Button>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-2">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  );
}

function StepBasics({
  values,
  onChange,
  error,
  pending,
  onContinue,
}: {
  values: {
    firstName: string;
    lastName: string;
    companyName: string;
    website: string;
    noWebsite: boolean;
  };
  onChange: (v: typeof values) => void;
  error: string | null;
  pending: boolean;
  onContinue: () => void;
}) {
  return (
  <>
    <StepHeader
      title="Let's start with the basics."
      description="First, we need to know a few things about you."
    />
    <ErrorBanner message={error} />
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>First name</FieldLabel>
          <Input
            value={values.firstName}
            onChange={(e) => onChange({ ...values, firstName: e.target.value })}
            placeholder="Jane"
          />
        </div>
        <div>
          <FieldLabel required>Last name</FieldLabel>
          <Input
            value={values.lastName}
            onChange={(e) => onChange({ ...values, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>
      </div>
      <div>
        <FieldLabel required>Company name</FieldLabel>
        <Input
          value={values.companyName}
          onChange={(e) => onChange({ ...values, companyName: e.target.value })}
          placeholder="Acme Inc."
        />
      </div>
      <div>
        <FieldLabel>Website</FieldLabel>
        <Input
          value={values.website}
          onChange={(e) => onChange({ ...values, website: e.target.value })}
          placeholder="www.example.com"
          disabled={values.noWebsite}
        />
        <p className="mt-2 text-xs text-muted">
          Example: www.mywebsite.com or https://www.mywebsite.com/
        </p>
        <label className="mt-4 flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={values.noWebsite}
            onChange={(e) => onChange({ ...values, noWebsite: e.target.checked, website: "" })}
            className="h-4 w-4 rounded border-border accent-foreground"
          />
          <span className="text-sm text-foreground">I don&apos;t have a website</span>
        </label>
      </div>
    </div>
    <FormActions onContinue={onContinue} pending={pending} />
  </>
  );
}

function StepCompany({
  values,
  onChange,
  error,
  pending,
  onBack,
  onContinue,
}: {
  values: { address: string; country: string; postalCode: string; city: string };
  onChange: (v: typeof values) => void;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <StepHeader
        title="Now some information about your company"
        description="This helps us personalize your workspace and reporting."
      />
      <ErrorBanner message={error} />
      <div className="space-y-6">
        <div>
          <FieldLabel required>Address</FieldLabel>
          <Input
            value={values.address}
            onChange={(e) => onChange({ ...values, address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>
        <div>
          <FieldLabel required>Country</FieldLabel>
          <select
            className={selectClass}
            value={values.country}
            onChange={(e) => onChange({ ...values, country: e.target.value })}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel required>Postal code</FieldLabel>
            <Input
              value={values.postalCode}
              onChange={(e) => onChange({ ...values, postalCode: e.target.value })}
              placeholder="10001"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel required>City</FieldLabel>
            <Input
              value={values.city}
              onChange={(e) => onChange({ ...values, city: e.target.value })}
              placeholder="New York"
            />
          </div>
        </div>
      </div>
      <FormActions onBack={onBack} onContinue={onContinue} pending={pending} />
    </>
  );
}

function StepOrganization({
  values,
  onChange,
  error,
  pending,
  onBack,
  onContinue,
}: {
  values: {
    teamSize: string;
    contactVolume: string;
    sellsOnline: "yes" | "no";
    marketingConsent: boolean;
  };
  onChange: (v: typeof values) => void;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <StepHeader
        title="Tell us about your organization"
        description="Your answers help us recommend the best setup for your CRM."
      />
      <ErrorBanner message={error} />
      <div className="space-y-6">
        <div>
          <FieldLabel required>How many people are on your team?</FieldLabel>
          <select
            className={selectClass}
            value={values.teamSize}
            onChange={(e) => onChange({ ...values, teamSize: e.target.value })}
          >
            <option value="">Select team size</option>
            {TEAM_SIZES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel required>How many contacts do you need to manage?</FieldLabel>
          <select
            className={selectClass}
            value={values.contactVolume}
            onChange={(e) => onChange({ ...values, contactVolume: e.target.value })}
          >
            <option value="">Select volume</option>
            {CONTACT_VOLUMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel required>Do you sell online?</FieldLabel>
          <div className="flex gap-6 mt-2">
            {(["yes", "no"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sellsOnline"
                  checked={values.sellsOnline === opt}
                  onChange={() => onChange({ ...values, sellsOnline: opt })}
                  className="h-4 w-4 accent-foreground"
                />
                <span className="text-sm text-foreground capitalize">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={values.marketingConsent}
            onChange={(e) => onChange({ ...values, marketingConsent: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-border accent-foreground shrink-0"
          />
          <span className="text-sm text-muted leading-relaxed">
            I agree to receive product updates and tips from AuraCRM. You can unsubscribe anytime.
            See our privacy policy for details.
          </span>
        </label>
      </div>
      <FormActions onBack={onBack} onContinue={onContinue} pending={pending} />
    </>
  );
}

function StepGoals({
  values,
  onChange,
  error,
  pending,
  onBack,
  onContinue,
}: {
  values: { primaryGoal: string };
  onChange: (v: typeof values) => void;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <StepHeader
        title="What do you want to achieve?"
        description="We'll tailor your dashboard and defaults to match your goals."
      />
      <ErrorBanner message={error} />
      <div className="space-y-3">
        {PRIMARY_GOALS.map((goal) => (
          <label
            key={goal.value}
            className={`flex items-center gap-4 p-4 rounded-[28px] border cursor-pointer transition-colors ${
              values.primaryGoal === goal.value
                ? "border-foreground bg-[rgba(199,244,100,0.15)]"
                : "border-border bg-surface hover:border-[rgba(17,17,17,0.2)]"
            }`}
          >
            <input
              type="radio"
              name="primaryGoal"
              checked={values.primaryGoal === goal.value}
              onChange={() => onChange({ primaryGoal: goal.value })}
              className="h-4 w-4 accent-foreground shrink-0"
            />
            <span className="text-sm font-medium text-foreground">{goal.label}</span>
          </label>
        ))}
      </div>
      <FormActions onBack={onBack} onContinue={onContinue} pending={pending} />
    </>
  );
}

function StepComplete({
  companyName,
  error,
  pending,
  onBack,
  onContinue,
}: {
  companyName: string;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <StepHeader
        title="You're all set"
        description={`${companyName} is ready. Start managing leads, deals, and tasks from your dashboard.`}
      />
      <ErrorBanner message={error} />
      <ul className="space-y-4 text-sm text-muted">
        <li className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          Workspace created and synced
        </li>
        <li className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          CRM modules enabled for your team size
        </li>
        <li className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          Dashboard personalized to your goals
        </li>
      </ul>
      <FormActions
        onBack={onBack}
        onContinue={onContinue}
        pending={pending}
        continueLabel="Go to dashboard"
      />
    </>
  );
}
