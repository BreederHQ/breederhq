// packages/ui/src/utils/templates.ts
// Template variable substitution utilities

import type { TemplateVariableContext } from "@bhq/api";

/**
 * Applies variable substitution to a template string.
 * Variables use the format {{variable_name}}
 *
 * @example
 * applyTemplateVariables(
 *   "Hello {{first_name}}, thank you for your interest in {{animal_name}}!",
 *   { firstName: "John", animalName: "Bella" }
 * )
 * // Returns: "Hello John, thank you for your interest in Bella!"
 */
export function applyTemplateVariables(
  template: string,
  context: TemplateVariableContext
): string {
  // Map context properties to their template variable names
  const variableMap: Record<string, string | undefined> = {
    contact_name: context.contactName,
    first_name: context.firstName,
    organization_name: context.organizationName,
    my_name: context.myName,
    my_business: context.myBusiness,
    animal_name: context.animalName,
    litter_name: context.litterName,
    // Add any custom fields
    ...context.customFields,
  };

  // Replace all {{variable}} patterns
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = variableMap[variableName];
    // If variable not found, leave the placeholder (so user can see what's missing)
    return value !== undefined ? value : match;
  });
}

/**
 * Extracts variable names from a template string.
 *
 * @example
 * extractTemplateVariables("Hello {{first_name}}, welcome to {{my_business}}!")
 * // Returns: ["first_name", "my_business"]
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  // Extract variable names and dedupe
  const variables = matches.map(m => m.replace(/\{\{|\}\}/g, ""));
  return [...new Set(variables)];
}

/**
 * Checks if all required variables in a template have values in the context.
 * Returns list of missing variable names.
 */
export function getMissingVariables(
  template: string,
  context: TemplateVariableContext
): string[] {
  const variables = extractTemplateVariables(template);

  const variableMap: Record<string, string | undefined> = {
    contact_name: context.contactName,
    first_name: context.firstName,
    organization_name: context.organizationName,
    my_name: context.myName,
    my_business: context.myBusiness,
    animal_name: context.animalName,
    litter_name: context.litterName,
    ...context.customFields,
  };

  return variables.filter(v => !variableMap[v]);
}

/**
 * Creates a preview of a template with sample/placeholder values.
 * Useful for showing templates in the picker without real data.
 */
export function createTemplatePreview(template: string): string {
  const sampleValues: Record<string, string> = {
    contact_name: "John Smith",
    first_name: "John",
    organization_name: "Smith Family Kennel",
    my_name: "Your Name",
    my_business: "Your Business",
    animal_name: "Bella",
    litter_name: "Spring 2024 Litter",
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    return sampleValues[variableName] || `[${variableName}]`;
  });
}

/**
 * Inserts a variable placeholder at the cursor position in a string.
 * Returns the new string and the new cursor position.
 */
export function insertVariable(
  text: string,
  cursorPosition: number,
  variableName: string
): { text: string; cursorPosition: number } {
  const variable = `{{${variableName}}}`;
  const newText =
    text.slice(0, cursorPosition) +
    variable +
    text.slice(cursorPosition);

  return {
    text: newText,
    cursorPosition: cursorPosition + variable.length,
  };
}
