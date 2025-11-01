export type OffspringGroupDTO = {
  id:string;
  plan_id?: string | null; // nullable for historical groups
  species: "dog"|"cat"|"horse";
  breed?: string | null;
  litter_name?: string | null;
  birthed_at?: string | null; // aligns with Litter.birthedStartAt/birthedEndAt semantics
  invoices?: Array<{ id:string; contact_id:string; assigned_at:string; status:"paid"|"unpaid"|"partial"|"refunded" }>;
};

export type OffspringDTO = {
  id:string; group_id:string; name?:string|null;
  sex:"M"|"F"|null; color?:string|null;
  buyer_contact_id?:string|null;
  price_cents?:number|null; paid_cents?:number|null;
  reserved?:boolean; hold_until?:string|null;
};
