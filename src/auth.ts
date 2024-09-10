import { SvelteKitAuth } from "@auth/sveltekit";
import Keycloak from "@auth/sveltekit/providers/keycloak";
import { env } from "$env/dynamic/private";
import { jwtDecode } from "jwt-decode";
import type { JWT } from "@auth/core/jwt";

const authjsSecret = env.AUTH_SECRET; // Use Environment Variables AUTH_SECRET in prod

const kcConfig = {
  issuer: env.AUTH_KEYCLOAK_ISSUER, // Use Environment Variables AUTH_KEYCLOAK_ISSUER in prod
  refreshEndpoint:
    env.AUTH_KEYCLOAK_REFRESH ??
    env.AUTH_KEYCLOAK_ISSUER + "/protocol/openid-connect/token",
  clientId: env.AUTH_KEYCLOAK_ID, // Paste "Client id" here. Use Environment Variables AUTH_KEYCLOAK_ID in prod
  clientSecret: env.AUTH_KEYCLOAK_SECRET, // Paste "Client secret" here. Use Environment Variables AUTH_KEYCLOAK_ISSUER in prod
  userIdAttribute: env.AUTH_KEYCLOAK_USER_ID_ATTRIBUTE ?? "preferred_username",
  groupsAttribute: env.AUTH_KEYCLOAK_GROUPS_ATTRIBUTE ?? "groups", // expected to be available in access_token
  requiredGroup: env.AUTH_KEYCLOAK_REQUIRED_GROUP,
};

console.log("Using configuration:");
console.log({
  ...kcConfig,
  clientSecret: "<redacted>",
});

function validateGroupMembership(token: JWT, access_token: string): boolean {
  // decode access token for group info
  const decodedToken = jwtDecode(access_token);

  // check if group membership is fulfilled and deny if not
  return decodedToken[kcConfig.groupsAttribute].includes(
    kcConfig.requiredGroup,
  );
}

function denyLogin(token: JWT): JWT {
  console.log(
    "Login denied through " + kcConfig.requiredGroup + " for " + token.userId,
  );
  token.error = "LoginNotAllowedError";
  token.userId = null;
  return token;
}

export const auth = SvelteKitAuth({
  trustHost: true,
  secret: authjsSecret,
  providers: [Keycloak(kcConfig)],
  callbacks: {
    async jwt({ user, token, account, profile }) {
      token.error = null;

      // console.log("JWT:");
      // console.log("user:");
      // console.log(user);
      // console.log("account:");
      // console.log(account);
      // console.log("profile:");
      // console.log(profile);

      if (profile) {
        token.userId = profile[kcConfig.userIdAttribute];
      }

      //
      // Adapted from https://authjs.dev/guides/refresh-token-rotation
      // The simple SvelteKitAuth examples perform no sensible session expiration/refreshing at all,
      // so we have to do this ourselves.
      //
      // Note: the "token" argument is NOT the provider's access_token, but a custom authJs one,
      // that we have to fill.
      //
      // Note: we cannot invalidate the session immediately when the user logs out of the identity
      // provider. Only after authJs's session times out, we will notice.
      //
      // A user is being considered logged in when `session.user.id` is defined.
      // `session.error` may contain a hint why (s)he is not logged in.
      if (account) {
        if (!account.access_token) {
          return denyLogin(token);
        }

        if (kcConfig.requiredGroup) {
          if (!validateGroupMembership(token, account.access_token)) {
            return denyLogin(token);
          }
        }

        // First-time login, save the `access_token`, its expiry and the `refresh_token`
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        };
      } else if (token.expires_at && Date.now() < token.expires_at * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        console.log("token not expired: " + token.expires_at);
        return token;
      } else if (token.userId && token.expires_at && token.refresh_token) {
        // Subsequent logins, but the `access_token` has expired, try to refresh it.
        // console.log(
        //   "refreshing expired token: " +
        //     token.expires_at +
        //     " of " +
        //     token.userId,
        // );

        try {
          // The `token_endpoint` can be found in the provider's documentation. Or if they support OIDC,
          // at their `/.well-known/openid-configuration` endpoint.
          // i.e. https://accounts.google.com/.well-known/openid-configuration

          const response = await fetch(kcConfig.refreshEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: kcConfig.clientId!,
              client_secret: kcConfig.clientSecret!,
              grant_type: "refresh_token",
              refresh_token: token.refresh_token!,
            }),
          });

          const tokensOrError = await response.json();
          if (!response.ok) throw tokensOrError;

          const newTokens = tokensOrError as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
          };

          if (!newTokens.access_token) {
            return denyLogin(token);
          }

          if (kcConfig.requiredGroup) {
            // decode access token for group info
            if (!validateGroupMembership(token, newTokens.access_token)) {
              return denyLogin(token);
            }
          }

          token.access_token = newTokens.access_token;
          token.expires_at = Math.floor(
            Date.now() / 1000 + newTokens.expires_in,
          );
          // Some providers only issue refresh tokens once, so preserve if we did not get a new one
          if (newTokens.refresh_token) {
            token.refresh_token = newTokens.refresh_token;
          }
          return token;
        } catch (error) {
          // This may happen if the remote session was terminated, so that
          // refreshing our session doesn't not work anymore. A new sign-in
          // is required.
          console.error("Unable to refresh access_token", error);
          token.userId = null;
          token.access_token = null;
          token.refresh_token = null;
          token.error = null; // This is NOT an error, allow automatic sign-in
          return token;
        }
      } else {
        // no refresh_token available
        token.userId = null;
        token.error = "Not logged in.";
        return token;
      }
    },

    session({ session, token }) {
      session.error = token.error;
      if (token.error || Date.now() > token.expires_at * 1000) {
        session.user.id = null;
      } else {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});

export const signIn = auth.signIn;
export const signOut = auth.signOut;
