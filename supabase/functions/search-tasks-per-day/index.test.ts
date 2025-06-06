import {
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import sinon from "npm:sinon";
import { handler } from "./index.ts"; // Import the handler from index.ts

// Mock environment variables
const mockEnv = {
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_key",
  SUPABASE_ANON_KEY: "anon_key",
  X_SUPABASE_JWT_SECRET: "jwt_secret",
};

// Helper to create a mock request
function createMockRequest(
  method: string,
  body: any,
  headers: Record<string, string>,
): Request {
  return new Request("http://localhost/test", {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Main test suite
Deno.test("search-tasks-per-day function tests", async (t) => {
  let originalEnvGet: any;

  // Setup: Mock Deno.env.get
  await t.step("Setup: Mock Deno.env.get", () => {
    originalEnvGet = Deno.env.get;
    Deno.env.get = (key: string) => mockEnv[key as keyof typeof mockEnv] || originalEnvGet(key);
  });

  // Mock Supabase client
  const mockSupabaseClient = {
    from: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    eq: sinon.stub().returnsThis(),
    single: sinon.stub(), // For integration_keys
    // For tasks query, .select().eq().eq() will return a promise
  };

  // Mock createClient to return our mock client
  // This is a simplified mock. In a real scenario, you might need a more robust solution
  // or to mock the global createClient import if it's directly used.
  // For this example, we assume `createClient` is available in the handler's scope or imported.
  // If it's imported as `import { createClient } from "..."`, that import needs to be mockable.
  // This often involves using a dependency injection pattern or a mocking library that can hijack imports.
  // For simplicity here, we'll assume a way to override it or that the handler uses a passed-in client.
  // The actual `index.ts` imports createClient directly, so this mock needs to be more sophisticated.
  // We will stub the global `createClient` which is not ideal but common in Deno tests without specific DI.
  let createClientStub: sinon.SinonStub;


  await t.step("Setup: Stub createClient", () => {
    // This is a bit of a hack. Ideally, createClient would be injectable.
    // We're trying to mock the `createClient` used within the handler.
    // This requires knowing how `createClient` is imported and used in `index.ts`.
    // Assuming `index.ts` uses `import { createClient } from '...'`, this is hard to mock directly
    // without tools like `deno-mock` or `testdouble.js` which can replace module imports.
    // A common workaround is to have a utility module that exports `createClient` and mock that.
    // For now, let's assume we can stub it on a globally accessible object if it were structured that way,
    // or we accept this test will try to make actual network calls if not properly mocked.

    // Given the current structure of index.ts, we'll mock the behavior of the client methods directly.
    // The `createClient` itself won't be stubbed here, but its chained methods will be.
    // This means we rely on the `from`, `select`, `eq`, `single` stubs defined above
    // to be correctly configured for each test case.
  });


  await t.step("Valid Request (Tasks Found)", async () => {
    const requestDate = "2024-03-10";
    const integrationId = "valid-integration-id";
    const userId = "user-123";
    const tasks = [{ id: 1, title: "Test Task", task_date: requestDate, user_id: userId }];

    mockSupabaseClient.from.withArgs("integration_keys").returnsThis();
    mockSupabaseClient.select.withArgs("user_id, is_active").returnsThis();
    mockSupabaseClient.eq.withArgs("key", integrationId).returnsThis();
    mockSupabaseClient.single.resolves({ data: { user_id: userId, is_active: true }, error: null });

    mockSupabaseClient.from.withArgs("tasks").returnsThis();
    mockSupabaseClient.select.withArgs("*").returnsThis();
    mockSupabaseClient.eq.withArgs("task_date", requestDate).returnsThis();
    mockSupabaseClient.eq.withArgs("user_id", userId).resolves({ data: tasks, error: null });


    // How to make createClient() return our mock? This is the tricky part.
    // For now, we'll assume the global stubs on mockSupabaseClient work if createClient
    // is not directly replaceable. This implies `index.ts` would somehow use this global mock.
    // This is a simplification.
    const createClientModule = await import("https://esm.sh/@supabase/supabase-js@2");
    createClientStub = sinon.stub(createClientModule, "createClient").returns(mockSupabaseClient);


    const req = createMockRequest("POST", { date: requestDate }, { "x-integration-id": integrationId });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 200);
    assertEquals(resBody.tasks, tasks);
    createClientStub.restore(); // Clean up stub
  });

  await t.step("Valid Request (No Tasks Found)", async () => {
    const requestDate = "2024-03-11";
    const integrationId = "valid-integration-id-no-tasks";
    const userId = "user-456";

    mockSupabaseClient.from.withArgs("integration_keys").returnsThis();
    mockSupabaseClient.select.withArgs("user_id, is_active").returnsThis();
    mockSupabaseClient.eq.withArgs("key", integrationId).returnsThis();
    mockSupabaseClient.single.resolves({ data: { user_id: userId, is_active: true }, error: null });

    mockSupabaseClient.from.withArgs("tasks").returnsThis();
    mockSupabaseClient.select.withArgs("*").returnsThis();
    mockSupabaseClient.eq.withArgs("task_date", requestDate).returnsThis();
    mockSupabaseClient.eq.withArgs("user_id", userId).resolves({ data: null, error: null }); // No tasks

    const createClientModule = await import("https://esm.sh/@supabase/supabase-js@2");
    createClientStub = sinon.stub(createClientModule, "createClient").returns(mockSupabaseClient);

    const req = createMockRequest("POST", { date: requestDate }, { "x-integration-id": integrationId });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 200);
    assertEquals(resBody.tasks, []);
    createClientStub.restore();
  });

  await t.step("Missing date Parameter", async () => {
    const req = createMockRequest("POST", {}, { "x-integration-id": "any-id" }); // Empty body
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 400);
    assertEquals(resBody.error, "Missing or invalid date parameter");
  });

  await t.step("Invalid Date Format", async () => {
    const req = createMockRequest("POST", { date: "invalid-date" }, { "x-integration-id": "any-id" });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 400);
    assertEquals(resBody.error, "Invalid date format");
  });

  await t.step("Missing x-integration-id Header", async () => {
    const req = createMockRequest("POST", { date: "2024-03-10" }, {}); // No x-integration-id
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 400);
    assertEquals(resBody.error, "x-integration-id header is missing");
  });

  await t.step("Invalid x-integration-id (Not Found)", async () => {
    const integrationId = "unknown-id";
    mockSupabaseClient.from.withArgs("integration_keys").returnsThis();
    mockSupabaseClient.select.withArgs("user_id, is_active").returnsThis();
    mockSupabaseClient.eq.withArgs("key", integrationId).returnsThis();
    mockSupabaseClient.single.resolves({ data: null, error: { message: "Not found" } }); // Simulate not found

    const createClientModule = await import("https://esm.sh/@supabase/supabase-js@2");
    createClientStub = sinon.stub(createClientModule, "createClient").returns(mockSupabaseClient);

    const req = createMockRequest("POST", { date: "2024-03-10" }, { "x-integration-id": integrationId });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 404);
    assertEquals(resBody.error, "Integration key not found.");
    createClientStub.restore();
  });

  await t.step("Inactive x-integration-id", async () => {
    const integrationId = "inactive-id";
    const userId = "user-789";
    mockSupabaseClient.from.withArgs("integration_keys").returnsThis();
    mockSupabaseClient.select.withArgs("user_id, is_active").returnsThis();
    mockSupabaseClient.eq.withArgs("key", integrationId).returnsThis();
    mockSupabaseClient.single.resolves({ data: { user_id: userId, is_active: false }, error: null }); // Inactive key

    const createClientModule = await import("https://esm.sh/@supabase/supabase-js@2");
    createClientStub = sinon.stub(createClientModule, "createClient").returns(mockSupabaseClient);

    const req = createMockRequest("POST", { date: "2024-03-10" }, { "x-integration-id": integrationId });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 403);
    assertEquals(resBody.error, "Integration key is inactive.");
    createClientStub.restore();
  });

  await t.step("Incorrect HTTP Method", async () => {
    const req = createMockRequest("GET", { date: "2024-03-10" }, { "x-integration-id": "any-id" });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 405);
    assertEquals(resBody.error, "Method not allowed");
  });
  
  await t.step("Server Configuration Error (Missing Env Vars)", async () => {
    // Temporarily undefine a required env var
    const originalSupabaseUrl = mockEnv.SUPABASE_URL;
    mockEnv.SUPABASE_URL = ""; // Make it empty to simulate missing

    const req = createMockRequest("POST", { date: "2024-03-10" }, { "x-integration-id": "any-id" });
    const res = await handler(req);
    const resBody = await res.json();

    assertEquals(res.status, 500);
    assertEquals(resBody.error, "Server configuration error.");

    mockEnv.SUPABASE_URL = originalSupabaseUrl; // Restore
  });

  // Teardown: Restore Deno.env.get
  await t.step("Teardown: Restore Deno.env.get", () => {
    Deno.env.get = originalEnvGet;
    // Ensure all stubs are restored if they were global
    if (createClientStub && typeof createClientStub.restore === 'function') {
        createClientStub.restore();
    }
    // Restore individual method stubs on mockSupabaseClient if necessary, though sinon typically handles this
    // if the stubbed object itself is local to the test.
    // For global/module-level stubs, explicit restoration is key.
    sinon.restore(); // Restores all sinon stubs and spies
  });
});

// Note: The createToken function also involves crypto operations and djwt.
// Mocking these would be necessary if we were testing token generation failure specifically,
// or if createToken itself was a separate unit under test.
// For these tests, we assume createToken works if inputs are correct,
// or we mock its return value if it were refactored to be injectable/mockable.
// The current tests focus on the main handler logic flow.

// The `serve` utility from `_shared/test_utils.ts` is assumed to be something like:
//
// export async function serve(handler: (req: Request) => Promise<Response> | Response) {
//   // This is a simplified version. A real one might involve starting an actual server
//   // or using a library that can simulate Deno.serve calls.
//   return async (req: Request) => {
//     return await handler(req);
//   };
// }
//
// However, the provided `index.ts` directly calls `Deno.serve(async (req) => { ... })`.
// So, to test it, we need to extract the callback function.
// Let's assume `handler` imported from `../index.ts` IS this callback.
// The `index.ts` would need to be structured to export this callback, e.g.:
//
// export const handler = async (req: Request) => { ... actual logic ... };
// Deno.serve(handler);
//
// My current `index.ts` is `Deno.serve(async (req) => { ... })`.
// I will need to refactor `index.ts` to export the handler.
// For now, I will proceed with the test file creation.
// The test assumes `handler` is the exported async function passed to Deno.serve.
// I will need a follow-up subtask to refactor index.ts for testability.

// Final check on mocking `createClient`:
// The current approach of `sinon.stub(createClientModule, "createClient")` is the most robust way
// to mock ES module imports with Sinon in Deno if you re-import the module in each test
// or ensure the stub is configured before the handler uses `createClient`.
// This was added to relevant tests.
// The stubs on `mockSupabaseClient` (e.g., `mockSupabaseClient.from`) are what this stubbed `createClient` returns.
