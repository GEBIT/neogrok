import { devalueBypass } from "$lib/server/devalue-bypass";
import {
  searchQuerySchema,
  type SearchQuery,
  search,
  type SearchResponse,
} from "$lib/server/search-api";
import { authenticateApiRequest } from "$src/auth";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
  const userId = await authenticateApiRequest(event.locals, event.request);
  console.log("searching as", userId);

  const zoektPost = devalueBypass<SearchQuery, SearchResponse>(
    searchQuerySchema,
    search,
    userId,
  );

  return zoektPost(event);
};
