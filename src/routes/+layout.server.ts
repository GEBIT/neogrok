import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from "./$types.js";
import { loadPreferences } from "$lib/preferences";
import { signIn } from "$src/auth";

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth();
  console.log("Logged in? " + session?.user?.id);

  // if (!session?.user?.id) throw redirect(303, '/auth/signin');
  if (!session?.user?.id) {
    // try automatic signin

    // this does not work with authjs, yet (requires formData)
    // await signIn("keycloak");

    // const tokenCall = await event.fetch('/auth/csrf');
    // const csrfTokenResponse = await new Response(tokenCall.body).json();
    // const csrfToken = csrfTokenResponse.csrfToken;

    let url = '';

    const params = new URLSearchParams();
    // params.append('scope', 'api openid profile email');

    const formDataAuthCore = new URLSearchParams();
    formDataAuthCore.append('redirect', 'true');
    formDataAuthCore.append('callbackUrl', `${event.url.origin}`);
    formDataAuthCore.append('provider', `keycloak`);
    // formDataAuthCore.append('csrfToken', csrfToken);

    const signInRequest = await event.fetch('/auth/signin/keycloak?' + params.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1'
      },
      body: formDataAuthCore.toString()
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
