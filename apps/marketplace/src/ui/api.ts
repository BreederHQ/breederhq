// apps/marketplace/src/ui/api.ts
// API fetch wrappers for marketplace UI

import { apiGet } from "../shared/http/apiClient";
import type {
  ProgramsResponse,
  PublicProgramDTO,
  ListingsResponse,
  ListingDetailDTO,
} from "./types";

export interface GetProgramsParams {
  search?: string;
  location?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export async function getPrograms(params: GetProgramsParams): Promise<ProgramsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.location) query.set("location", params.location);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/public/marketplace/programs${queryStr ? `?${queryStr}` : ""}`;

  const { data } = await apiGet<ProgramsResponse>(path);
  return data;
}

export async function getProgram(programSlug: string): Promise<PublicProgramDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}`;
  const { data } = await apiGet<PublicProgramDTO>(path);
  return data;
}

export async function getProgramListings(programSlug: string): Promise<ListingsResponse> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups`;
  const { data } = await apiGet<ListingsResponse>(path);
  return data;
}

export async function getListing(
  programSlug: string,
  listingSlug: string
): Promise<ListingDetailDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}`;
  const { data } = await apiGet<ListingDetailDTO>(path);
  return data;
}
