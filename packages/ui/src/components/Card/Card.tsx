// packages/ui/src/components/Card.tsx
import React from "react";
import clsx from "clsx";

export type CardProps = React.PropsWithChildren<{ className?: string }>;

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={clsx("bhq-card border border-hairline p-4", className)}>
      {children}
    </div>
  );
};

Card.displayName = "Card";

export { Card };       // named export
export default Card;   // default export
