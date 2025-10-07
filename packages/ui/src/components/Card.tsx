// packages/ui/src/components/Card.tsx
import React from "react";
import clsx from "clsx";

type Props = React.PropsWithChildren<{ className?: string }>;

export const Card: React.FC<Props> = ({ className, children }) => {
  return (
    <div className={clsx("bhq-card bhq-glass bhq-shadow border border-hairline p-4", className)}>
      {children}
    </div>
  );
};
