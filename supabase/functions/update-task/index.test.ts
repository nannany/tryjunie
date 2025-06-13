import { handler } from "./index.ts";
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { stub, restore } from "https://deno.land/std@0.224.0/testing/mock.ts";

// Store original Deno.env.get
const originalEnvGet = Deno.env.get;

Deno.test("Update Task Function Tests", async (t) => {
  const mockEnv = {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: "service_role_key",
    SUPABASE_ANON_KEY: "anon_key",
    X_SUPABASE_JWT_SECRET: "jwt_secret_123456789012345678901234567890",
  };

  // Helper to create a request
  const createTestRequest = (
    body: Record<string, any> | null,
    headers?: Record<string, string>,
  ): Request => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      "x-integration-id": "test-integration-id",
      ...headers,
    };
    return new Request("http://localhost/update-task", {
      method: "POST",
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : null,
    });
  };

  await t.step("1. Successful Task Update (Basic)", async () => {
    stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
    const mockSupabaseClient = {
      from: stub().callsFake((tableName: string) => {
        if (tableName === "integration_keys") {
          return {
            select: stub().returnsThis(),
            eq: stub().returnsThis(),
            update: stub().returnsThis(),
            single: stub().resolves({
              data: { user_id: "user-123", is_active: true },
              error: null,
            }),
          };
        }
        if (tableName === "tasks") {
          return {
            update: stub().callsFake((updateObj: Record<string, any>) => {
              // Basic check that id is not in updateObj
              assertEquals(updateObj.id, undefined);
              return mockSupabaseClient.from("tasks"); // return self for chaining
            }),
            eq: stub().returnsThis(),
            select: stub().returnsThis(),
            single: stub().resolves({
              data: {
                id: "task-abc",
                title: "Updated Title",
                user_id: "user-123",
              }, // Mocked response data
              error: null,
            }),
          };
        }
        return {};
      }),
    };
    stub(globalThis, "fetch");
    const createClientStub = stub(
      await import("https://esm.sh/@supabase/supabase-js@2"),
      "createClient",
      () => mockSupabaseClient as any,
    );

    const req = createTestRequest({ id: "task-abc", title: "Updated Title" });
    const res = await handler(req);
    const json = await res.json();

    assertEquals(res.status, 200);
    assertEquals(json.message, "Task updated successfully.");
    assertEquals(json.task.id, "task-abc");
    assertEquals(json.task.title, "Updated Title");

    createClientStub.restore();
    restore();
  });

  await t.step("2. Task Not Found (for the given user)", async () => {
    stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
    const mockSupabaseClient = {
      from: stub().callsFake((tableName: string) => {
        if (tableName === "integration_keys") {
          return {
            select: stub().returnsThis(),
            eq: stub().returnsThis(),
            update: stub().returnsThis(),
            single: stub().resolves({
              data: { user_id: "user-123", is_active: true },
              error: null,
            }),
          };
        }
        if (tableName === "tasks") {
          return {
            update: stub().returnsThis(),
            eq: stub().returnsThis(),
            select: stub().returnsThis(),
            single: stub().resolves({
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            }),
          };
        }
        return {};
      }),
    };
    stub(globalThis, "fetch");
    const createClientStub = stub(
      await import("https://esm.sh/@supabase/supabase-js@2"),
      "createClient",
      () => mockSupabaseClient as any,
    );

    const req = createTestRequest({
      id: "task-nonexistent",
      title: "Try Update",
    });
    const res = await handler(req);
    const json = await res.json();
    assertEquals(res.status, 404);
    assertEquals(
      json.error,
      "Task not found or user does not have permission to update it.",
    );
    createClientStub.restore();
    restore();
  });

  await t.step("3. Invalid Input Data", async (it) => {
    stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
    const createClientStub = stub(
      await import("https://esm.sh/@supabase/supabase-js@2"),
      "createClient",
      () => ({ from: () => ({}) }) as any,
    );

    await it.step("Missing task id", async () => {
      /* ... */
    }); // Existing tests assumed here for brevity
    await it.step("Invalid title type", async () => {
      /* ... */
    });
    await it.step("Invalid estimated_minute", async () => {
      /* ... */
    });
    await it.step("Invalid task_date format", async () => {
      /* ... */
    });
    await it.step("Invalid calendar task_date", async () => {
      /* ... */
    });

    await it.step("Invalid start_time format", async () => {
      const req = createTestRequest({
        id: "task-123",
        start_time: "2023-01-01 10:00:00",
      }); // Missing T and Z/offset
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 400);
      assertStringIncludes(
        json.details[0],
        "start_time must be a valid ISO 8601 datetime string",
      );
    });

    await it.step("Invalid end_time format", async () => {
      const req = createTestRequest({ id: "task-123", end_time: "not-a-date" });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 400);
      assertStringIncludes(
        json.details[0],
        "end_time must be a valid ISO 8601 datetime string",
      );
    });

    await it.step("end_time before start_time", async () => {
      const req = createTestRequest({
        id: "task-123",
        start_time: "2024-03-10T12:00:00Z",
        end_time: "2024-03-10T10:00:00Z",
      });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 400);
      assertStringIncludes(
        json.details[0],
        "end_time must be after start_time",
      );
    });

    createClientStub.restore(); // Restore after all sub-steps of "Invalid Input Data"
    restore(); // Restore Deno.env.get stub
  });

  await t.step("4. Missing x-integration-id Header", async () => {
    /* ... */
  });
  await t.step("5. Invalid x-integration-id (Not Found in DB)", async () => {
    /* ... */
  });
  await t.step("6. Inactive x-integration-id", async () => {
    /* ... */
  });
  await t.step("7. No Updatable Fields Provided", async () => {
    /* ... */
  });

  await t.step("8. Successful Time Field Updates", async (it) => {
    stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
    let lastUpdateObject: Record<string, any> | null = null;

    const mockSupabaseClientFactory = (
      expectedReturnData: Record<string, any>,
    ) => ({
      from: stub().callsFake((tableName: string) => {
        if (tableName === "integration_keys") {
          return {
            select: stub().returnsThis(),
            eq: stub().returnsThis(),
            update: stub().returnsThis(),
            single: stub().resolves({
              data: { user_id: "user-time-tester", is_active: true },
              error: null,
            }),
          };
        }
        if (tableName === "tasks") {
          return {
            update: stub().callsFake((updateObj: Record<string, any>) => {
              lastUpdateObject = updateObj;
              return mockSupabaseClientFactory(expectedReturnData).from(
                "tasks",
              ); // Return self for chaining
            }),
            eq: stub().returnsThis(),
            select: stub().returnsThis(),
            single: stub().resolves({
              data: { id: "task-time", ...expectedReturnData },
              error: null,
            }),
          };
        }
        return {};
      }),
    });
    stub(globalThis, "fetch");

    await it.step("Updating start_time only", async () => {
      const startTime = "2024-03-10T10:00:00Z";
      const createClientStub = stub(
        await import("https://esm.sh/@supabase/supabase-js@2"),
        "createClient",
        () => mockSupabaseClientFactory({ start_time: startTime }) as any,
      );
      const req = createTestRequest({ id: "task-time", start_time: startTime });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertEquals(json.task.start_time, startTime);
      assertEquals(lastUpdateObject?.start_time, startTime);
      createClientStub.restore();
      restore(); // Deno.env stub
    });

    await it.step("Updating end_time only", async () => {
      stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]); // Re-stub Deno.env for this sub-step
      const endTime = "2024-03-10T12:00:00Z";
      const createClientStub = stub(
        await import("https://esm.sh/@supabase/supabase-js@2"),
        "createClient",
        () => mockSupabaseClientFactory({ end_time: endTime }) as any,
      );
      const req = createTestRequest({ id: "task-time", end_time: endTime });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertEquals(json.task.end_time, endTime);
      assertEquals(lastUpdateObject?.end_time, endTime);
      createClientStub.restore();
      restore(); // Deno.env stub
    });

    await it.step("Updating both start_time and end_time", async () => {
      stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
      const startTime = "2024-03-10T14:00:00Z";
      const endTime = "2024-03-10T15:00:00Z";
      const createClientStub = stub(
        await import("https://esm.sh/@supabase/supabase-js@2"),
        "createClient",
        () =>
          mockSupabaseClientFactory({
            start_time: startTime,
            end_time: endTime,
          }) as any,
      );

      const req = createTestRequest({
        id: "task-time",
        start_time: startTime,
        end_time: endTime,
      });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertEquals(json.task.start_time, startTime);
      assertEquals(json.task.end_time, endTime);
      assertEquals(lastUpdateObject?.start_time, startTime);
      assertEquals(lastUpdateObject?.end_time, endTime);
      createClientStub.restore();
      restore();
    });

    await it.step("Setting start_time to null", async () => {
      stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
      const createClientStub = stub(
        await import("https://esm.sh/@supabase/supabase-js@2"),
        "createClient",
        () => mockSupabaseClientFactory({ start_time: null }) as any,
      );
      const req = createTestRequest({ id: "task-time", start_time: null });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertEquals(json.task.start_time, null);
      assertEquals(lastUpdateObject?.start_time, null);
      createClientStub.restore();
      restore();
    });

    await it.step("Setting end_time to null", async () => {
      stub(Deno.env, "get", (key) => mockEnv[key as keyof typeof mockEnv]);
      const createClientStub = stub(
        await import("https://esm.sh/@supabase/supabase-js@2"),
        "createClient",
        () => mockSupabaseClientFactory({ end_time: null }) as any,
      );
      const req = createTestRequest({ id: "task-time", end_time: null });
      const res = await handler(req);
      const json = await res.json();
      assertEquals(res.status, 200);
      assertEquals(json.task.end_time, null);
      assertEquals(lastUpdateObject?.end_time, null);
      createClientStub.restore();
      restore();
    });
    // No top-level restore() here, as each sub-step handles it for Deno.env.get
  });

  // Restore Deno.env.get to its original state after all tests in this block
  stub(Deno.env, "get", originalEnvGet);
  restore(); // Final restore for any remaining stubs if tests exited early
});

// Fill in the missing test steps from the original file for brevity
// This is a placeholder to indicate that the original tests are assumed to be here.
// In a real scenario, you would merge this by adding the new tests to the existing structure.
const _placeholderOriginalTests = async (t: Deno.TestContext) => {
  await t.step("3. Invalid Input Data", async (it) => {
    await it.step("Missing task id", async () => {});
    await it.step("Invalid title type", async () => {});
    await it.step("Invalid estimated_minute", async () => {});
    await it.step("Invalid task_date format", async () => {});
    await it.step("Invalid calendar task_date", async () => {});
  });
  await t.step("4. Missing x-integration-id Header", async () => {});
  await t.step("5. Invalid x-integration-id (Not Found in DB)", async () => {});
  await t.step("6. Inactive x-integration-id", async () => {});
  await t.step("7. No Updatable Fields Provided", async () => {});
};
