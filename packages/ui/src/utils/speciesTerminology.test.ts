import { describe, it, expect } from "vitest";
import {
  getSpeciesTerminology,
  getOffspringName,
  getOffspringNameCap,
  getBirthProcess,
  getBirthVerb,
  getGroupName,
  getParentName,
  speciesUsesCollars,
  speciesEmphasizesCounts,
  speciesShowsGroupConcept,
  speciesUsesLitterWaitlist,
} from "./speciesTerminology";

describe("getSpeciesTerminology", () => {
  it("returns dog terminology for DOG", () => {
    const terms = getSpeciesTerminology("DOG");
    expect(terms.offspring.singular).toBe("puppy");
    expect(terms.offspring.plural).toBe("puppies");
    expect(terms.birth.process).toBe("whelping");
    expect(terms.group.singular).toBe("litter");
  });

  it("returns horse terminology for HORSE", () => {
    const terms = getSpeciesTerminology("HORSE");
    expect(terms.offspring.singular).toBe("foal");
    expect(terms.offspring.plural).toBe("foals");
    expect(terms.birth.process).toBe("foaling");
    expect(terms.group.singular).toBe("birth record");
    expect(terms.parents.female).toBe("mare");
    expect(terms.parents.male).toBe("stallion");
  });

  it("returns rabbit terminology for RABBIT", () => {
    const terms = getSpeciesTerminology("RABBIT");
    expect(terms.offspring.singular).toBe("kit");
    expect(terms.birth.process).toBe("kindling");
    expect(terms.parents.female).toBe("doe");
    expect(terms.parents.male).toBe("buck");
  });

  it("returns goat terminology for GOAT", () => {
    const terms = getSpeciesTerminology("GOAT");
    expect(terms.offspring.singular).toBe("kid");
    expect(terms.birth.process).toBe("kidding");
  });

  it("returns sheep terminology for SHEEP", () => {
    const terms = getSpeciesTerminology("SHEEP");
    expect(terms.offspring.singular).toBe("lamb");
    expect(terms.birth.process).toBe("lambing");
    expect(terms.parents.female).toBe("ewe");
    expect(terms.parents.male).toBe("ram");
  });

  it("returns pig terminology for PIG", () => {
    const terms = getSpeciesTerminology("PIG");
    expect(terms.offspring.singular).toBe("piglet");
    expect(terms.birth.process).toBe("farrowing");
    expect(terms.parents.female).toBe("sow");
    expect(terms.parents.male).toBe("boar");
  });

  it("returns cattle terminology for CATTLE", () => {
    const terms = getSpeciesTerminology("CATTLE");
    expect(terms.offspring.singular).toBe("calf");
    expect(terms.offspring.plural).toBe("calves");
    expect(terms.birth.process).toBe("calving");
    expect(terms.parents.female).toBe("cow");
    expect(terms.parents.male).toBe("bull");
  });

  it("returns chicken terminology for CHICKEN", () => {
    const terms = getSpeciesTerminology("CHICKEN");
    expect(terms.offspring.singular).toBe("chick");
    expect(terms.birth.process).toBe("hatching");
    expect(terms.group.singular).toBe("clutch");
    expect(terms.parents.female).toBe("hen");
    expect(terms.parents.male).toBe("rooster");
  });

  it("returns alpaca terminology for ALPACA", () => {
    const terms = getSpeciesTerminology("ALPACA");
    expect(terms.offspring.singular).toBe("cria");
    expect(terms.offspring.plural).toBe("crias");
    expect(terms.birth.process).toBe("birthing");
  });

  it("returns llama terminology for LLAMA", () => {
    const terms = getSpeciesTerminology("LLAMA");
    expect(terms.offspring.singular).toBe("cria");
    expect(terms.offspring.plural).toBe("crias");
    expect(terms.birth.process).toBe("birthing");
  });

  it("handles case variations", () => {
    expect(getSpeciesTerminology("dog")).toEqual(getSpeciesTerminology("DOG"));
    expect(getSpeciesTerminology("Dog")).toEqual(getSpeciesTerminology("DOG"));
    expect(getSpeciesTerminology("horse")).toEqual(getSpeciesTerminology("HORSE"));
    expect(getSpeciesTerminology("HORSE")).toEqual(getSpeciesTerminology("Horse"));
  });

  it("handles whitespace", () => {
    expect(getSpeciesTerminology(" DOG ")).toEqual(getSpeciesTerminology("DOG"));
    expect(getSpeciesTerminology(" HORSE ")).toEqual(getSpeciesTerminology("HORSE"));
  });

  it("returns default terminology for unknown species", () => {
    const terms = getSpeciesTerminology("UNICORN");
    expect(terms.offspring.singular).toBe("puppy"); // defaults to DOG
  });

  it("returns default terminology for null", () => {
    const terms = getSpeciesTerminology(null);
    expect(terms.offspring.singular).toBe("puppy"); // defaults to DOG
  });

  it("returns default terminology for undefined", () => {
    const terms = getSpeciesTerminology(undefined);
    expect(terms.offspring.singular).toBe("puppy"); // defaults to DOG
  });
});

describe("getOffspringName", () => {
  it("returns singular offspring name", () => {
    expect(getOffspringName("DOG", false)).toBe("puppy");
    expect(getOffspringName("HORSE", false)).toBe("foal");
    expect(getOffspringName("RABBIT", false)).toBe("kit");
    expect(getOffspringName("GOAT", false)).toBe("kid");
  });

  it("returns plural offspring name", () => {
    expect(getOffspringName("DOG", true)).toBe("puppies");
    expect(getOffspringName("HORSE", true)).toBe("foals");
    expect(getOffspringName("RABBIT", true)).toBe("kits");
    expect(getOffspringName("GOAT", true)).toBe("kids");
  });

  it("defaults to plural when not specified", () => {
    expect(getOffspringName("DOG")).toBe("puppies");
    expect(getOffspringName("HORSE")).toBe("foals");
  });
});

describe("getOffspringNameCap", () => {
  it("returns capitalized offspring name", () => {
    expect(getOffspringNameCap("DOG", false)).toBe("Puppy");
    expect(getOffspringNameCap("DOG", true)).toBe("Puppies");
    expect(getOffspringNameCap("HORSE", false)).toBe("Foal");
    expect(getOffspringNameCap("HORSE", true)).toBe("Foals");
  });
});

describe("getBirthProcess", () => {
  it("returns lowercase birth process by default", () => {
    expect(getBirthProcess("DOG")).toBe("whelping");
    expect(getBirthProcess("HORSE")).toBe("foaling");
    expect(getBirthProcess("RABBIT")).toBe("kindling");
    expect(getBirthProcess("GOAT")).toBe("kidding");
    expect(getBirthProcess("SHEEP")).toBe("lambing");
    expect(getBirthProcess("PIG")).toBe("farrowing");
    expect(getBirthProcess("CATTLE")).toBe("calving");
    expect(getBirthProcess("CHICKEN")).toBe("hatching");
  });

  it("returns capitalized birth process when requested", () => {
    expect(getBirthProcess("DOG", true)).toBe("Whelping");
    expect(getBirthProcess("HORSE", true)).toBe("Foaling");
    expect(getBirthProcess("RABBIT", true)).toBe("Kindling");
  });
});

describe("getBirthVerb", () => {
  it("returns birth verb (past tense)", () => {
    expect(getBirthVerb("DOG")).toBe("whelped");
    expect(getBirthVerb("HORSE")).toBe("foaled");
    expect(getBirthVerb("RABBIT")).toBe("kindled");
    expect(getBirthVerb("GOAT")).toBe("kidded");
    expect(getBirthVerb("SHEEP")).toBe("lambed");
    expect(getBirthVerb("PIG")).toBe("farrowed");
    expect(getBirthVerb("CATTLE")).toBe("calved");
    expect(getBirthVerb("CHICKEN")).toBe("hatched");
  });

  it("returns capitalized birth verb when requested", () => {
    expect(getBirthVerb("DOG", true)).toBe("Whelped");
    expect(getBirthVerb("HORSE", true)).toBe("Foaled");
  });
});

describe("getGroupName", () => {
  it("returns plural group name by default", () => {
    expect(getGroupName("DOG")).toBe("litters");
    expect(getGroupName("HORSE")).toBe("birth records");
    expect(getGroupName("CHICKEN")).toBe("clutches");
  });

  it("returns singular group name when requested", () => {
    expect(getGroupName("DOG", false)).toBe("litter");
    expect(getGroupName("HORSE", false)).toBe("birth record");
    expect(getGroupName("CHICKEN", false)).toBe("clutch");
  });

  it("returns capitalized group name when requested", () => {
    expect(getGroupName("DOG", true, true)).toBe("Litters");
    expect(getGroupName("DOG", false, true)).toBe("Litter");
    expect(getGroupName("HORSE", false, true)).toBe("Birth Record");
  });
});

describe("getParentName", () => {
  it("returns female parent names", () => {
    expect(getParentName("DOG", true)).toBe("dam");
    expect(getParentName("HORSE", true)).toBe("mare");
    expect(getParentName("RABBIT", true)).toBe("doe");
    expect(getParentName("GOAT", true)).toBe("doe");
    expect(getParentName("SHEEP", true)).toBe("ewe");
    expect(getParentName("PIG", true)).toBe("sow");
    expect(getParentName("CATTLE", true)).toBe("cow");
    expect(getParentName("CHICKEN", true)).toBe("hen");
  });

  it("returns male parent names", () => {
    expect(getParentName("DOG", false)).toBe("sire");
    expect(getParentName("HORSE", false)).toBe("stallion");
    expect(getParentName("RABBIT", false)).toBe("buck");
    expect(getParentName("GOAT", false)).toBe("buck");
    expect(getParentName("SHEEP", false)).toBe("ram");
    expect(getParentName("PIG", false)).toBe("boar");
    expect(getParentName("CATTLE", false)).toBe("bull");
    expect(getParentName("CHICKEN", false)).toBe("rooster");
  });

  it("returns capitalized parent names when requested", () => {
    expect(getParentName("HORSE", true, true)).toBe("Mare");
    expect(getParentName("HORSE", false, true)).toBe("Stallion");
  });
});

describe("Feature flags", () => {
  describe("speciesUsesCollars", () => {
    it("returns true for litter species", () => {
      expect(speciesUsesCollars("DOG")).toBe(true);
      expect(speciesUsesCollars("CAT")).toBe(true);
      expect(speciesUsesCollars("RABBIT")).toBe(true);
      expect(speciesUsesCollars("GOAT")).toBe(true);
      expect(speciesUsesCollars("SHEEP")).toBe(true);
      expect(speciesUsesCollars("PIG")).toBe(true);
    });

    it("returns false for single-birth species", () => {
      expect(speciesUsesCollars("HORSE")).toBe(false);
      expect(speciesUsesCollars("CATTLE")).toBe(false);
      expect(speciesUsesCollars("CHICKEN")).toBe(false);
      expect(speciesUsesCollars("ALPACA")).toBe(false);
      expect(speciesUsesCollars("LLAMA")).toBe(false);
    });
  });

  describe("speciesEmphasizesCounts", () => {
    it("returns true for litter species", () => {
      expect(speciesEmphasizesCounts("DOG")).toBe(true);
      expect(speciesEmphasizesCounts("CAT")).toBe(true);
      expect(speciesEmphasizesCounts("RABBIT")).toBe(true);
      expect(speciesEmphasizesCounts("GOAT")).toBe(true);
      expect(speciesEmphasizesCounts("SHEEP")).toBe(true);
      expect(speciesEmphasizesCounts("PIG")).toBe(true);
      expect(speciesEmphasizesCounts("CHICKEN")).toBe(true); // eggs in clutch
    });

    it("returns false for typically single-birth species", () => {
      expect(speciesEmphasizesCounts("HORSE")).toBe(false);
      expect(speciesEmphasizesCounts("CATTLE")).toBe(false);
      expect(speciesEmphasizesCounts("ALPACA")).toBe(false);
      expect(speciesEmphasizesCounts("LLAMA")).toBe(false);
    });
  });

  describe("speciesShowsGroupConcept", () => {
    it("returns true for litter species", () => {
      expect(speciesShowsGroupConcept("DOG")).toBe(true);
      expect(speciesShowsGroupConcept("CAT")).toBe(true);
      expect(speciesShowsGroupConcept("RABBIT")).toBe(true);
      expect(speciesShowsGroupConcept("CHICKEN")).toBe(true);
    });

    it("returns false for individual-centric species", () => {
      expect(speciesShowsGroupConcept("HORSE")).toBe(false);
      expect(speciesShowsGroupConcept("CATTLE")).toBe(false);
      expect(speciesShowsGroupConcept("ALPACA")).toBe(false);
      expect(speciesShowsGroupConcept("LLAMA")).toBe(false);
    });
  });

  describe("speciesUsesLitterWaitlist", () => {
    it("returns true for litter species", () => {
      expect(speciesUsesLitterWaitlist("DOG")).toBe(true);
      expect(speciesUsesLitterWaitlist("CAT")).toBe(true);
      expect(speciesUsesLitterWaitlist("RABBIT")).toBe(true);
    });

    it("returns false for direct-purchase species", () => {
      expect(speciesUsesLitterWaitlist("HORSE")).toBe(false);
      expect(speciesUsesLitterWaitlist("CATTLE")).toBe(false);
      expect(speciesUsesLitterWaitlist("CHICKEN")).toBe(false);
      expect(speciesUsesLitterWaitlist("ALPACA")).toBe(false);
      expect(speciesUsesLitterWaitlist("LLAMA")).toBe(false);
    });
  });
});

describe("Complete terminology object", () => {
  it("includes all required fields for HORSE", () => {
    const terms = getSpeciesTerminology("HORSE");

    expect(terms.offspring).toHaveProperty("singular");
    expect(terms.offspring).toHaveProperty("plural");
    expect(terms.offspring).toHaveProperty("singularCap");
    expect(terms.offspring).toHaveProperty("pluralCap");

    expect(terms.birth).toHaveProperty("process");
    expect(terms.birth).toHaveProperty("processCap");
    expect(terms.birth).toHaveProperty("verb");
    expect(terms.birth).toHaveProperty("verbCap");
    expect(terms.birth).toHaveProperty("dateLabel");

    expect(terms.group).toHaveProperty("singular");
    expect(terms.group).toHaveProperty("plural");
    expect(terms.group).toHaveProperty("inCare");

    expect(terms.parents).toHaveProperty("female");
    expect(terms.parents).toHaveProperty("male");

    expect(terms.care).toHaveProperty("stage");

    expect(terms.features).toHaveProperty("useCollars");
    expect(terms.features).toHaveProperty("emphasizeCounts");
    expect(terms.features).toHaveProperty("showGroupConcept");
    expect(terms.features).toHaveProperty("usesLitterWaitlist");
  });
});
