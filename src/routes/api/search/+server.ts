import { devalueBypass } from "$lib/server/devalue-bypass";
import {
  searchQuerySchema,
  type SearchQuery,
  search,
  type SearchResponse,
} from "$lib/server/search-api";

import type { RequestHandler } from "./$types";

export const POST = async (event) => {
  const session = await event.locals.auth();
  const userId = session?.user?.id;
  console.log("searching as user: " + userId);

  const zoektPost = devalueBypass<SearchQuery, SearchResponse>(
    searchQuerySchema,
    search,
    userId,
  );

  return zoektPost(event);
};
