# MCP Server (Node.js)

This server implements the Model Context Protocol (MCP) using the `@modelcontextprotocol/sdk` for Node.js. It is intended to interact with the Supabase `task-management` Edge Function.

## Purpose

The server uses `StdioServerTransport`, meaning it communicates over standard input/output. The primary goal is to expose MCP capabilities (like Tools) that allow clients to interact with the Supabase `task-management` function. For example, an MCP client could invoke a tool on this server, which would then trigger an HTTP POST request to the Supabase function.

Technically, the server implements handlers for standard MCP requests (like listing tools and calling tools). It advertises the `create_task` tool with its input parameter schema (derived from Zod) when queried by an MCP client.

## Setup and Running

1.  **Prerequisites**:

    - Ensure you have [Node.js](https://nodejs.org/) installed (which includes npm).
    - The Supabase stack (including the `task-management` function) should be running if you intend to test interactions with it.

2.  **Navigate to the directory**:

    ```bash
    cd /path/to/your/project/mcp
    ```

3.  **Install Dependencies**:
    If you haven't already, or if you've pulled this fresh:

    ```bash
    npm install
    ```

4.  **Set Environment Variables**:
    Before running the server, you **must** set the environment variables detailed below.
    Example:

    ```bash
    export SUPABASE_FUNCTION_URL="http://localhost:54321/functions/v1/task-management"
    export X_INTEGRATION_ID="your-actual-integration-id"
    ```

5.  **Running the Server**:
    The server is written in TypeScript and can be run using `ts-node`:

    ```bash
    # Ensure environment variables are set as shown above
    npx ts-node index.ts
    ```

    Alternatively, you can compile the TypeScript to JavaScript using `tsc` (as per `tsconfig.json` settings which outputs to `./dist`) and then run the JavaScript file:

    ```bash
    # Ensure environment variables are set
    npm run build  # This uses the "build": "tsc" script in package.json
    node dist/index.js
    ```

    For simplicity during development, `ts-node` is often preferred.

    Upon starting, you should see messages indicating the Supabase URL and Integration ID being used, followed by: `"[timestamp] MCP Server with StdioTransport started. Ready to handle ListTools and CallTool requests."` (The actual tool name `create_task` is advertised via the ListTools handler).

## Environment Variables (Required)

The following environment variables **must** be set before running the server:

- **`SUPABASE_FUNCTION_URL`**: Specifies the full URL of the target Supabase `task-management` Edge Function.

  - Example: `export SUPABASE_FUNCTION_URL="http://localhost:54321/functions/v1/task-management"`
  - For a deployed Supabase function, use its production URL.

- **`X_INTEGRATION_ID`**: The Integration ID required by the Supabase `task-management` function for authentication and authorization. This ID is used by the Supabase function to identify and authorize the calling user or system.
  - Example: `export X_INTEGRATION_ID="your-actual-integration-id"`

The server will log an error and exit if these variables are not detected at startup.

## Interaction Model

The `task-management` Supabase function is an HTTP endpoint that expects `POST` requests with a JSON body and an `x-integration-id` header (note: the header sent to Supabase remains `x-integration-id`).

This MCP server exposes its functionality through an MCP Tool named `create_task`.

### Tool: `create_task(params)`

**Parameters (`params` object):**

- `title` (string): The title of the task. **Required**.
- `description` (string, optional): A description for the task.
- `estimated_minute` (number, optional): Estimated time in minutes for the task.
- `task_date` (string, optional): The date for the task in "YYYY-MM-DD" format. If not provided, the Supabase function typically defaults to the current date.

When an MCP client invokes this tool (e.g., over the stdio transport), the server will:

1.  Use the `title`, `description`, `estimated_minute`, and `task_date` from the `params` to construct the JSON body for the HTTP request.
2.  Retrieve the `SUPABASE_FUNCTION_URL` (to know where to send the request) and `X_INTEGRATION_ID` (for the `x-integration-id` header) from the environment variables.
3.  Make an HTTP `POST` request to the configured `SUPABASE_FUNCTION_URL`.
4.  Return the JSON response (which could be a success object or an error object) from the Supabase function directly back to the MCP client.

This allows MCP clients to manage tasks in Supabase without needing to handle HTTP requests or manage Supabase-specific authentication details directly.

## Example MCP Client Configuration

This section provides an example of how this MCP server could be configured in an MCP client application (e.g., a desktop assistant that supports MCP). The exact format may vary by client.

```json
{
  "mcpServers": {
    "myTaskServer": {
      "command": "node",
      "args": ["/path/to/your/project/mcp/dist/index.js"],
      "env": {
        "X_INTEGRATION_ID": "your-actual-integration-id-value",
        "SUPABASE_FUNCTION_URL": "https://<your-project-ref>.supabase.co/functions/v1/task-management"
      }
    }
  }
}
```

**Notes on Client Configuration:**

- **`myTaskServer`**: This is a client-defined alias for this MCP server instance. The client will use this name to direct MCP requests.
- **`command` and `args`**:
  - These fields specify how to launch the MCP server.
  - The example `["node", "/path/to/your/project/mcp/dist/index.js"]` assumes you have built the TypeScript to JavaScript using `npm run build` and are running the compiled output.
  - Alternatively, for development or if `ts-node` is globally available and preferred, you might use `["npx", "ts-node", "/path/to/your/project/mcp/index.ts"]`.
  - Ensure the path to `index.js` or `index.ts` is correct for your system.
- **`env`**:
  - This block is crucial for passing the required environment variables to the server process.
  - `X_INTEGRATION_ID`: Must be set to your specific integration ID.
  - `SUPABASE_FUNCTION_URL`: Must be set to the URL of your Supabase `task-management` function.
  - Include any other environment variables your server might need in the future.

This configuration allows the MCP client to start and communicate with your MCP server, which then acts as a bridge to your Supabase function.

## Publishing to GitHub Packages

This section explains how to publish the `mcp` package to GitHub Packages.

### Prerequisites

- **Node.js and npm installed**: Ensure you have Node.js (which includes npm) installed on your system.
- **GitHub Personal Access Token (PAT)**: You need a PAT with the `write:packages` scope.
  - Generate one from your GitHub Developer settings.
  - **Important**: Keep this PAT secure, like a password. Do not commit it to your repository.
- **`package.json` Name Scope**: The `name` field in `mcp/package.json` must be correctly scoped for GitHub Packages. It should look like `@USER/mcp`.
  - **Remember to replace `USER` with your actual GitHub username or organization name.**
- **`package.json` publishConfig**: The `mcp/package.json` file must include a `publishConfig` section:
  ```json
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  }
  ```
- **`package.json` Repository URL**: The `mcp/package.json` file should have a `repository` field pointing to your GitHub repository:
  ```json
  "repository": {
    "type": "git",
    "url": "https://github.com/USER/MCP_REPO.git"
  }
  ```
  - **Remember to replace `USER` with your GitHub username/organization and `MCP_REPO` with your repository name.**

### Steps to Publish

1.  **Authenticate with GitHub Packages**:
    You need to tell npm to use your PAT for publishing to GitHub Packages. Create or update your `~/.npmrc` file (or `$HOME/.npmrc` on Windows/macOS/Linux for robustness) with the following line:

    ```bash
    echo "//npm.pkg.github.com/:_authToken=YOUR_PAT" > ~/.npmrc
    ```

    - Replace `YOUR_PAT` with your actual Personal Access Token.
    - This step only needs to be done once on your machine, unless your PAT changes.

2.  **Navigate to the mcp directory**:
    Open your terminal and change to the `mcp` package directory:

    ```bash
    cd /path/to/your/project/mcp
    ```

3.  **Install dependencies**:
    Ensure all dependencies are up-to-date:

    ```bash
    npm install
    ```

4.  **Build the package**:
    Compile the TypeScript code to JavaScript. This usually outputs to a `build` or `dist` directory as specified in your `tsconfig.json` and `package.json` ("files" array).

    ```bash
    npm run build
    ```

5.  **Publish the package**:
    Now you can publish the package to GitHub Packages:
    ```bash
    npm publish
    ```

### Troubleshooting

If you encounter issues during publishing:

- **Verify PAT Permissions**: Ensure your PAT has the `write:packages` scope.
- **Check `package.json`**:
  - Double-check that the package `name` is correctly scoped (e.g., `@USER/mcp`).
  - Confirm the `publishConfig` section is present and correct.
  - Verify the `repository.url` is accurate.
- **Correct Directory**: Make sure you are running `npm publish` from within the `mcp` directory (i.e., the directory containing the `package.json` you want to publish).
- **npm Version**: In some rare cases, older npm versions might have issues. Consider updating npm: `npm install -g npm@latest`.
- **Existing Package Version**: You cannot publish the same version of a package twice. Increment the `version` in `package.json` if you are republishing.
