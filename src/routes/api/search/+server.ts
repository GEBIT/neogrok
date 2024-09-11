import { devalueBypass } from "$lib/server/devalue-bypass";
import {
  searchQuerySchema,
  type SearchQuery,
  search,
  type SearchResponse,
} from "$lib/server/search-api";

import type { RequestHandler } from './$types';
/*
export const GET: RequestHandler = ({ locals }) => {
    console.log(locals);
    // ...
}
*/
export const POST = (async ( event ) => {
  const session = await event.locals.auth();
  const userName = session?.user?.preferred_username

  const zoektPost = devalueBypass<SearchQuery, SearchResponse>(
    searchQuerySchema,
    search,
    userName,
  );

  return zoektPost(event);
});
