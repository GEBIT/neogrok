import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from "./$types.js";
import { loadPreferences } from "$lib/preferences";
import { configuration } from "$lib/server/configuration";
import { signIn } from "$src/auth";

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth();
  console.log("Logged in? " + session?.user?.id);

  if (!session?.user?.id) {
    // try automatic signin when user is not logged in

    // this does not work with authjs, yet (signIn() requires formData)
    // await signIn("keycloak");

    // const tokenCall = await event.fetch('/auth/csrf');
    // const csrfTokenResponse = await new Response(tokenCall.body).json();
    // const csrfToken = csrfTokenResponse.csrfToken;

    let url = '';

    const signInRequest = await event.fetch('/auth/signin/' + configuration.authProviderId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1'
      },
      body: new URLSearchParams({
        redirect: 'true',
        callbackUrl: `${event.url.origin}`,
        grant_type: "refresh_token",
        // csrfToken: csrfToken!,
      }),
    });
    const signInResponse = await new Response(signInRequest.body).json();

    if (signInResponse?.url) {
      url = signInResponse.url;
    }

    if (url) {
      console.log('Auto login user: ', url);
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
