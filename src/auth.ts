import { SvelteKitAuth } from "@auth/sveltekit";
import Keycloak from "@auth/sveltekit/providers/keycloak";
import { env } from "$env/dynamic/private";

const authjsSecret = env.AUTH_SECRET; // Use Environment Variables AUTH_SECRET in prod

const kcConfig = {
  issuer: env.AUTH_KEYCLOAK_ISSUER, // Use Environment Variables AUTH_KEYCLOAK_ISSUER in prod
  refreshEndpoint: env.AUTH_KEYCLOAK_REFRESH ?? env.AUTH_KEYCLOAK_ISSUER + "/protocol/openid-connect/token",
  clientId: env.AUTH_KEYCLOAK_ID, // Paste "Client id" here. Use Environment Variables AUTH_KEYCLOAK_ID in prod
  clientSecret: env.AUTH_KEYCLOAK_SECRET, // Paste "Client secret" here. Use Environment Variables AUTH_KEYCLOAK_ISSUER in prod
  userIdAttribute: env.AUTH_KEYCLOAK_USER_ID_ATTRIBUTE ?? "preferred_username",
};

export const auth = SvelteKitAuth({
  trustHost: true,
  secret: authjsSecret,
  providers: [Keycloak(kcConfig)],
  callbacks: {
    async jwt({ user, token, account, profile }) {
        // console.log("JWT:");
        // console.log("user:");
        // console.log(user);
        // console.log("account:");
        // console.log(account);
        // console.log("profile:");
        // console.log(profile);

        if (profile) {
            token.userId = profile[userIdAttribute];
        }

        //
        // Adapted from https://authjs.dev/guides/refresh-token-rotation
        // The simple SvelteKitAuth examples perform no sensible session expiration/refreshing at all,
        // so we have to do this ourselves.
        //
        // Note: the "token" argument is NOT the provider's access_token, but a custom authJs one,
        // that we have to fill.
        //
        if (account) {
            // First-time login, save the `access_token`, its expiry and the `refresh_token`
            return {
              ...token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              refresh_token: account.refresh_token,
            }
        } else if (Date.now() < token.expires_at * 1000) {
            // Subsequent logins, but the `access_token` is still valid
            console.log("token not expired: " + token.expires_at);
            return token
         } else {
            console.log("token has expired: " + token.expires_at);

            // Subsequent logins, but the `access_token` has expired, try to refresh it
            if (!token.refresh_token) throw new TypeError("Missing refresh_token")
            console.log("refresh_token: ");
            console.log(token.refresh_token);
     
            try {
              // The `token_endpoint` can be found in the provider's documentation. Or if they support OIDC,
              // at their `/.well-known/openid-configuration` endpoint.
              // i.e. https://accounts.google.com/.well-known/openid-configuration


              console.log("refreshing at: " + kcConfig.refreshEndpoint);
              const response = await fetch(kcConfig.refreshEndpoint, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  client_id: kcConfig.clientId!,
                  client_secret: kcConfig.clientSecret!,
                  grant_type: "refresh_token",
                  refresh_token: token.refresh_token!,
                }),
              })
     
              const tokensOrError = await response.json()
     
              if (!response.ok) throw tokensOrError
     
              const newTokens = tokensOrError as {
                access_token: string
                expires_in: number
                refresh_token?: string
              }
     
              token.access_token = newTokens.access_token
              token.expires_at = Math.floor(
                Date.now() / 1000 + newTokens.expires_in
              )
              // Some providers only issue refresh tokens once, so preserve if we did not get a new one
              if (newTokens.refresh_token) {
                  token.refresh_token = newTokens.refresh_token
              }
              return token
            } catch (error) {
              console.error("Error refreshing access_token", error)
              // If we fail to refresh the token, return an error so we can handle it on the page
              token.error = "RefreshTokenError"
              return token
            }
        }
    },

    session({ session, token }) {
        session.error = token.error
        if (token.error || Date.now() > token.expires_at * 1000) {
            session.user.id = null;
        } else {
            session.user.id = token.userId;
        }
        return session
    },
  },
});

export const signIn = auth.signIn
export const signOut = auth.signOut
