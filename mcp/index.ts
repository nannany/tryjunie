#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch"; // Using node-fetch v2
import { z } from "zod";

// Environment variable checks
// supabaseFunctionUrl is expected to be the base URL for Supabase functions
// (e.g., "http://localhost:54321/functions/v1" or "https://<project_ref>.supabase.co/functions/v1").
const supabaseFunctionUrl =
  "https://vehthsanmculqrnxhpkx.supabase.co/functions/v1/";
const integrationId = process.env.X_INTEGRATION_ID;

// Tool definitions
const CREATE_TASK_TOOL_NAME = "create_task";
const CREATE_TASK_TOOL_DESCRIPTION =
  "Creates a new task in Supabase via the task-management function.";

const SEARCH_TASKS_PER_DAY_TOOL_NAME = "search_tasks_per_day";
const SEARCH_TASKS_PER_DAY_TOOL_DESCRIPTION =
  "Searches for tasks on a specific day in Supabase via the search-tasks-per-day function.";

if (!integrationId) {
  console.error("FATAL: X_INTEGRATION_ID environment variable is not set.");
  process.exit(1);
}

const server = new McpServer({
  name: "Supabase Task Management MCP Server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// Interface for task parameters (kept for clarity, matches the schema)
interface CreateTaskParams {
  title: string;
  description?: string;
  estimated_minute?: number;
  task_date?: string; // ISO date string e.g., "YYYY-MM-DD"
}

// Zod schema for validating createTask parameters
const CreateTaskParamsSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required and cannot be empty.",
  }),
  description: z.string().optional(),
  estimated_minute: z
    .number()
    .int()
    .gte(0, {
      message: "Estimated minutes must be a non-negative integer.",
    })
    .optional(),
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Task date must be in YYYY-MM-DD format.",
    })
    .optional(),
});

// Zod schema for validating searchTasksPerDay parameters
const SearchTasksPerDayParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format.",
  }),
});

// Core logic for the createTask tool
const createTaskToolLogic = async (
  params: CreateTaskParams,
  baseSupabaseFunctionUrl: string,
) => {
  // Type params as CreateTaskParams; Zod validation happens at the start of this function
  let validatedParams: CreateTaskParams;
  try {
    validatedParams = CreateTaskParamsSchema.parse(params); // params are validated here
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `[${new Date().toISOString()}] Invalid parameters for '${CREATE_TASK_TOOL_NAME}' tool:`,
        error.flatten().fieldErrors,
      );
      const errorSummary = Object.entries(error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join("; ");
      // This error will be caught by the CallTool handler and propagated
      throw new Error(
        `Invalid parameters for ${CREATE_TASK_TOOL_NAME}: ${errorSummary}`,
      );
    }
    console.error(
      `[${new Date().toISOString()}] Unexpected error during parameter validation for '${CREATE_TASK_TOOL_NAME}':`,
      error,
    );
    throw new Error(
      "An unexpected error occurred during parameter validation.",
    );
  }

  const body = {
    title: validatedParams.title,
    description: validatedParams.description,
    estimated_minute: validatedParams.estimated_minute,
    task_date: validatedParams.task_date,
  };

  const functionUrl = `${baseSupabaseFunctionUrl}/task-management`;

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-id": integrationId,
      },
      body: JSON.stringify(body),
    });

    let responseBody;
    try {
      responseBody = await response.json();
    } catch (parseError) {
      console.error(
        `[${new Date().toISOString()}] Error parsing JSON response from Supabase for '${CREATE_TASK_TOOL_NAME}':`,
        parseError,
      );
      if (!response.ok) {
        throw new Error(
          `Supabase function '${CREATE_TASK_TOOL_NAME}' returned non-OK status ${response.status} and non-JSON/empty response.`,
        );
      }
      throw new Error(
        `Supabase function '${CREATE_TASK_TOOL_NAME}' returned OK status but failed to parse JSON response: ${parseError}`,
      );
    }

    if (!response.ok) {
      console.error(
        `[${new Date().toISOString()}] Supabase function '${CREATE_TASK_TOOL_NAME}' returned an error: ${response.status}`,
        responseBody,
      );
      const errorMessage =
        responseBody &&
        typeof responseBody === "object" &&
        "message" in responseBody
          ? (responseBody as { message: string }).message
          : JSON.stringify(responseBody);
      throw new Error(
        `Error from Supabase for '${CREATE_TASK_TOOL_NAME}': ${response.status} - ${errorMessage}`,
      );
    }

    return responseBody;
  } catch (error: any) {
    // Errors from fetch or Supabase logic
    console.error(
      `[${new Date().toISOString()}] Error in '${CREATE_TASK_TOOL_NAME}' tool logic execution:`,
      error,
    );
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `An unknown error occurred within the ${CREATE_TASK_TOOL_NAME} tool execution.`,
    );
  }
};

// Interface for searchTasksPerDay parameters
interface SearchTasksPerDayParams {
  date: string;
}

// Core logic for the searchTasksPerDay tool
const searchTasksPerDayToolLogic = async (
  params: SearchTasksPerDayParams,
  baseSupabaseFunctionUrl: string,
) => {
  let validatedParams: SearchTasksPerDayParams;
  try {
    validatedParams = SearchTasksPerDayParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `[${new Date().toISOString()}] Invalid parameters for '${SEARCH_TASKS_PER_DAY_TOOL_NAME}' tool:`,
        error.flatten().fieldErrors,
      );
      const errorSummary = Object.entries(error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join("; ");
      throw new Error(
        `Invalid parameters for ${SEARCH_TASKS_PER_DAY_TOOL_NAME}: ${errorSummary}`,
      );
    }
    console.error(
      `[${new Date().toISOString()}] Unexpected error during parameter validation for '${SEARCH_TASKS_PER_DAY_TOOL_NAME}':`,
      error,
    );
    throw new Error(
      "An unexpected error occurred during parameter validation.",
    );
  }

  const functionUrl = `${baseSupabaseFunctionUrl}/search-tasks-per-day`;
  const body = { date: validatedParams.date };

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-id": integrationId, // integrationId is a global constant
      },
      body: JSON.stringify(body),
    });

    let responseBody;
    try {
      responseBody = await response.json();
    } catch (parseError) {
      console.error(
        `[${new Date().toISOString()}] Error parsing JSON response from Supabase for '${SEARCH_TASKS_PER_DAY_TOOL_NAME}':`,
        parseError,
      );
      if (!response.ok) {
        throw new Error(
          `Supabase function '${SEARCH_TASKS_PER_DAY_TOOL_NAME}' returned non-OK status ${response.status} and non-JSON/empty response.`,
        );
      }
      throw new Error(
        `Supabase function '${SEARCH_TASKS_PER_DAY_TOOL_NAME}' returned OK status but failed to parse JSON response: ${parseError}`,
      );
    }

    if (!response.ok) {
      console.error(
        `[${new Date().toISOString()}] Supabase function '${SEARCH_TASKS_PER_DAY_TOOL_NAME}' returned an error: ${response.status}`,
        responseBody,
      );
      const errorMessage =
        responseBody &&
        typeof responseBody === "object" &&
        "message" in responseBody
          ? (responseBody as { message: string }).message
          : JSON.stringify(responseBody);
      throw new Error(
        `Error from Supabase for '${SEARCH_TASKS_PER_DAY_TOOL_NAME}': ${response.status} - ${errorMessage}`,
      );
    }

    return responseBody; // Should be { tasks: [...] }
  } catch (error: any) {
    console.error(
      `[${new Date().toISOString()}] Error in '${SEARCH_TASKS_PER_DAY_TOOL_NAME}' tool logic execution:`,
      error,
    );
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `An unknown error occurred within the ${SEARCH_TASKS_PER_DAY_TOOL_NAME} tool execution.`,
    );
  }
};

// --- MCP Request Handlers ---
// CallTool Handler
server.tool(
  CREATE_TASK_TOOL_NAME,
  CREATE_TASK_TOOL_DESCRIPTION,
  {
    title: z.string().min(1, {
      message: "Title is required and cannot be empty.",
    }),
    description: z.string().optional(),
    estimated_minute: z
      .number()
      .int()
      .gte(0, {
        message: "Estimated minutes must be a non-negative integer.",
      })
      .optional(),
    task_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Task date must be in YYYY-MM-DD format.",
      })
      .optional(),
  },
  async ({ title, description, estimated_minute, task_date }) => {
    try {
      // supabaseFunctionUrl is the global constant holding the base URL
      await createTaskToolLogic(
        {
          title,
          description,
          estimated_minute,
          task_date,
        },
        supabaseFunctionUrl,
      );

      return {
        content: [
          {
            type: "text",
            text: "task created",
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`An unexpected error occurred : ${error}`);
    }
  },
);

// Register search_tasks_per_day tool
server.tool(
  SEARCH_TASKS_PER_DAY_TOOL_NAME,
  SEARCH_TASKS_PER_DAY_TOOL_DESCRIPTION,
  {
    date: SearchTasksPerDayParamsSchema.shape.date,
  },
  async ({ date }: { date: string }) => {
    try {
      // supabaseFunctionUrl is the global constant holding the base URL
      const tasksResponse = await searchTasksPerDayToolLogic(
        { date },
        supabaseFunctionUrl,
      );

      return {
        content: [
          {
            type: "text",
            // Assuming tasksResponse is an object like { tasks: [...] }
            text: `Successfully fetched tasks for ${date}: ${JSON.stringify(tasksResponse.tasks)}`,
          },
        ],
      };
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `An unexpected error occurred while searching tasks for ${date}: ${error}`,
      );
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Management MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
