import type { LayoutServerLoad } from "./$types.js";
import { loadPreferences } from "$lib/preferences";

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth();
  return {
    // While not all pages need preferences, most do. It's easiest to just make
    // them ubiquitously available.
    session,
    preferences: loadPreferences(event.cookies),
  };
};
