/**
 * ORCID OAuth Provider for Better Auth
 *
 * ORCID (Open Researcher and Contributor ID) is a persistent digital identifier
 * for researchers. This provider enables authentication via ORCID.
 *
 * @see https://info.orcid.org/documentation/api-tutorials/api-tutorial-get-and-authenticated-orcid-id/
 */

import { env } from "./env";

export const orcidProvider = {
  id: "orcid",
  name: "ORCID",
  type: "oauth2" as const,

  authorization: {
    url: "https://orcid.org/oauth/authorize",
    params: {
      scope: "/authenticate",
      response_type: "code",
    },
  },

  token: {
    url: "https://orcid.org/oauth/token",
  },

  userinfo: {
    url: "https://pub.orcid.org/v3.0/{orcid}/person",
    async request({ tokens }: { tokens: any }) {
      // Extract ORCID from token response
      const orcid = tokens.orcid;

      const response = await fetch(
        `https://pub.orcid.org/v3.0/${orcid}/person`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: "application/json",
          },
        }
      );

      return response.json();
    },
  },

  profile(profile: any) {
    return {
      id: profile.name?.path || profile["orcid-identifier"]?.path,
      name: profile.name?.["given-names"]?.value
        ? `${profile.name["given-names"].value} ${
            profile.name["family-name"]?.value || ""
          }`.trim()
        : null,
      email: profile.emails?.email?.[0]?.email || null,
      image: null,
      orcidId: profile.name?.path || profile["orcid-identifier"]?.path,
    };
  },

  clientId: env.ORCID_CLIENT_ID || "",
  clientSecret: env.ORCID_CLIENT_SECRET || "",

  enabled: !!(env.ORCID_CLIENT_ID && env.ORCID_CLIENT_SECRET),
};
