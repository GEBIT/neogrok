import { building } from "$app/environment";
import { resolveConfiguration } from "$lib/server/configuration";
// import type { Handle, HandleServerError } from "@sveltejs/kit";

if (!building) {
  // This seems to be the magic way to do truly one-time setup in both dev and
  // prod.

  // Resolve the configuration on startup, such that startup fails if the
  // configuration is invalid. We do this here because this hooks module runs on
  // service startup, but not during the build, which is the case in most any
  // other module.
  await resolveConfiguration();
}

export { handle } from "./auth.js";

// SvelteKit logs an error every time anything requests a URL that does not map
// to a route. Bonkers. Override the default behavior to exclude such cases.
// export const handleError: HandleServerError = ({ error, event }) => {
//   if (event.route.id !== null) {
//     console.error(error);
//   }
// };
