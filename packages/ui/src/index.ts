// Public entrypoint for @bhq/ui — named exports only, no defaults.
export const Placeholder = () => null;

// Components (each source file must `export default ...`)
export * from "./components/AppSection";

export { default as Button } from "./components/Button";

// export * from "./components/Button";
export * from "./components/Card";
export * from "./components/EmptyState";
export * from "./components/EntityRow";
export * from "./components/Input";
export * from "./components/PageHeader";
export * from "./components/SidebarNav";
export * from "./components/StatCard";
export * from "./components/ThemeToggle";

// Layouts
export * from "./layouts/NavShell";
export * from "./layouts/AppShell";