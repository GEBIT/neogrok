import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from "./$types.js";
import { loadPreferences } from "$lib/preferences";
import { configuration } from "$lib/server/configuration";
import { signIn } from "$src/auth";

export const load: LayoutServerLoad = async (event) => {
  if (event?.url?.pathname == "/error") {
    // this is an error, most likely caused by a login without being a member of the required group
    // do not perform automatic sign-in avoid a redirect loop
    return {
      // While not all pages need preferences, most do. It's easiest to just make
      // them ubiquitously available.
      preferences: loadPreferences(event.cookies),
    };
  }

  const session = await event.locals.auth();
  console.log("Logged in? " + session?.user?.id);

  if (session?.error) {
    // there is an error set for the session, redirect to error "path" (see above)
    throw redirect(302, "/error");
  }

  if (!session?.user?.id) {
    // try automatic signin when user is not logged in

    // this does not work with authjs, yet (signIn() requires formData)
    // await signIn("keycloak");

    // const tokenCall = await event.fetch('/auth/csrf');
    // const csrfTokenResponse = await new Response(tokenCall.body).json();
    // const csrfToken = csrfTokenResponse.csrfToken;

    let url = "";

    const signInRequest = await event.fetch(
      "/auth/signin/" + configuration.authProviderId,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          redirect: "true",
          redirectTo: `${event.url.href}`, // new version of authjs
          callbackUrl: `${event.url.href}`,// "old" next-auth
          grant_type: "refresh_token",
          // csrfToken: csrfToken!,
        }),
      },
    );
    const signInResponse = await new Response(signInRequest.body).json();

    if (signInResponse?.url) {
      url = signInResponse.url;
    }

    if (url) {
      console.log("Auto login user: ", session?.user?.id);
      throw redirect(302, url);
    }
  }

  return {
    // While not all pages need preferences, most do. It's easiest to just make
    // them ubiquitously available.
    session,
    preferences: loadPreferences(event.cookies),
  };
};
