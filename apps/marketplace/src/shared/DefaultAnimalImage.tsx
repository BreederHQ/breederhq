// apps/marketplace/src/shared/DefaultAnimalImage.tsx
// Default placeholder image for animals without photos
// Species-specific silhouettes

import * as React from "react";
import { Dog, Cat, Bird, Rabbit, Fish, Bug, Squirrel, PawPrint } from "lucide-react";

interface DefaultAnimalImageProps {
  species?: string | null;
}

// Map common species names to appropriate icons
function getSpeciesIcon(species?: string | null) {
  if (!species) return PawPrint;

  const speciesLower = species.toLowerCase();

  // Dogs
  if (speciesLower.includes('dog') || speciesLower.includes('canine')) {
    return Dog;
  }

  // Cats
  if (speciesLower.includes('cat') || speciesLower.includes('feline')) {
    return Cat;
  }

  // Birds
  if (speciesLower.includes('bird') || speciesLower.includes('avian') ||
      speciesLower.includes('parrot') || speciesLower.includes('chicken') ||
      speciesLower.includes('duck') || speciesLower.includes('goose')) {
    return Bird;
  }

  // Rabbits & Small Mammals
  if (speciesLower.includes('rabbit') || speciesLower.includes('bunny') ||
      speciesLower.includes('guinea pig') || speciesLower.includes('hamster')) {
    return Rabbit;
  }

  // Fish & Aquatic
  if (speciesLower.includes('fish') || speciesLower.includes('koi') ||
      speciesLower.includes('aquatic')) {
    return Fish;
  }

  // Reptiles & Amphibians
  if (speciesLower.includes('reptile') || speciesLower.includes('lizard') ||
      speciesLower.includes('snake') || speciesLower.includes('turtle') ||
      speciesLower.includes('frog') || speciesLower.includes('gecko')) {
    return Bug; // Using Bug as a generic for reptiles/exotic
  }

  // Livestock & Farm Animals (horses, sheep, goats, pigs, cattle)
  if (speciesLower.includes('horse') || speciesLower.includes('equine') ||
      speciesLower.includes('sheep') || speciesLower.includes('goat') ||
      speciesLower.includes('pig') || speciesLower.includes('cattle') ||
      speciesLower.includes('cow') || speciesLower.includes('llama') ||
      speciesLower.includes('alpaca')) {
    return PawPrint; // Generic for livestock
  }

  // Small animals / rodents
  if (speciesLower.includes('squirrel') || speciesLower.includes('ferret') ||
      speciesLower.includes('chinchilla') || speciesLower.includes('rat') ||
      speciesLower.includes('mouse')) {
    return Squirrel;
  }

  // Default fallback
  return PawPrint;
}

export function DefaultAnimalImage({ species }: DefaultAnimalImageProps) {
  const IconComponent = getSpeciesIcon(species);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
      {/* Subtle warm glow - purple/magenta to complement orange */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, transparent 65%)'
      }}></div>
      {/* Very subtle accent hints */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(20, 184, 166, 0.05) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)'
      }}></div>
      {/* Species-specific icon */}
      <div className="relative z-10 flex items-center justify-center">
        <IconComponent className="w-20 h-20 text-text-tertiary opacity-40" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export default DefaultAnimalImage;
