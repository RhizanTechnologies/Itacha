import { del, put } from "@vercel/blob";

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function storeOrganizationArtifact(options: {
  organizationId: string;
  artifactId: string;
  filename: string;
  body: Blob | Buffer | ReadableStream | string;
  contentType: string;
}): Promise<{ url: string; pathname: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Object storage is not configured");
  }

  const pathname = [
    "organizations",
    safePathSegment(options.organizationId),
    safePathSegment(options.artifactId),
    safePathSegment(options.filename),
  ].join("/");

  const blob = await put(pathname, options.body, {
    access: "private",
    addRandomSuffix: false,
    contentType: options.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteArtifact(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
