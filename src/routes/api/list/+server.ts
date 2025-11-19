import { devalueBypass } from "$lib/server/devalue-bypass";
import {
  listQuerySchema,
  type ListQuery,
  listRepositories,
  type ListRepositoriesResponse,
} from "$lib/server/zoekt-list-repositories";
import { authenticateApiRequest } from "$src/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
  const userId = await authenticateApiRequest(event.locals, event.request);
  console.log("listing as", userId);

  const zoektPost = devalueBypass<ListQuery, ListRepositoriesResponse>(
    listQuerySchema,
    listRepositories,
    userId,
  );

  return zoektPost(event);
};
