// packages/ui/src/index.ts

// namespace barrels
export * as overlay from "./overlay";
export * as storage from "./storage";
export * as components from "./components";
export * as utils from "./utils";
export * as hooks from "./hooks";
export * as styles from "./styles";

// flat re-exports (convenient, tree-shakeable)
export * from "./overlay";
export * from "./components";
export * from "./hooks";
export * from "./utils";
export * from "./storage";
export * from "./styles";

