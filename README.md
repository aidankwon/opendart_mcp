# Open DART MCP Server

An MCP server for interacting with the Financial Supervisory Service's Open DART API.

## Features

- Search for corporate filings (DS001)
- Retrieve company overview (DS002)
- Get financial statements (DS003)
- Caching of API responses using SQLite to minimize API usage.

## Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set your API key in `.env`:
   ```
   OPENDART_API_KEY=your_api_key_here
   ```
4. Build: `npm run build`
5. Run: `npm start`

## Development

- Run tests: `npm test`
