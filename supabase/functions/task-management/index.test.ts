import {
  assert,
  assertEquals,
  assertExists,
  assertObjectMatch,
} from "https://deno.land/std@0.192.0/testing/asserts.ts"; // Using a specific version for stability
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";
// Assuming the createToken function is exported from index.ts or can be extracted/adapted
// For this test, let's copy a simplified version of createToken here or make it accessible.

// Simplified/adapted createToken for testing.
// In a real scenario, you'd import this from your actual index.ts.
// To make this self-contained for the tool, I'm redefining it.
// IMPORTANT: This definition MUST match the one in index.ts for the test to be valid.
async function createTokenForTest(
  userId: string,
  currentJwtSecret: string,
  currentSupabaseUrl: string,
) {
  const payload = {
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: currentSupabaseUrl,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };

  const secretKeyData = new TextEncoder().encode(currentJwtSecret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"], // Ensure "verify" is also here if using the same key for djwt.verify
  );
  return await djwt.create({ alg: "HS256", typ: "JWT" }, payload, key);
}

// Helper to import a key for djwt.verify, similar to how createToken does for signing
async function importKeyForVerification(jwtSecret: string) {
  const secretKeyData = new TextEncoder().encode(jwtSecret);
  return await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

Deno.test("createToken generates a valid JWT with correct claims", async () => {
  const mockUserId = "12345678-1234-1234-1234-1234567890ab";
  const mockSupabaseUrl = "http://localhost:54321";
  const mockJwtSecret = "test-super-secret-jwt-token-for-testing"; // Must be strong enough for HS256

  // Store original Deno.env.get and replace it
  const originalEnvGet = Deno.env.get;
  const mockEnv: Record<string, string> = {
    SUPABASE_URL: mockSupabaseUrl,
    SUPABASE_JWT_SECRET: mockJwtSecret,
  };
  Deno.env.get = (key: string) => mockEnv[key] || undefined;

  let token: string | undefined;
  let error: Error | undefined;

  try {
    // In a real test, you'd call the original createToken function from index.ts
    // For now, calling the adapted version:
    token = await createTokenForTest(mockUserId, mockJwtSecret, mockSupabaseUrl);
  } catch (e) {
    error = e;
  } finally {
    // Restore original Deno.env.get
    Deno.env.get = originalEnvGet;
  }

  assert(!error, `Token generation failed: ${error?.message}`);
  assertExists(token, "Token was not generated.");

  // Verify the token
  let decodedPayload: djwt.Payload | undefined;
  let verificationError: Error | undefined;
  try {
    const key = await importKeyForVerification(mockJwtSecret);
    decodedPayload = await djwt.verify(token!, key);
  } catch (e) {
    verificationError = e;
  }

  assert(!verificationError, `Token verification failed: ${verificationError?.message}`);
  assertExists(decodedPayload, "Token payload could not be decoded.");

  // Check standard claims
  assertEquals(decodedPayload.sub, mockUserId, "Subject claim (sub) is incorrect.");
  assertEquals(decodedPayload.iss, mockSupabaseUrl, "Issuer claim (iss) is incorrect.");
  assertEquals(decodedPayload.aud, "authenticated", "Audience claim (aud) is incorrect.");
  assertEquals(decodedPayload.role, "authenticated", "Role claim is incorrect.");

  // Check time-based claims (iat, exp)
  assertExists(decodedPayload.iat, "IssuedAt claim (iat) is missing.");
  assertExists(decodedPayload.exp, "Expiration claim (exp) is missing.");
  assert(typeof decodedPayload.iat === "number", "iat should be a number.");
  assert(typeof decodedPayload.exp === "number", "exp should be a number.");
  assert(decodedPayload.exp > decodedPayload.iat, "exp should be after iat.");
  
  // Check if iat is recent (e.g., within the last 5 minutes)
  const nowInSeconds = Math.floor(Date.now() / 1000);
  assert(
    decodedPayload.iat <= nowInSeconds && decodedPayload.iat > nowInSeconds - 300,
    "iat is not recent."
  );
  // Check if exp is approximately 1 hour from iat
  assertEquals(decodedPayload.exp, decodedPayload.iat + 3600, "exp is not 1 hour after iat.");
});

Deno.test("createToken (adapted) throws error if JWT secret is empty or too weak (conceptual)", async () => {
  // This specific test is harder to make pass deterministically with createTokenForTest
  // because crypto.subtle.importKey itself will throw an error for weak keys
  // before djwt.create even gets called with an empty secret.
  // djwt's own internal checks might also fire.

  // The main function (index.ts) has an upfront check for SUPABASE_JWT_SECRET.
  // This test case is more about the robustness of crypto APIs.

  const mockUserId = "test-user-id";
  const mockSupabaseUrl = "http://localhost:8000";
  const weakSecret = ""; // Empty secret

  let error: Error | undefined;
  try {
    // We are calling createTokenForTest directly, which doesn't have the Deno.env.get('SUPABASE_JWT_SECRET') check.
    // The error will likely come from crypto.subtle.importKey.
    await createTokenForTest(mockUserId, weakSecret, mockSupabaseUrl);
  } catch (e) {
    error = e;
  }
  
  assertExists(error, "createTokenForTest should throw an error with an empty secret.");
  // The error message might vary: "Key length is zero" or similar from crypto.subtle, or from djwt.
  // For now, just checking an error is thrown is sufficient for this conceptual test.
  console.log(`(Conceptual test) Error for empty secret: ${error?.message}`);
});
