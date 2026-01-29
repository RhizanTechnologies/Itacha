/**
 * ORCID OAuth Provider for Better Auth
 *
 * ORCID (Open Researcher and Contributor ID) is a persistent digital identifier
 * for researchers. This provider enables authentication via ORCID.
 *
 * @see https://info.orcid.org/documentation/api-tutorials/api-tutorial-get-and-authenticated-orcid-id/
 */

import { env } from "./env";

// =============================================================================
// ORCID API Types
// =============================================================================

interface OrcidTokens {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  orcid: string; // ORCID includes the ID in token response
}

interface OrcidName {
  "given-names"?: { value: string };
  "family-name"?: { value: string };
  path?: string;
}

interface OrcidEmail {
  email: string;
  verified: boolean;
  primary: boolean;
}

interface OrcidProfile {
  "orcid-identifier"?: { path: string };
  name?: OrcidName;
  emails?: { email?: OrcidEmail[] };
}

// =============================================================================
// Provider Configuration
// =============================================================================

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
    async request({ tokens }: { tokens: OrcidTokens }) {
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

  profile(profile: OrcidProfile) {
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
