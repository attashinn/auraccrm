export const clerkLightAppearance = {
  variables: {
    colorPrimary: "#C7F464",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F4F5F1",
    colorInputBorder: "rgba(17, 17, 17, 0.1)",
    colorText: "#111111",
    colorTextSecondary: "#777777",
    borderRadius: "16px",
  },
  elements: {
    card: "shadow-[var(--shadow-soft)] border border-[rgba(17,17,17,0.08)] rounded-[28px]",
    formButtonPrimary:
      "bg-[#111111] hover:bg-[#2a2a2a] text-white rounded-full",
    organizationSwitcherTrigger:
      "rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white hover:bg-[#F4F5F1]",
    organizationListCellPrefix: "text-[#777777]",
  },
} as const;
