# IcePanel MCP Server

## ⚠️ Beta Notice

IcePanel MCP Server is currently in beta. We appreciate your feedback and patience as we continue to improve the MCP Server.

Please use MCP Servers with caution; only install tools you trust. (We promise this one doesn't mine cryptocurrency... probably.)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- One of the supported MCP Clients:
  - Claude Desktop
  - Cursor
  - Windsurf
- A burning desire to visualize architecture (diagrams optional, hand-waving mandatory)

### Installation

1. **Get your organization's ID**
   - Visit [IcePanel](https://app.icepanel.io/)
   - Head to your Organization's Settings:
     - Click on your landscape in the top left to open the dropdown
     - Beside your org name, click the gear icon
   - Keep your "Organization Identifier" handy! (Guard it like your Netflix password)

2. **Generate API Key**
   - Visit [IcePanel](https://app.icepanel.io/)
   - Head to your Organization's Settings:
     - Click on your landscape in the top left to open the dropdown
     - Beside your org name, click the gear icon
     - Click on the 🔑 API keys link in the sidebar
   - Generate a new API key
     - Read permissions recommended (unless you enjoy living dangerously)

3. **Install**

#### Environment Variables

- `API_KEY`: Your IcePanel API key (required)
- `ORGANIZATION_ID`: Your IcePanel organization ID (required)
- `ICEPANEL_API_BASE_URL`: (Optional) Override the API base URL for different environments
- `COFFEE_STRENGTH`: (Not implemented yet, but we're considering it)

#### Configure your MCP Client

Add this to your MCP Clients' MCP config file:

```json
{
  "mcpServers": {
    "@icepanel/icepanel": {
      "command": "npx",
      "args": ["-y", "@icepanel/mcp-server@latest", "API_KEY=\"your-api-key\"", "ORGANIZATION_ID=\"your-org-id\""]
    }
  }
}
```

## 📈 The Great Leap Forward: From "Meh" to "Wow!"

### Original Functionality (v0.1.0) - AKA "The Dark Ages"

The initial version of IcePanel MCP Server was like a tricycle with training wheels:

- **Basic Landscape Access**: You could look at landscapes. That's it. Just look at them. Exciting, right?
- **Limited Model Object Retrieval**: "Here's some objects. No, you can't filter them. No, you can't search. Take it or leave it."
- **Read-Only Operations**: Like a museum where you can look but not touch. "Please stay behind the velvet rope."
- **Limited Integration**: About as integrated as that one relative at family gatherings who only talks about their stamp collection.

### New Functionality (Current Version) - AKA "We Have Superpowers Now"

We've transformed from a caterpillar into a butterfly with rocket boosters:

| Feature Area | Original Functionality | New Functionality |
|--------------|------------------------|-------------------|
| **Landscape Management** | "Here's your landscapes. Aren't they pretty?" | "Create! Update! Delete! Verify! It's like SimCity but for architecture!" |
| **Model Objects** | "Here are some objects. No, we won't help you find anything specific." | "Filter by type! Filter by status! Filter by technology! Filter by team! Search with fuzzy logic that's almost as smart as you are!" |
| **Relationships** | "Relationships? What relationships?" | "We'll tell you who's talking to whom, who's dependent on what, and who's ghosting who. It's like Facebook for your architecture." |
| **Creation Capabilities** | "Creation? That's above our pay grade." | "Create systems! Create apps! Create components! Create connections! Create domains! It's like LEGO but without the pain of stepping on pieces!" |
| **Diagram Management** | "Diagrams are just a state of mind." | "Create diagrams! Update diagrams! Delete diagrams! Add objects to diagrams! It's like PowerPoint but actually useful!" |
| **Technology & Team Info** | "Technologies? Teams? Never heard of them." | "Browse technologies like you're shopping online! View team info like you're stalking them on LinkedIn!" |
| **C4 Model Support** | "C4? Isn't that an explosive?" | "Full support for C1, C2, and C3 levels! Navigate between levels like you're in an architectural elevator!" |
| **Search Capabilities** | "Search is overrated. Just scroll more." | "Fuzzy search that understands you even when you typo! It's like having a search engine that actually gets you." |

## 📋 Features & Capabilities

IcePanel MCP Server provides a comprehensive set of tools for interacting with your IcePanel architecture diagrams and C4 models through the Model Context Protocol (MCP). It's like having an architectural assistant who never sleeps, never complains, and works for the price of an npm install.

### C4 Model Support

IcePanel is built around the [C4 model](https://c4model.com/), a framework for visualizing software architecture at different levels of abstraction:

- **C1 (Context)**: Systems and actors (the "big picture" for executives who don't have time for details)
- **C2 (Container)**: Applications and data stores (for managers who want to know a bit more)
- **C3 (Component)**: Components within applications (for developers who actually build the stuff)
- **C4 (Code)**: Implementation details (not directly supported in IcePanel because, let's face it, that's what GitHub is for)

### Available Tools

#### Landscape Management
- `getLandscapes`: Retrieve all landscapes in your organization (like getting a list of all your properties in Monopoly)
- `getLandscape`: Get details of a specific landscape (zoom in on Boardwalk)
- `createLandscape`: Create a new landscape (buy a new property)
- `verifyLandscape`: Verify a landscape exists before creating objects (make sure you're not building hotels in the wrong neighborhood)

#### Model Object Management
- `getModelObjects`: Query and filter model objects (systems, apps, components, etc.)
- `getModelObject`: Get detailed information about a specific model object
- `getModelObjectRelationships`: View relationships between model objects (who's friends with whom)
- `createModelObject`: Create new model objects (systems, apps, components, etc.)
- `createTestSystem`: Quickly create a test system for verification (the "Hello World" of architecture)

#### Connection Management
- `getModelConnections`: Query connections between model objects
- `createModelConnection`: Create new connections between model objects (architectural matchmaking)

#### Domain Management
- `createDomain`: Create new domains for organizing model objects (like creating folders, but fancier)

#### Diagram Management
- `getDiagrams`: List all diagrams in a landscape
- `getDiagram`: Get details of a specific diagram
- `createDiagram`: Create a new diagram (for when words just aren't enough)
- `createDiagramWithObjects`: Create a diagram with specific objects (pre-populated for your convenience)
- `updateDiagram`: Update an existing diagram
- `deleteDiagram`: Delete a diagram (for when your artistic vision wasn't quite right)
- `addObjectsToDiagram`: Add objects to an existing diagram (because more is always better)

#### Technology & Team Information
- `getTechnologyCatalog`: Browse available technologies (window shopping for tech)
- `getTeams`: View teams in your organization (find out who to blame... er, collaborate with)

### Advanced Features

- **Powerful Filtering**: Filter model objects by type, status, technology, team, and more (like having X-ray vision for your architecture)
- **Fuzzy Search**: Search for objects, technologies, and teams by name (even works when you're typing with your elbows)
- **Relationship Analysis**: Analyze connections between components (architectural couples therapy)
- **C4 Model Navigation**: Navigate between different levels of the C4 model (like an architectural elevator operator)

## 🔍 Usage Examples

### Creating a System and Components

```typescript
// Create a new system (much easier than creating a real system)
const systemResult = await client.useTool("@icepanel/icepanel", "createModelObject", {
  landscapeId: "your-landscape-id",
  name: "Payment Processing System",
  type: "system",
  description: "Handles all payment processing operations"
});

// Create an app within the system (no App Store approval required)
const appResult = await client.useTool("@icepanel/icepanel", "createModelObject", {
  landscapeId: "your-landscape-id",
  name: "Payment Gateway",
  type: "app",
  parentId: systemResult.id,
  description: "Interfaces with payment providers"
});
```

### Creating a Diagram

```typescript
// Create a container diagram for the system (no artistic talent required)
const diagramResult = await client.useTool("@icepanel/icepanel", "createDiagram", {
  landscapeId: "your-landscape-id",
  name: "Payment System - Container View",
  viewType: "container",
  rootObjectId: systemResult.id,
  description: "Shows the containers within the Payment Processing System"
});
```

### Querying Model Objects

```typescript
// Find all live applications using a specific technology (like architectural detective work)
const appsResult = await client.useTool("@icepanel/icepanel", "getModelObjects", {
  landscapeId: "your-landscape-id",
  type: "app",
  status: "live",
  technologyId: "tech-id-for-nodejs"
});
```

## ✉️ Support

- For any issues with the IcePanel MCP Server, please contact the IcePanel team at [Support](mailto:support@icepanel.io).
- Note: This README was created by a contributor to the project, not by IcePanel's support team. Please direct all support inquiries to IcePanel directly.

## 📝 License

MIT License (because we're cool like that)

## 🙏 Acknowledgments

- Thanks to our beta testers and community members
- Thanks to caffeine, the true hero behind all software development
- Thanks to you for reading this far (seriously, we're impressed)
