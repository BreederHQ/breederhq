// packages/api/src/data/genetic-markers-seed.ts
// Seed data for genetic markers registry
// This will be used to populate the genetic_markers table

import type { GeneticMarkerCategory, GeneticMarkerInputType, GeneticSpecies } from "../types/genetics";

interface MarkerSeed {
  species: GeneticSpecies;
  category: GeneticMarkerCategory;
  code: string;
  commonName: string;
  gene?: string;
  description: string;
  breedSpecific?: string[];
  isCommon: boolean;
  inputType: GeneticMarkerInputType;
}

// =============================================================================
// DOG MARKERS
// =============================================================================

const DOG_COAT_COLOR: MarkerSeed[] = [
  { species: "DOG", category: "coat_color", code: "A", commonName: "Agouti", gene: "ASIP", description: "Controls distribution of black/brown pigment (ay=sable, aw=wild, at=tan points, a=recessive black)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "B", commonName: "Brown", gene: "TYRP1", description: "Black vs brown/chocolate pigment (B=black, b=brown)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "D", commonName: "Dilute", gene: "MLPH", description: "Dilutes black to blue, brown to isabella (D=full color, d=dilute)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "E", commonName: "Extension", gene: "MC1R", description: "Allows/prevents black pigment expression (E=normal, e=recessive red/cream)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "K", commonName: "Dominant Black", gene: "CBD103", description: "Dominant black override (KB=dominant black, kbr=brindle, ky=allows agouti)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "M", commonName: "Merle", gene: "PMEL", description: "Creates merle pattern - WARNING: M/M can cause health issues (M=merle, m=non-merle)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "S", commonName: "White Spotting", gene: "MITF", description: "White markings and patterns (S=solid, sp=piebald, sw=extreme white)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "H", commonName: "Harlequin", gene: "PSMB7", description: "Modifies merle to create harlequin pattern in Great Danes (H=harlequin, h=non-harlequin)", breedSpecific: ["Great Dane"], isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "coat_color", code: "Em", commonName: "Mask", gene: "MC1R", description: "Black mask on face (Em=mask, E=no mask)", isCommon: true, inputType: "allele_pair" },
];

const DOG_COAT_TYPE: MarkerSeed[] = [
  { species: "DOG", category: "coat_type", code: "L", commonName: "Long Hair", gene: "FGF5", description: "Hair length gene (L/L=short coat, L/l=short carries long, l/l=long coat)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_type", code: "F", commonName: "Furnishings", gene: "RSPO2", description: "Beard/eyebrows - gives doodles their teddy bear face (F/F or F/f=furnished, f/f=unfurnished/smooth face)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_type", code: "Cu", commonName: "Curly", gene: "KRT71", description: "Coat curl/wave (Cu/Cu=curly, Cu/+=wavy/curly, +/+=straight)", isCommon: true, inputType: "allele_pair" },
  { species: "DOG", category: "coat_type", code: "Sd", commonName: "Shedding", gene: "MC5R", description: "Shedding propensity (Sd/Sd=low shed, Sd/sd=moderate, sd/sd=normal shedding)", isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "coat_type", code: "IC", commonName: "Improper Coat", gene: "RSPO2", description: "Coat quality marker (IC/IC=improper coat, IC/N=carrier, N/N=proper coat)", isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "coat_type", code: "L4", commonName: "Fluffy Gene", gene: "FGF5", description: "Long hair in French Bulldogs and other breeds (L4/L4=fluffy, L4/N=carrier, N/N=normal)", breedSpecific: ["French Bulldog"], isCommon: false, inputType: "allele_pair" },
];

const DOG_PHYSICAL_TRAITS: MarkerSeed[] = [
  { species: "DOG", category: "physical_traits", code: "IGF1", commonName: "Size", gene: "IGF1", description: "Insulin-like growth factor - related to body size in dogs", isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "physical_traits", code: "BT", commonName: "Bobtail", gene: "T", description: "Natural bobtail gene (T/T=normal tail, T/bt=natural bob, bt/bt=no tail - lethal in some breeds)", isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "physical_traits", code: "Dw", commonName: "Dewclaws", description: "Rear dewclaws present/absent", isCommon: false, inputType: "allele_pair" },
];

const DOG_EYE_COLOR: MarkerSeed[] = [
  { species: "DOG", category: "eye_color", code: "Blue", commonName: "Blue Eyes", description: "Blue eye color gene (N/N=no blue, N/B=may have blue, B/B=blue eyes)", isCommon: false, inputType: "allele_pair" },
  { species: "DOG", category: "eye_color", code: "ALX4", commonName: "Blue Eyes (ALX4)", gene: "ALX4", description: "Blue eye variant common in Huskies and Australian Shepherds", isCommon: false, inputType: "allele_pair" },
];

const DOG_HEALTH: MarkerSeed[] = [
  // Common health markers (tested across many breeds)
  { species: "DOG", category: "health", code: "MDR1", commonName: "Multi-Drug Resistance 1", gene: "ABCB1", description: "Multi-drug resistance mutation - affected dogs sensitive to ivermectin and other drugs", isCommon: true, inputType: "status" },
  { species: "DOG", category: "health", code: "DM", commonName: "Degenerative Myelopathy", gene: "SOD1", description: "Progressive spinal cord disease causing hind leg weakness", isCommon: true, inputType: "status" },
  { species: "DOG", category: "health", code: "PRA", commonName: "Progressive Retinal Atrophy", description: "Progressive blindness - multiple forms exist", isCommon: true, inputType: "status" },
  { species: "DOG", category: "health", code: "vWD", commonName: "Von Willebrand Disease", gene: "VWF", description: "Blood clotting disorder - types I, II, and III", isCommon: true, inputType: "status" },
  { species: "DOG", category: "health", code: "HUU", commonName: "Hyperuricosuria", gene: "SLC2A9", description: "Elevated uric acid levels leading to bladder/kidney stones", isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CMR", commonName: "Canine Multifocal Retinopathy", gene: "BEST1", description: "Eye condition causing retinal folds and detachment", isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "Ich", commonName: "Ichthyosis", gene: "PNPLA1", description: "Skin scaling disorder - common in Golden Retrievers", isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "GPRA", commonName: "Generalized Progressive Retinal Atrophy", description: "General form of progressive blindness across multiple breeds", isCommon: false, inputType: "status" },

  // Breed-specific health markers
  { species: "DOG", category: "health", code: "EIC", commonName: "Exercise-Induced Collapse", gene: "DNM1", description: "Episodes of weakness/collapse after intense exercise", breedSpecific: ["Labrador Retriever", "Chesapeake Bay Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "DCM", commonName: "Dilated Cardiomyopathy", gene: "PDK4", description: "Heart muscle disease - genetic variants identified in some breeds", breedSpecific: ["Doberman", "Boxer", "Great Dane"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CEA", commonName: "Collie Eye Anomaly", gene: "NHEJ1", description: "Eye developmental defect in Collies and related breeds", breedSpecific: ["Collie", "Border Collie", "Australian Shepherd"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "NCL", commonName: "Neuronal Ceroid Lipofuscinosis", description: "Fatal neurological storage disease - multiple forms", breedSpecific: ["Multiple breeds"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "GR_PRA1", commonName: "Golden Retriever PRA 1", gene: "SLC4A3", description: "Progressive retinal atrophy variant in Golden Retrievers", breedSpecific: ["Golden Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "GR_PRA2", commonName: "Golden Retriever PRA 2", gene: "TTC8", description: "Second PRA variant identified in Golden Retrievers", breedSpecific: ["Golden Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "ICT_A", commonName: "Ichthyosis Type A", gene: "PNPLA1", description: "Breed-specific skin scaling disorder in Golden Retrievers", breedSpecific: ["Golden Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "HNPK", commonName: "Hereditary Nasal Parakeratosis", gene: "SUV39H2", description: "Dry, crusty nose condition - common in Labradors", breedSpecific: ["Labrador Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "SD2", commonName: "Skeletal Dysplasia 2", gene: "COL11A2", description: "Dwarfism causing shortened limbs in Labrador Retrievers", breedSpecific: ["Labrador Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CNM", commonName: "Centronuclear Myopathy", gene: "PTPLA", description: "Muscle weakness disorder in Labrador Retrievers", breedSpecific: ["Labrador Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "RD_OSD", commonName: "Retinal Dysplasia/Oculoskeletal Dysplasia", gene: "COL9A3", description: "Eye and skeletal abnormalities - common in Labrador Retrievers", breedSpecific: ["Labrador Retriever"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "JHC", commonName: "Juvenile Hereditary Cataracts", gene: "HSF4", description: "Early-onset cataracts in various breeds", breedSpecific: ["French Bulldog", "Boston Terrier"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CMR1", commonName: "Canine Multifocal Retinopathy 1", gene: "BEST1", description: "Specific CMR variant causing retinal lesions", breedSpecific: ["French Bulldog"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "Cystinuria", commonName: "Cystinuria", gene: "SLC3A1", description: "Amino acid metabolism disorder causing urinary stones", breedSpecific: ["French Bulldog", "English Bulldog"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "EFS", commonName: "Episodic Falling Syndrome", gene: "BCAN", description: "Muscle hypertonicity episodes in Cavalier King Charles Spaniels", breedSpecific: ["Cavalier King Charles Spaniel"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CC_DEW", commonName: "Curly Coat/Dry Eye Syndrome", gene: "FAM83H", description: "Combined coat and eye condition in Cavaliers", breedSpecific: ["Cavalier King Charles Spaniel"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "HSF4", commonName: "Hereditary Cataracts (HSF4)", gene: "HSF4", description: "Cataracts linked to HSF4 gene - multiple breeds affected", breedSpecific: ["Australian Shepherd", "Boston Terrier"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "TNS", commonName: "Trapped Neutrophil Syndrome", gene: "VPS13B", description: "Immune system disorder in Border Collies", breedSpecific: ["Border Collie"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "CL_BC", commonName: "Neuronal Ceroid Lipofuscinosis (Border Collie)", gene: "CLN5", description: "Fatal neurological storage disease in Border Collies", breedSpecific: ["Border Collie"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "IGS", commonName: "Imerslund-Grasbeck Syndrome", gene: "CUBN", description: "Vitamin B12 malabsorption disorder", breedSpecific: ["Border Collie", "Beagle"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "FN", commonName: "Familial Nephropathy", gene: "COL4A4", description: "Progressive kidney disease in Cocker Spaniels and other breeds", breedSpecific: ["Cocker Spaniel", "English Springer Spaniel"], isCommon: false, inputType: "status" },
  { species: "DOG", category: "health", code: "PFK", commonName: "Phosphofructokinase Deficiency", gene: "PFKM", description: "Enzyme deficiency causing muscle problems and anemia", breedSpecific: ["English Springer Spaniel", "American Cocker Spaniel"], isCommon: false, inputType: "status" },
];

// =============================================================================
// CAT MARKERS
// =============================================================================

const CAT_COAT_COLOR: MarkerSeed[] = [
  { species: "CAT", category: "coat_color", code: "A", commonName: "Agouti", gene: "ASIP", description: "Tabby vs solid pattern (A=agouti/tabby, a=non-agouti/solid)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "B", commonName: "Brown", gene: "TYRP1", description: "Black vs chocolate vs cinnamon (B=black, b=chocolate, bl=cinnamon)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "C", commonName: "Colorpoint", gene: "TYR", description: "Full color to albino series (C=full, cs=siamese, cb=burmese, ca=blue-eyed albino, c=pink-eyed albino)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "D", commonName: "Dilute", gene: "MLPH", description: "Full color vs dilute (D=full, d=dilute - black becomes blue, orange becomes cream)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "O", commonName: "Orange", description: "Sex-linked orange/red (O=orange, o=non-orange) - females can be tortoiseshell", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "S", commonName: "White Spotting", gene: "KIT", description: "White markings (S=spotting, s=no spotting)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_color", code: "W", commonName: "Dominant White", gene: "KIT", description: "Epistatic white - masks all other colors (W=white, w=colored) - can cause deafness", isCommon: false, inputType: "allele_pair" },
];

const CAT_COAT_TYPE: MarkerSeed[] = [
  { species: "CAT", category: "coat_type", code: "L", commonName: "Long Hair", gene: "FGF5", description: "Hair length (L=short, l=long - longhair is recessive)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_type", code: "Mc", commonName: "Tabby Pattern", gene: "TAQPEP", description: "Mackerel vs classic tabby (Mc=mackerel stripes, mc=classic/blotched)", isCommon: true, inputType: "allele_pair" },
  { species: "CAT", category: "coat_type", code: "R", commonName: "Rex/Curly", description: "Curly coat mutations (various rex genes in different breeds)", isCommon: false, inputType: "allele_pair" },
  { species: "CAT", category: "coat_type", code: "Fd", commonName: "Fold Ears", gene: "TRPV4", description: "Scottish Fold ear mutation - WARNING: Fd/Fd causes severe cartilage problems", breedSpecific: ["Scottish Fold"], isCommon: false, inputType: "allele_pair" },
];

const CAT_PHYSICAL_TRAITS: MarkerSeed[] = [
  { species: "CAT", category: "physical_traits", code: "Pd", commonName: "Polydactyl", gene: "SHH", description: "Extra toes (Pd=polydactyl, pd=normal)", isCommon: false, inputType: "allele_pair" },
];

const CAT_HEALTH: MarkerSeed[] = [
  { species: "CAT", category: "health", code: "PKD", commonName: "Polycystic Kidney Disease", gene: "PKD1", description: "Kidney cysts - common in Persians and related breeds", isCommon: true, inputType: "status" },
  { species: "CAT", category: "health", code: "HCM", commonName: "Hypertrophic Cardiomyopathy", gene: "MYBPC3", description: "Heart muscle thickening - genetic tests available for some breeds", isCommon: true, inputType: "status" },
  { species: "CAT", category: "health", code: "PRA", commonName: "Progressive Retinal Atrophy", gene: "CEP290", description: "Progressive blindness - multiple forms in different breeds", isCommon: true, inputType: "status" },
  { species: "CAT", category: "health", code: "SMA", commonName: "Spinal Muscular Atrophy", gene: "LIX1", description: "Spinal cord motor neuron degeneration in Maine Coons", breedSpecific: ["Maine Coon"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "PK_Def", commonName: "Pyruvate Kinase Deficiency", gene: "PKLR", description: "Red blood cell enzyme deficiency causing anemia", isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "PRA_pd", commonName: "PRA (Persian variant)", gene: "AIPL1", description: "Progressive retinal atrophy variant specific to Persians", breedSpecific: ["Persian", "Exotic Shorthair"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "HCM_MC", commonName: "HCM (Maine Coon)", gene: "MYBPC3", description: "Hypertrophic cardiomyopathy variant in Maine Coons", breedSpecific: ["Maine Coon"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "HCM_RD", commonName: "HCM (Ragdoll)", gene: "MYBPC3", description: "Hypertrophic cardiomyopathy variant in Ragdolls", breedSpecific: ["Ragdoll"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "GM1", commonName: "Gangliosidosis Type 1", gene: "GLB1", description: "Fatal lysosomal storage disease in cats", breedSpecific: ["Siamese", "Korat"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "PRA_rdAc", commonName: "PRA (Abyssinian/Somali)", gene: "CEP290", description: "Progressive retinal atrophy in Abyssinian and Somali cats", breedSpecific: ["Abyssinian", "Somali"], isCommon: false, inputType: "status" },
  { species: "CAT", category: "health", code: "OCD", commonName: "Osteochondrodysplasia", gene: "TRPV4", description: "Cartilage/bone abnormality - WARNING: Fd/Fd causes severe issues", breedSpecific: ["Scottish Fold"], isCommon: false, inputType: "status" },
];

const CAT_OTHER: MarkerSeed[] = [
  { species: "CAT", category: "other", code: "BloodType", commonName: "Blood Type", description: "Critical for breeding - Type B queens bred to Type A toms risk neonatal isoerythrolysis", isCommon: true, inputType: "text" },
];

// =============================================================================
// HORSE MARKERS
// =============================================================================

const HORSE_COAT_COLOR: MarkerSeed[] = [
  { species: "HORSE", category: "coat_color", code: "E", commonName: "Extension", gene: "MC1R", description: "Red vs black base (E=black pigment, e=red/chestnut only)", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "A", commonName: "Agouti", gene: "ASIP", description: "Black distribution on bay horses (A=bay, a=black)", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "Cr", commonName: "Cream", gene: "SLC45A2", description: "Cream dilution (Cr/Cr=cremello/perlino, Cr/cr=palomino/buckskin, cr/cr=no dilution)", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "D", commonName: "Dun", gene: "TBX3", description: "Dun dilution with primitive markings (D=dun with dorsal stripe, d=non-dun)", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "G", commonName: "Gray", gene: "STX17", description: "Progressive graying (G=gray, g=non-gray) - horses born colored, turn gray with age", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "Ch", commonName: "Champagne", gene: "SLC36A1", description: "Champagne dilution (Ch=champagne, ch=non-champagne)", isCommon: false, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "Z", commonName: "Silver", gene: "PMEL17", description: "Silver dapple - dilutes black pigment (Z=silver, z=non-silver)", isCommon: false, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "TO", commonName: "Tobiano", gene: "KIT", description: "Tobiano white pattern (TO=tobiano, to=non-tobiano)", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "O", commonName: "Overo (Frame)", gene: "EDNRB", description: "Frame overo pattern - WARNING: O/O is Lethal White Overo Syndrome", isCommon: true, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "SB", commonName: "Sabino", gene: "KIT", description: "Sabino white pattern (SB1 and other variants)", isCommon: false, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "LP", commonName: "Leopard Complex", gene: "TRPM1", description: "Appaloosa patterns (LP=leopard complex, lp=no pattern)", isCommon: false, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "Rn", commonName: "Roan", gene: "KIT", description: "Roan pattern - white hairs interspersed (Rn=roan, rn=non-roan)", isCommon: false, inputType: "allele_pair" },
  { species: "HORSE", category: "coat_color", code: "W", commonName: "Dominant White", gene: "KIT", description: "Dominant white spotting patterns - multiple W alleles exist", isCommon: false, inputType: "allele_pair" },
];

const HORSE_HEALTH: MarkerSeed[] = [
  { species: "HORSE", category: "health", code: "HYPP", commonName: "Hyperkalemic Periodic Paralysis", gene: "SCN4A", description: "Muscle disease in Quarter Horse lines - trace to Impressive", breedSpecific: ["Quarter Horse"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "GBED", commonName: "Glycogen Branching Enzyme Deficiency", gene: "GBE1", description: "Fatal metabolic disorder in Quarter Horses", breedSpecific: ["Quarter Horse", "Paint"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "HERDA", commonName: "Hereditary Equine Regional Dermal Asthenia", gene: "PPIB", description: "Skin fragility in Quarter Horses", breedSpecific: ["Quarter Horse"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "OLWS", commonName: "Overo Lethal White Syndrome", gene: "EDNRB", description: "Lethal when homozygous (O/O) - foals born white, die within days", isCommon: true, inputType: "status" },
  { species: "HORSE", category: "health", code: "MH", commonName: "Malignant Hyperthermia", gene: "RYR1", description: "Dangerous anesthesia reaction in Quarter Horses", isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "PSSM", commonName: "Polysaccharide Storage Myopathy", gene: "GYS1", description: "Muscle disorder - multiple types (PSSM1 and PSSM2)", isCommon: true, inputType: "status" },
  { species: "HORSE", category: "health", code: "WFFS", commonName: "Warmblood Fragile Foal Syndrome", gene: "PLOD1", description: "Connective tissue disorder in Warmbloods", breedSpecific: ["Warmblood"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "CA", commonName: "Cerebellar Abiotrophy", gene: "TOE1", description: "Progressive neurological disease in Arabians and related breeds", breedSpecific: ["Arabian"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "SCID", commonName: "Severe Combined Immunodeficiency", gene: "PRKDC", description: "Fatal immune system failure in Arabian foals", breedSpecific: ["Arabian"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "LFS", commonName: "Lavender Foal Syndrome", gene: "MYO5A", description: "Fatal neurological disorder - foals born with dilute/lavender coat", breedSpecific: ["Arabian"], isCommon: false, inputType: "status" },
  { species: "HORSE", category: "health", code: "JEB", commonName: "Junctional Epidermolysis Bullosa", gene: "LAMC2", description: "Fatal skin blistering disease - foals born with fragile skin", breedSpecific: ["Belgian", "Draft breeds"], isCommon: false, inputType: "status" },
];

// =============================================================================
// EXPORT ALL MARKERS
// =============================================================================

export const GENETIC_MARKERS_SEED: MarkerSeed[] = [
  // Dogs
  ...DOG_COAT_COLOR,
  ...DOG_COAT_TYPE,
  ...DOG_PHYSICAL_TRAITS,
  ...DOG_EYE_COLOR,
  ...DOG_HEALTH,

  // Cats
  ...CAT_COAT_COLOR,
  ...CAT_COAT_TYPE,
  ...CAT_PHYSICAL_TRAITS,
  ...CAT_HEALTH,
  ...CAT_OTHER,

  // Horses
  ...HORSE_COAT_COLOR,
  ...HORSE_HEALTH,
];

// Helper to get markers by species
export function getMarkersBySpecies(species: GeneticSpecies): MarkerSeed[] {
  return GENETIC_MARKERS_SEED.filter((m) => m.species === species);
}

// Helper to get common markers for a species (for default UI)
export function getCommonMarkers(species: GeneticSpecies): MarkerSeed[] {
  return GENETIC_MARKERS_SEED.filter((m) => m.species === species && m.isCommon);
}

// Helper to get breed-specific markers
export function getBreedSpecificMarkers(species: GeneticSpecies, breeds: string[]): MarkerSeed[] {
  const breedsLower = breeds.map((b) => b.toLowerCase());
  return GENETIC_MARKERS_SEED.filter((m) => {
    if (m.species !== species) return false;
    if (!m.breedSpecific) return false;
    return m.breedSpecific.some((b) =>
      breedsLower.some((breed) => b.toLowerCase().includes(breed) || breed.includes(b.toLowerCase()))
    );
  });
}
