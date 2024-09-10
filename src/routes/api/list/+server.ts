import { devalueBypass } from "$lib/server/devalue-bypass";
import {
  listQuerySchema,
  type ListQuery,
  listRepositories,
  type ListRepositoriesResponse,
} from "$lib/server/zoekt-list-repositories";

export const POST = async (event) => {
  const session = await event.locals.auth();
  const userId = session?.user?.id;

  const zoektPost = devalueBypass<ListQuery, ListRepositoriesResponse>(
    listQuerySchema,
    listRepositories,
    userId,
  );

  return zoektPost(event);
};
