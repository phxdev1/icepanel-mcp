import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as icepanel from "./icepanel.js";
import { formatCatalogTechnology, formatConnections, formatModelObjectItem, formatModelObjectListItem, formatTeam } from "./format.js";
import Fuse from 'fuse.js';

// Get API key and organization ID from environment variables
const API_KEY = process.env.API_KEY;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set");
  process.exit(1);
}

if (!ORGANIZATION_ID) {
  console.error("ORGANIZATION_ID environment variable is not set");
  process.exit(1);
}

// Create an MCP server
const server = new McpServer({
  name: "IcePanel MCP Server",
  version: "0.1.1",
});

// Get all landscapes
server.tool(
  "getLandscapes",
  "Get all your landscapes from IcePanel",
  {},
  async () => {
    try {
      const landscapes = await icepanel.getLandscapes(ORGANIZATION_ID!);
      return {
        content: [{ type: "text", text: JSON.stringify(landscapes, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
);

// Get a specific landscape
server.tool(
  "getLandscape",
  "Get a specific landscape from IcePanel",
  {
    landscapeId: z.string(),
  },
  async ({ landscapeId }) => {
    try {
      const landscape = await icepanel.getLandscape(ORGANIZATION_ID!, landscapeId);
      return {
        content: [{ type: "text", text: JSON.stringify(landscape, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
);

// Get model objects for a landscape version
server.tool(
  "getModelObjects",
`
Get all the model objects in an IcePanel landscape.
IcePanel is a C4 diagramming tool. C4 is a framework for visualizing the architecture of software systems.
To get the C1 level objects - query for 'system' type.
To get the C2 level objects - query for 'app' and 'store' component types.
To get the C3 level objects - query for the 'component' type.

The 'group' and 'actor' types can be used in any of the levels, and should generally by included in user queries.
- 'group' - is a type agnostic group which groups objects together
- 'actor' - is a actor in the system, typically a kind of user. Ex. 'our customer', 'admin user', etc.

Use this tool to filter / query against many model objects at once. It provides high level details such as; name, ID, type, status, and external.

Prefer filtering by Technology ID and Team ID when the query is asking things like:
- "What services does the Automations Team own?"
- "We need to upgrade our .NET applications - what is affected by this?"
`,
  {
    landscapeId: z.string().length(20),
    domainId: z.union([z.string().length(20), z.array(z.string().length(20))]).optional(),
    external: z.boolean().optional().default(false),
    name: z.string().optional(),
    parentId: z.string().nullable().optional(),
    status: z.union([
      z.enum(["deprecated", "future", "live", "removed"]),
      z.array(z.enum(["deprecated", "future", "live", "removed"]))
    ]).optional(),
    type: z.union([
      z.enum(["actor", "app", "component", "group", "root", "store", "system"]),
      z.array(z.enum(["actor", "app", "component", "group", "root", "store", "system"]))
    ]).optional(),
    technologyId: z.union([z.string().length(20), z.array(z.string().length(20))]).optional().describe("The technology UUID - useful to find all objects using a specific technology or technologies"),
    teamId: z.union([z.string().length(20), z.array(z.string().length(20))]).optional().describe("The team UUID - useful to find all objects owned by a specific team or teams"),
    search: z.string().optional().describe("Search by name")
  },
  async ({ landscapeId, ...filters }) => {
    try {
      const result = await icepanel.getModelObjects(landscapeId, "latest", { filter: filters });
      let modelObjects = result.modelObjects;
      if (filters.search) {
       const fuseInstance = new Fuse(modelObjects, {
         keys: ['name', 'description'],
         threshold: 0.3
       })
        modelObjects = fuseInstance.search(filters.search).map(result => result.item);
      }
      const content: any[] = modelObjects.map((o) => ({
        type: "text",
        text: formatModelObjectListItem(landscapeId, o)
      }))
      return {
        content,
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
);

server.tool(
  'getModelObject',
  `
  Get detailed information about a model object in IcePanel.
  IcePanel is a C4 diagramming tool. C4 is a framework for visualizing the architecture of software systems.
  Use this tool to get detailed information about a model object, such as it's description, type, hierarchical information (i.e. parent and children objects), any teams associated with it, as well as the technologies it uses.
  `,
  {
    landscapeId: z.string().length(20),
    modelObjectId: z.string().length(20),
    includeHierarchicalInfo: z.boolean().default(false).describe('Include hierarchical information like parent and child objects. (Only use this when necessary as it is an expensive operation.)')
  },
  async ({ landscapeId, modelObjectId, includeHierarchicalInfo }) => {
    try {
      const result = await icepanel.getModelObject(landscapeId, modelObjectId);
      const teamResult = await icepanel.getTeams(ORGANIZATION_ID!);
      const modelObject = result.modelObject
      let parentObject;
      let childObjects;

      if (includeHierarchicalInfo) {
        const listResult = await icepanel.getModelObjects(landscapeId)
        const modelObjectList = listResult.modelObjects;
        parentObject = (modelObject.parentId && modelObject.parentId !== 'root') ? modelObjectList.find(o => o.id === modelObject.parentId) : undefined;
        childObjects = modelObject.childIds.length > 0 ? modelObjectList.filter(o => modelObject.childIds.includes(o.id)): undefined;
      }
      const content: any = {
        type: 'text',
        text: formatModelObjectItem(landscapeId, result.modelObject, teamResult.teams, parentObject, childObjects),
      }
      return {
        content: [content],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
)

server.tool(
  'getModelObjectRelationships',
  `
  Get information about the relationships a model object has in IcePanel.
  IcePanel is a C4 diagramming tool. C4 is a framework for visualizing the architecture of software systems.

  Use this tool when you want to know about what objects are related to the current object. It provides a succinct list of related items.
  `,
  {
    landscapeId: z.string().length(20),
    modelObjectId: z.string().length(20),
  },
  async({ landscapeId, modelObjectId }) => {
    try {
      const modelObjectResult = await icepanel.getModelObject(landscapeId, modelObjectId)
      const modelObjectsResult = await icepanel.getModelObjects(landscapeId)
      const outgoingConnectionsResult = await icepanel.getModelConnections(landscapeId, "latest", {
        filter: {
          originId: modelObjectId
        }
      })
      const incomingConnectionsResult = await icepanel.getModelConnections(landscapeId, "latest", {
        filter: {
          targetId: modelObjectId,
        }
      })
      const formattedText = formatConnections(
        modelObjectResult.modelObject,
        incomingConnectionsResult.modelConnections,
        outgoingConnectionsResult.modelConnections,
        modelObjectsResult.modelObjects,
      )

      return {
        content: [{
          type: 'text',
          text: formattedText
        }]
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
)

server.tool(
  'getTechnologyCatalog',
  `
  Get the technology catalog in IcePanel.
  IcePanel is a C4 diagramming tool. C4 is a framework for visualizing the architecture of software systems.
  Use this tool to get the technology catalog, which is a list of all the technologies available in the system.
  `,
  {
    provider: z.union([z.enum(["aws", "azure", "gcp", "microsoft", "salesforce", "atlassian", "apache", "supabase"]), z.array(z.enum(["aws", "azure", "gcp", "microsoft", "salesforce", "atlassian", "apache", "supabase"]))]).nullable().optional(),
    type: z.union([z.enum(["data-storage", "deployment", "framework-library", "gateway", "other", "language", "message-broker", "network", "protocol", "runtime", "service-tool"]), z.array(z.enum(["data-storage", "deployment", "framework-library", "gateway", "other", "language", "message-broker", "network", "protocol", "runtime", "service-tool"]))]).nullable().optional(),
    restrictions: z.union([z.enum(["actor", "app", "component", "connection", "group", "store", "system"]), z.array(z.enum(["actor", "app", "component", "connection", "group", "store", "system"]))]).optional(),
    search: z.string().describe('Search by name and description')
  },
  async ({ provider, type, restrictions, search }) => {
    try {
      const result = await icepanel.getCatalogTechnologies({ filter: { provider, type, restrictions, status: "approved" } });
      const organizationResult = await icepanel.getOrganizationTechnologies(ORGANIZATION_ID!, { filter: { provider, type, restrictions } });
      let combinedTechnologies = result.catalogTechnologies.concat(organizationResult.catalogTechnologies);

      if (search) {
        const fuse = new Fuse(combinedTechnologies, {
          keys: ['name', 'description'],
          threshold: 0.3,
        });
        combinedTechnologies = fuse.search(search).map(result => result.item);
      }

      const content: any = combinedTechnologies.map(t => ({
        type: 'text',
        text: formatCatalogTechnology(t)
      }));
      return {
        content,
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
)

server.tool(
  'getTeams',
  `
  Get the teams in IcePanel.
  IcePanel is a C4 diagramming tool. C4 is a framework for visualizing the architecture of software systems.
  Use this tool to get the teams in IcePanel, teams are assigned as owners to different Model Objects within IcePanel.
  `,
  {
    search: z.string().optional().describe('Search by name')
  },
  async ({ search }) => {
    try {
      const teamResult = await icepanel.getTeams(ORGANIZATION_ID!)
      let teams = teamResult.teams
      if (search) {
        const fuse = new Fuse(teams, {
          keys: ['name'],
          threshold: 0.3,
        });
        teams = fuse.search(search).map(result => result.item);
      }

      const teamContent: any[] = teams.map(team => ({
        type: 'text',
        text: formatTeam(team)
      }))
      return {
        content: teamContent
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}`}]
      }
    }
  }

)

// Create a landscape
server.tool(
  "createLandscape",
  "Create a new landscape in IcePanel",
  {
    name: z.string().describe("Name of the landscape"),
    description: z.string().optional().describe("Description of the landscape"),
    icon: z.string().optional().describe("Icon for the landscape"),
    visibility: z.enum(["private", "public"]).default("private").describe("Visibility of the landscape")
  },
  async ({ name, description, icon, visibility }) => {
    try {
      const landscape = await icepanel.createLandscape(ORGANIZATION_ID!, {
        name,
        description,
        icon,
        visibility
      });
      
      // Use type assertion to fix the TypeScript error
      const landscapeId = (landscape as { id: string }).id;
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully created landscape: "${name}" (ID: ${landscapeId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating landscape: ${error.message}` }],
      };
    }
  }
);

// Create a model object (system, container, component)
server.tool(
  "createModelObject",
  "Create a new model object in an IcePanel landscape (system, container, component)",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    name: z.string().describe("Name of the model object"),
    type: z.enum(["actor", "app", "component", "group", "store", "system"]).describe("Type of the model object"),
    parentId: z.string().optional().describe("ID of the parent object (required for containers and components)"),
    description: z.string().optional().describe("Description of the model object"),
    domainId: z.string().optional().describe("ID of the domain"),
    external: z.boolean().optional().default(false).describe("Whether the object is external"),
    status: z.enum(["deprecated", "future", "live", "removed"]).optional().default("live").describe("Status of the model object"),
    technologyId: z.string().optional().describe("ID of the technology"),
    teamId: z.string().optional().describe("ID of the owning team")
  },
  async ({ landscapeId, name, type, parentId, description, domainId, external, status, technologyId, teamId }) => {
    try {
      const modelObject = await icepanel.createModelObject(
        landscapeId,
        {
          name,
          type,
          parentId,
          description,
          domainId,
          external,
          status,
          technologyId,
          teamId
        }
      );        // Log the full response for debugging
      console.error('ModelObject response:', JSON.stringify(modelObject, null, 2));
      
      // Use type assertion to safely access the ID
      const objectId = (modelObject as any).id || 'unknown';
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully created ${type} "${name}" (ID: ${objectId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating model object: ${error.message}` }],
      };
    }
  }
);

// Create a connection between objects
server.tool(
  "createModelConnection",
  "Create a new connection between model objects in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    name: z.string().describe("Name/description of the connection"),
    originId: z.string().describe("ID of the origin model object"),
    targetId: z.string().describe("ID of the target model object"),
    description: z.string().optional().describe("Detailed description of the connection"),
    direction: z.enum(["outgoing", "bidirectional"]).default("outgoing").describe("Direction of the connection"),
    status: z.enum(["deprecated", "future", "live", "removed"]).optional().default("live").describe("Status of the connection")
  },
  async ({ landscapeId, name, originId, targetId, description, direction, status }) => {
    try {
      const connection = await icepanel.createModelConnection(
        landscapeId,
        {
          name,
          originId,
          targetId,
          description,
          direction,
          status
        }
      );
      
      // Use type assertion to fix the TypeScript error
      const connectionId = (connection as { id: string }).id;
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully created connection "${name}" (ID: ${connectionId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating connection: ${error.message}` }],
      };
    }
  }
);

// Create a domain
server.tool(
  "createDomain",
  "Create a new domain in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    name: z.string().describe("Name of the domain"),
    description: z.string().optional().describe("Description of the domain"),
    color: z.string().optional().describe("Color of the domain (hex code)")
  },
  async ({ landscapeId, name, description, color }) => {
    try {
      const domain = await icepanel.createDomain(
        landscapeId,
        {
          name,
          description,
          color
        }
      );
      
      // Use type assertion to fix the TypeScript error
      const domainId = (domain as { id: string }).id;
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully created domain "${name}" (ID: ${domainId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating domain: ${error.message}` }],
      };
    }
  }
);

// Verify a landscape exists
server.tool(
  "verifyLandscape",
  "Verify that a landscape exists before creating objects",
  {
    landscapeId: z.string().describe("ID of the landscape to verify")
  },
  async ({ landscapeId }) => {
    try {      // Attempt to retrieve the landscape
      const landscape = await icepanel.getLandscape(ORGANIZATION_ID!, landscapeId);
      const name = (landscape as any).name || 'Unknown';
      
      return {
        content: [{ 
          type: "text", 
          text: `Landscape exists: "${name}" (ID: ${landscapeId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error verifying landscape: ${error.message}` }],
      };
    }
  }
);

// Create a simple test system
server.tool(
  "createTestSystem",
  "Create a basic system for testing",
  {
    landscapeId: z.string().describe("ID of the landscape")
  },
  async ({ landscapeId }) => {
    try {
      const modelObject = await icepanel.createModelObject(
        landscapeId,
        {
          name: "Test System",
          type: "system",
          description: "A test system to verify API functionality"
        }
      );
        // Log the full response for debugging
      console.error('Test System response:', JSON.stringify(modelObject, null, 2));
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully created test system. Response: ${JSON.stringify(modelObject, null, 2)}` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating test system: ${error.message}` }],
      };
    }
  }
);

// Get diagrams for a landscape
server.tool(
  "getDiagrams",
  "Get all diagrams for an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape")
  },
  async ({ landscapeId }) => {
    try {
      const result = await icepanel.getDiagrams(landscapeId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error getting diagrams: ${error.message}` }]
      };
    }
  }
);

// Get a specific diagram
server.tool(
  "getDiagram",
  "Get a specific diagram from an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    diagramId: z.string().describe("ID of the diagram")
  },
  async ({ landscapeId, diagramId }) => {
    try {
      const diagram = await icepanel.getDiagram(landscapeId, diagramId);
      return {
        content: [{ type: "text", text: JSON.stringify(diagram, null, 2) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error getting diagram: ${error.message}` }]
      };
    }
  }
);

// Create a new diagram
// Create a new diagram
server.tool(
  "createDiagram",
  "Create a new diagram in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    name: z.string().describe("Name of the diagram"),
    viewType: z.enum(["landscape", "context", "container", "component"]).describe("Type of diagram view"),
    description: z.string().optional().describe("Description of the diagram"),
    rootObjectId: z.string().optional().describe("ID of the root object (required for context, container, and component views)"),
    objectIds: z.array(z.string()).optional().describe("IDs of objects to include in the diagram")
  },
  async ({ landscapeId, name, viewType, description, rootObjectId, objectIds }) => {
    try {
      // Log the input parameters for debugging
      console.error('Creating diagram:', {
        landscapeId,
        name,
        viewType,
        description,
        rootObjectId,
        objectIds: objectIds ? JSON.stringify(objectIds) : 'undefined'
      });
      
      // Ensure objectIds is an array if provided
      const validatedObjectIds = objectIds && Array.isArray(objectIds) ? objectIds : [];
      
      const diagram = await icepanel.createDiagram(
        landscapeId,
        {
          name,
          viewType,
          description,
          rootObjectId,
          objectIds: validatedObjectIds
        }
      );
      
      // Log the response for debugging
      console.error('Diagram creation response:', JSON.stringify(diagram, null, 2));
      
      // Access the diagram ID safely
      const diagramId = diagram.diagram?.id;
      if (!diagramId) {
        throw new Error('Failed to get diagram ID from response');
      }
      
      // Verify the diagram was created with the objects
      const verifiedDiagram = await icepanel.getDiagram(landscapeId, diagramId);
      console.error('Verified diagram after creation:', JSON.stringify(verifiedDiagram, null, 2));
      
      const objectCount = validatedObjectIds.length;
      const objectsText = objectCount > 0 ? ` with ${objectCount} objects` : '';
      
      return {
        content: [{
          type: "text",
          text: `Successfully created diagram "${name}" (ID: ${diagramId})${objectsText}`
        }],
      };
    } catch (error: any) {
      console.error('Error creating diagram:', error);
      return {
        content: [{ type: "text", text: `Error creating diagram: ${error.message}` }],
      };
    }
  }
);
// Create a diagram with specified objects
// Create a diagram with specified objects
server.tool(
  "createDiagramWithObjects",
  "Create a new diagram with specific objects in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    name: z.string().describe("Name of the diagram"),
    viewType: z.enum(["landscape", "context", "container", "component"]).describe("Type of diagram view"),
    description: z.string().optional().describe("Description of the diagram"),
    rootObjectId: z.string().optional().describe("ID of the root object (required for context, container, and component views)"),
    objectIds: z.array(z.string()).describe("IDs of objects to include in the diagram")
  },
  async ({ landscapeId, name, viewType, description, rootObjectId, objectIds }) => {
    try {
      // Log the input parameters for debugging
      console.error('Creating diagram with objects:', {
        landscapeId,
        name,
        viewType,
        description,
        rootObjectId,
        objectIds: objectIds ? JSON.stringify(objectIds) : 'undefined'
      });
      
      // Validate objectIds
      if (!objectIds || !Array.isArray(objectIds) || objectIds.length === 0) {
        throw new Error('objectIds must be a non-empty array of strings');
      }
      
      // Create a new diagram with the specified objects
      const diagram = await icepanel.createDiagram(
        landscapeId,
        {
          name,
          viewType,
          description,
          rootObjectId,
          objectIds: objectIds // Ensure this is passed correctly
        }
      );
      
      // Log the response for debugging
      console.error('Diagram creation response:', JSON.stringify(diagram, null, 2));
      
      // Access the diagram ID safely
      const diagramId = diagram.diagram?.id;
      if (!diagramId) {
        throw new Error('Failed to get diagram ID from response');
      }
      
      return {
        content: [{
          type: "text",
          text: `Successfully created diagram "${name}" (ID: ${diagramId}) with ${objectIds.length} objects.`
        }],
      };
    } catch (error: any) {
      console.error('Error creating diagram with objects:', error);
      return {
        content: [{ type: "text", text: `Error creating diagram with objects: ${error.message}` }],
      };
    }
  }
);
// Update a diagram
server.tool(
  "updateDiagram",
  "Update an existing diagram in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    diagramId: z.string().describe("ID of the diagram to update"),
    name: z.string().optional().describe("Name of the diagram"),
    viewType: z.enum(["landscape", "context", "container", "component"]).optional().describe("Type of diagram view"),
    description: z.string().optional().describe("Description of the diagram"),
    rootObjectId: z.string().optional().describe("ID of the root object"),
    objectIds: z.array(z.string()).optional().describe("IDs of objects to include in the diagram")
  },
  async ({ landscapeId, diagramId, name, viewType, description, rootObjectId, objectIds }) => {
    try {
      const diagram = await icepanel.updateDiagram(
        landscapeId,
        diagramId,
        {
          name,
          viewType,
          description,
          rootObjectId,
          objectIds
        }
      );
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully updated diagram "${name}" (ID: ${diagramId})` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error updating diagram: ${error.message}` }],
      };
    }
  }
);

// Delete a diagram
server.tool(
  "deleteDiagram",
  "Delete a diagram from an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    diagramId: z.string().describe("ID of the diagram to delete")
  },
  async ({ landscapeId, diagramId }) => {
    try {
      await icepanel.deleteDiagram(landscapeId, diagramId);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully deleted diagram with ID: ${diagramId}` 
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error deleting diagram: ${error.message}` }],
      };
    }
  }
);

// Add objects to an existing diagram
// Add objects to an existing diagram
server.tool(
  "addObjectsToDiagram",
  "Add objects to an existing diagram in an IcePanel landscape",
  {
    landscapeId: z.string().describe("ID of the landscape"),
    diagramId: z.string().describe("ID of the diagram to update"),
    objectIds: z.array(z.string()).describe("IDs of objects to add to the diagram")
  },
  async ({ landscapeId, diagramId, objectIds }) => {
    try {
      // Log the input parameters for debugging
      console.error('Adding objects to diagram:', {
        landscapeId,
        diagramId,
        objectIds: objectIds ? JSON.stringify(objectIds) : 'undefined'
      });
      
      // Validate objectIds
      if (!objectIds || !Array.isArray(objectIds) || objectIds.length === 0) {
        throw new Error('objectIds must be a non-empty array of strings');
      }
      
      // First get the current diagram to preserve existing settings
      const currentDiagram = await icepanel.getDiagram(landscapeId, diagramId);
      console.error('Current diagram:', JSON.stringify(currentDiagram, null, 2));
      
      // Get current object IDs or initialize empty array
      const currentObjectIds = currentDiagram.diagram.objectIds || [];
      console.error('Current objectIds:', JSON.stringify(currentObjectIds, null, 2));
      
      // Combine existing and new object IDs without duplicates
      const updatedObjectIds = Array.from(new Set([...currentObjectIds, ...objectIds]));
      console.error('Updated objectIds:', JSON.stringify(updatedObjectIds, null, 2));
      
      // Update the diagram with the combined object IDs
      const updatedDiagram = await icepanel.updateDiagram(
        landscapeId,
        diagramId,
        {
          objectIds: updatedObjectIds
        }
      );
      
      // Verify the update was successful
      const verifiedDiagram = await icepanel.getDiagram(landscapeId, diagramId);
      console.error('Verified diagram after update:', JSON.stringify(verifiedDiagram, null, 2));
      
      return {
        content: [{
          type: "text",
          text: `Successfully added ${objectIds.length} objects to diagram "${updatedDiagram.diagram.name}" (ID: ${diagramId}).\nThe diagram now contains ${updatedObjectIds.length} objects.`
        }],
      };
    } catch (error: any) {
      console.error('Error adding objects to diagram:', error);
      return {
        content: [{ type: "text", text: `Error adding objects to diagram: ${error.message}` }],
      };
    }
  }
);
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
