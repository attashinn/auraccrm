import { z } from "zod";

export const onboardingStep1Schema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    companyName: z.string().min(2, "Company name is required").max(255),
    website: z.string().max(500).optional().or(z.literal("")),
    noWebsite: z.boolean().optional(),
  })
  .refine((data) => data.noWebsite || Boolean(data.website?.trim()), {
    message: "Website is required unless you don't have one",
    path: ["website"],
  });

export const onboardingStep2Schema = z.object({
  address: z.string().min(1, "Address is required").max(500),
  country: z.string().min(1, "Country is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  city: z.string().min(1, "City is required").max(100),
});

export const onboardingStep3Schema = z.object({
  teamSize: z.string().min(1, "Please select team size"),
  contactVolume: z.string().min(1, "Please select contact volume"),
  sellsOnline: z.enum(["yes", "no"]),
  marketingConsent: z.boolean(),
});

export const onboardingStep4Schema = z.object({
  primaryGoal: z.string().min(1, "Please select a primary goal"),
});

export type OnboardingStep1 = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2 = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3 = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4 = z.infer<typeof onboardingStep4Schema>;

export type OnboardingData = Partial<
  OnboardingStep1 & OnboardingStep2 & OnboardingStep3 & OnboardingStep4
>;
