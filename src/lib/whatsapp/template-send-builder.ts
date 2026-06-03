import type { Contact } from "@prisma/client";

/**
 * Resolves standard dynamic template variables like {{firstName}}, {{lastName}}, {{companyName}}, {{email}}
 * and maps them to Meta template parameter components.
 */
export function resolveTemplateVariables(
  bodyText: string,
  contact: Contact,
  fallbackValue: string = "Valued Customer"
): any[] {
  // Find all instances of double curly braces {{variableName}} or {{1}}, {{2}}
  // Meta uses ordered parameters: parameter 1 matches {{1}}, parameter 2 matches {{2}}, etc.
  // WACRM allows user-defined tags that compile to sequential array parameters.
  
  const parameters: any[] = [];
  
  // Let's search for matches like {{firstName}} or {{lastName}} or general placeholders
  // and map them sequentially based on their appearance.
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(bodyText)) !== null) {
    const varName = match[1].trim().toLowerCase();
    let resolvedValue = "";

    if (varName === "firstname" || varName === "first_name") {
      resolvedValue = contact.firstName || "";
    } else if (varName === "lastname" || varName === "last_name") {
      resolvedValue = contact.lastName || "";
    } else if (varName === "name") {
      resolvedValue = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    } else if (varName === "email") {
      resolvedValue = contact.email || "";
    } else if (varName === "company" || varName === "companyname" || varName === "company_name") {
      resolvedValue = contact.companyName || "";
    } else if (varName === "phone") {
      resolvedValue = contact.phone || "";
    } else {
      // Numerical placeholders like {{1}} or custom fields
      resolvedValue = fallbackValue;
    }

    parameters.push({
      type: "text",
      text: resolvedValue || fallbackValue,
    });
  }

  // If parameters are empty, but Meta template is configured, it means there are no variables.
  return parameters.length > 0 ? [{ type: "body", parameters }] : [];
}
