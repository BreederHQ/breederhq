// apps/marketplace/src/shared/DefaultCoverImage.tsx
// Shared default cover image component for marketplace cards
// Supports both dark mode (portal) and light mode (marketplace browse)

import * as React from "react";
import logoUrl from "@bhq/ui/assets/logo.png";

interface DefaultCoverImageProps {
  lightMode?: boolean;
}

export function DefaultCoverImage({ lightMode = false }: DefaultCoverImageProps) {
  if (lightMode) {
    // Light mode variant - soft gray gradient with subtle brand accents
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden">
        {/* Subtle warm glow - orange tint for brand consistency */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.06) 0%, transparent 65%)'
        }}></div>
        {/* Very subtle accent hints - teal and blue */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(0, 93, 194, 0.04) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(1, 167, 195, 0.05) 0%, transparent 50%)'
        }}></div>
        {/* Logo */}
        <div className="relative z-10 flex items-center justify-center">
          <img src={logoUrl} alt="BreederHQ" className="h-20 w-auto" />
        </div>
      </div>
    );
  }

  // Dark mode variant (default) - existing dark gradient
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
      {/* Subtle warm glow - purple/magenta to complement orange */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 65%)'
      }}></div>
      {/* Very subtle accent hints - teal and purple */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(20, 184, 166, 0.04) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
      }}></div>
      {/* Logo */}
      <div className="relative z-10 flex items-center justify-center">
        <img src={logoUrl} alt="BreederHQ" className="h-20 w-auto" />
      </div>
    </div>
  );
}

export default DefaultCoverImage;
