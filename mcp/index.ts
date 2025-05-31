import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch"; // Using node-fetch v2
import { z } from "zod";

// Environment variable checks
const supabaseFunctionUrl = process.env.SUPABASE_FUNCTION_URL;
const integrationId = process.env.X_INTEGRATION_ID;

// Tool definitions
const CREATE_TASK_TOOL_NAME = "create_task";
const CREATE_TASK_TOOL_DESCRIPTION =
  "Creates a new task in Supabase via the task-management function.";

if (!supabaseFunctionUrl) {
  console.error(
    "FATAL: SUPABASE_FUNCTION_URL environment variable is not set.",
  );
  process.exit(1);
}
if (!integrationId) {
  console.error("FATAL: X_INTEGRATION_ID environment variable is not set.");
  process.exit(1);
}

const server = new McpServer({
  name: "Supabase Task Management MCP Server",
  version: "1.0.0",
  capabilities: {
    tools: [CREATE_TASK_TOOL_NAME],
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
  estimated_minute: z.number().int().gte(0, {
    message: "Estimated minutes must be a non-negative integer.",
  }).optional(),
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Task date must be in YYYY-MM-DD format.",
  }).optional(),
});

// Core logic for the createTask tool
const createTaskToolLogic = async (params: CreateTaskParams) => { // Type params as CreateTaskParams; Zod validation happens at the start of this function
  let validatedParams: CreateTaskParams;
  try {
    validatedParams = CreateTaskParamsSchema.parse(params); // params are validated here
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `[${
          new Date().toISOString()
        }] Invalid parameters for '${CREATE_TASK_TOOL_NAME}' tool:`,
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
      `[${
        new Date().toISOString()
      }] Unexpected error during parameter validation for '${CREATE_TASK_TOOL_NAME}':`,
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

  try {
    const response = await fetch(supabaseFunctionUrl, {
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
        `[${
          new Date().toISOString()
        }] Error parsing JSON response from Supabase:`,
        parseError,
      );
      if (!response.ok) {
        throw new Error(
          `Supabase function returned non-OK status ${response.status} and non-JSON/empty response.`,
        );
      }
      throw new Error(
        `Supabase function returned OK status but failed to parse JSON response: ${parseError}`,
      );
    }

    if (!response.ok) {
      console.error(
        `[${
          new Date().toISOString()
        }] Supabase function returned an error: ${response.status}`,
        responseBody,
      );
      const errorMessage = (responseBody && typeof responseBody === "object" &&
          "message" in responseBody)
        ? (responseBody as { message: string }).message
        : JSON.stringify(responseBody);
      throw new Error(
        `Error from Supabase: ${response.status} - ${errorMessage}`,
      );
    }

    return responseBody;
  } catch (error: any) { // Errors from fetch or Supabase logic
    console.error(
      `[${
        new Date().toISOString()
      }] Error in '${CREATE_TASK_TOOL_NAME}' tool logic execution:`,
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

// --- MCP Request Handlers ---
// CallTool Handler
server.tool(CREATE_TASK_TOOL_NAME, async (request: any) => {
  // Assuming request is an object with toolName and parameters.
  // For stricter validation, parse 'request' with CallToolRequestSchema if it's a Zod schema.
  // E.g., const validatedRequest = CallToolRequestSchema.parse(request);
  // const { toolName, parameters } = validatedRequest;

  const toolName = request.toolName;
  const parameters = request.parameters; // These parameters are passed to the specific tool logic

  try {
    switch (toolName) {
      case CREATE_TASK_TOOL_NAME:
        // createTaskToolLogic itself handles Zod validation of its parameters
        return await createTaskToolLogic(parameters);
      // Cases for other tools would go here
      default:
        console.error(
          `[${new Date().toISOString()}] Unknown tool called: '${toolName}'`,
        );
        throw new Error(`Tool '${toolName}' not found.`);
    }
  } catch (error: any) {
    // This catches errors from tool logic (including Zod validation errors within them) or the switch statement.
    console.error(
      `[${
        new Date().toISOString()
      }] Error during execution of tool '${toolName}':`,
      error.message,
    );
    // Re-throw the error so McpServer can handle it and relay to the client.
    // Ensure it's an Error instance.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `An unexpected error occurred while executing tool '${toolName}': ${error}`,
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Management MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
