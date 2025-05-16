/**
 * IcePanel API client
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import type { ModelObjectsResponse, ModelObjectResponse, CatalogTechnologyResponse, TeamsResponse, ModelConnectionsResponse, LandscapeResponse, ConnectionResponse, DomainResponse, DiagramResponse, DiagramsResponse } from "./types.js";

// Base URL for the IcePanel API
// Use environment variable if set, otherwise default to production URL
const API_BASE_URL = process.env.ICEPANEL_API_BASE_URL || "https://api.icepanel.io/v1";

// Get the API key from environment variables
const API_KEY = process.env.API_KEY;

// Note: We don't check for API_KEY here as main.ts handles this

/**
 * Make an authenticated request to the IcePanel API
 */
async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `ApiKey ${API_KEY}`,
    ...options.headers,
  };
  // Log the request for debugging
  if (options.method === 'POST' || options.method === 'PATCH') {
    console.error(`Making ${options.method} request to ${url}`);
    console.error(`Request body: ${options.body}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    throw new Error(`IcePanel API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get all landscapes
 */
export async function getLandscapes(organizationId: string) {
  return apiRequest(`/organizations/${organizationId}/landscapes`);
}

/**
 * Get a specific landscape
 */
export async function getLandscape(organizationId: string, landscapeId: string) {
  return apiRequest(`/organizations/${organizationId}/landscapes/${landscapeId}`);
}

/**
 * Create a new landscape
 * 
 * @param organizationId - The ID of the organization
 * @param data - Landscape creation data
 * @returns Promise with the created landscape
 */
export async function createLandscape(organizationId: string, data: {
  name: string;
  description?: string;
  icon?: string;
  visibility?: 'private' | 'public';
}): Promise<LandscapeResponse> {
  return apiRequest(`/organizations/${organizationId}/landscapes`, {
    method: 'POST',
    body: JSON.stringify(data)
  }) as Promise<LandscapeResponse>;
}

/**
 * Update a landscape
 * 
 * @param organizationId - The ID of the organization
 * @param landscapeId - The ID of the landscape to update
 * @param data - Landscape update data
 * @returns Promise with the updated landscape
 */
export async function updateLandscape(
  organizationId: string, 
  landscapeId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    visibility?: 'private' | 'public';
  }
) {
  return apiRequest(`/organizations/${organizationId}/landscapes/${landscapeId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * Delete a landscape
 * 
 * @param organizationId - The ID of the organization
 * @param landscapeId - The ID of the landscape to delete
 * @returns Promise with the deletion result
 */
export async function deleteLandscape(organizationId: string, landscapeId: string) {
  return apiRequest(`/organizations/${organizationId}/landscapes/${landscapeId}`, {
    method: 'DELETE'
  });
}

/**
 * Get a specific version
 */
export async function getVersion(landscapeId: string, versionId: string = "latest") {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}`);
}

/**
 * Create a new version of a landscape
 * 
 * @param landscapeId - The ID of the landscape
 * @param data - Version creation data
 * @returns Promise with the created version
 */
export async function createVersion(
  landscapeId: string,
  data: {
    name: string;
    description?: string;
    baseVersionId?: string;
  }
) {
  return apiRequest(`/landscapes/${landscapeId}/versions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get catalog technologies
 *
 * Retrieves a list of technologies from the IcePanel catalog
 *
 * @param options - Filter options for the catalog technologies
 * @param options.filter.provider - Filter by provider (aws, azure, gcp, etc.)
 * @param options.filter.type - Filter by technology type (data-storage, deployment, etc.)
 * @param options.filter.restrictions - Filter by restrictions (actor, app, component, etc.)
 * @param options.filter.status - Filter by status (approved, pending-review, rejected)
 * @returns Promise with catalog technologies response
 */
export async function getCatalogTechnologies(
  options: {
    filter?: {
      provider?: string | string[] | null,
      type?: string | string[] | null,
      restrictions?: string | string[],
      status?: string | string[]
    }
  } = {}
) {
  const params = new URLSearchParams();

  if (options.filter) {
    const filter = options.filter;

    // Convert filter object to query parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => {
            params.append(`filter[${key}][]`, item);
          });
        } else if (value === null) {
          // Handle null values
          params.append(`filter[${key}]`, 'null');
        } else {
          // Handle simple values
          params.append(`filter[${key}]`, String(value));
        }
      }
    });
  }

  const queryString = params.toString();
  const url = `/catalog/technologies${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url) as Promise<CatalogTechnologyResponse>;
}

/**
 * Get organization technologies
 *
 * Retrieves a list of technologies from an organization
 *
 * @param organizationId - The ID of the organization
 * @param options - Filter options for the organization technologies
 * @param options.filter.provider - Filter by provider (aws, azure, gcp, etc.)
 * @param options.filter.type - Filter by technology type (data-storage, deployment, etc.)
 * @param options.filter.restrictions - Filter by restrictions (actor, app, component, etc.)
 * @param options.filter.status - Filter by status (approved, pending-review, rejected)
 * @returns Promise with catalog technologies response
 */
export async function getOrganizationTechnologies(
  organizationId: string,
  options: {
    filter?: {
      provider?: string | string[] | null,
      type?: string | string[] | null,
      restrictions?: string | string[],
      status?: string | string[]
    }
  } = {}
) {
  const params = new URLSearchParams();

  if (options.filter) {
    const filter = options.filter;

    // Convert filter object to query parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => {
            params.append(`filter[${key}][]`, item);
          });
        } else if (value === null) {
          // Handle null values
          params.append(`filter[${key}]`, 'null');
        } else {
          // Handle simple values
          params.append(`filter[${key}]`, String(value));
        }
      }
    });
  }

  const queryString = params.toString();
  const url = `/organizations/${organizationId}/technologies${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url) as Promise<CatalogTechnologyResponse>;
}

/**
 * Create a new technology in an organization
 * 
 * @param organizationId - The ID of the organization
 * @param data - Technology creation data
 * @returns Promise with the created technology
 */
export async function createOrganizationTechnology(
  organizationId: string,
  data: {
    name: string;
    type?: string;
    provider?: string;
    icon?: string;
    description?: string;
    restrictions?: string[];
    status?: 'approved' | 'pending-review' | 'rejected';
  }
) {
  return apiRequest(`/organizations/${organizationId}/technologies`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get teams for an organization
 *
 * Retrieves a list of teams from an organization
 *
 * @param organizationId - The ID of the organization
 * @returns Promise with teams response
 */
export async function getTeams(organizationId: string) {
  return apiRequest(`/organizations/${organizationId}/teams`) as Promise<TeamsResponse>;
}

/**
 * Get all model objects for a landscape version
 */
export async function getModelObjects(
  landscapeId: string,
  versionId: string = "latest",
  options: { filter?: {
    domainId?: string | string[],
    external?: boolean,
    handleId?: string | string[],
    labels?: Record<string, string>,
    name?: string,
    parentId?: string | null,
    status?: string | string[],
    type?: string | string[]
  }} = {}
): Promise<ModelObjectsResponse> {
  const params = new URLSearchParams();

  if (options.filter) {
    const filter = options.filter;

    // Convert filter object to query parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'labels' && typeof value === 'object') {
          // Handle labels object
          Object.entries(value as Record<string, string>).forEach(([labelKey, labelValue]) => {
            params.append(`filter[labels][${labelKey}]`, labelValue);
          });
        } else if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => {
            params.append(`filter[${key}][]`, item);
          });
        } else if (value === null) {
          // Handle null values
          params.append(`filter[${key}]`, 'null');
        } else {
          // Handle simple values
          params.append(`filter[${key}]`, String(value));
        }
      }
    });
  }

  const queryString = params.toString();
  const url = `/landscapes/${landscapeId}/versions/${versionId}/model/objects${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url) as Promise<ModelObjectsResponse>;
}

/**
 * Get a specific model object
 */
export async function getModelObject(landscapeId: string, modelObjectId: string, versionId: string = "latest") {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/objects/${modelObjectId}`) as Promise<ModelObjectResponse>;
}

/**
 * Create a new model object in a landscape
 */
export async function createModelObject(
  landscapeId: string,
  data: {
    name: string;
    type: string;
    handleId?: string;
    description?: string;
    domainId?: string;
    external?: boolean;
    labels?: Record<string, string>;
    parentId?: string;
    status?: 'deprecated' | 'future' | 'live' | 'removed';
    technologyId?: string;
    teamId?: string;
  },
  versionId: string = "latest"
) {  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/objects`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update a model object
 * 
 * @param landscapeId - The ID of the landscape
 * @param objectId - The ID of the object to update
 * @param data - Object update data
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the updated model object
 */
export async function updateModelObject(
  landscapeId: string,
  objectId: string,
  data: {
    name?: string;
    type?: string;
    handleId?: string;
    description?: string;
    domainId?: string;
    external?: boolean;
    labels?: Record<string, string>;
    parentId?: string;
    status?: 'deprecated' | 'future' | 'live' | 'removed';
    technologyId?: string;
    teamId?: string;
  },
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/objects/${objectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }) as Promise<ModelObjectResponse>;
}

/**
 * Delete a model object
 * 
 * @param landscapeId - The ID of the landscape
 * @param objectId - The ID of the object to delete
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the deletion result
 */
export async function deleteModelObject(
  landscapeId: string,
  objectId: string,
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/objects/${objectId}`, {
    method: 'DELETE'
  });
}

/**
 * Get all model connections
 *
 * Retrieves a list of connections between model objects
 *
 * @param landscapeId - The ID of the landscape
 * @param versionId - The ID of the version (defaults to "latest")
 * @param options - Filter options for the model connections
 * @param options.filter.direction - Filter by connection direction (outgoing, bidirectional)
 * @param options.filter.handleId - Filter by handle ID
 * @param options.filter.labels - Filter by labels
 * @param options.filter.name - Filter by name
 * @param options.filter.originId - Filter by origin ID
 * @param options.filter.status - Filter by status (deprecated, future, live, removed)
 * @param options.filter.targetId - Filter by target ID
 * @returns Promise with model connections response
 */
export async function getModelConnections(
  landscapeId: string,
  versionId: string = "latest",
  options: {
    filter?: {
      direction?: 'outgoing' | 'bidirectional' | null,
      handleId?: string | string[],
      labels?: Record<string, string>,
      name?: string,
      originId?: string | string[],
      status?: ('deprecated' | 'future' | 'live' | 'removed') | ('deprecated' | 'future' | 'live' | 'removed')[],
      targetId?: string | string[]
    }
  } = {}
): Promise<ModelConnectionsResponse> {
  const params = new URLSearchParams();

  if (options.filter) {
    const filter = options.filter;

    // Convert filter object to query parameters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'labels' && typeof value === 'object') {
          // Handle labels object
          Object.entries(value as Record<string, string>).forEach(([labelKey, labelValue]) => {
            params.append(`filter[labels][${labelKey}]`, labelValue);
          });
        } else if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => {
            params.append(`filter[${key}][]`, item);
          });
        } else if (value === null) {
          // Handle null values
          params.append(`filter[${key}]`, 'null');
        } else {
          // Handle simple values
          params.append(`filter[${key}]`, String(value));
        }
      }
    });
  }

  const queryString = params.toString();
  const url = `/landscapes/${landscapeId}/versions/${versionId}/model/connections${queryString ? `?${queryString}` : ''}`;

  return apiRequest(url) as Promise<ModelConnectionsResponse>;
}

/**
 * Get a specific connection
 */
export async function getConnection(landscapeId: string, versionId: string, connectionId: string) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/connections/${connectionId}`);
}

/**
 * Create a new connection between objects
 */
export async function createModelConnection(
  landscapeId: string,
  data: {
    name: string;
    originId: string;
    targetId: string;
    direction?: 'outgoing' | 'bidirectional';
    description?: string;
    handleId?: string;
    labels?: Record<string, string>;
    status?: 'deprecated' | 'future' | 'live' | 'removed';
  },
  versionId: string = "latest"
): Promise<ConnectionResponse> {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/connections`, {
    method: 'POST',
    body: JSON.stringify(data)
  }) as Promise<ConnectionResponse>;
}

/**
 * Update a model connection
 * 
 * @param landscapeId - The ID of the landscape
 * @param connectionId - The ID of the connection to update
 * @param data - Connection update data
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the updated connection
 */
export async function updateModelConnection(
  landscapeId: string,
  connectionId: string,
  data: {
    name?: string;
    direction?: 'outgoing' | 'bidirectional';
    description?: string;
    handleId?: string;
    labels?: Record<string, string>;
    status?: 'deprecated' | 'future' | 'live' | 'removed';
  },
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * Delete a model connection
 * 
 * @param landscapeId - The ID of the landscape
 * @param connectionId - The ID of the connection to delete
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the deletion result
 */
export async function deleteModelConnection(
  landscapeId: string,
  connectionId: string,
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/model/connections/${connectionId}`, {
    method: 'DELETE'
  });
}

/**
 * Create a new domain
 */
export async function createDomain(
  landscapeId: string,
  data: {
    name: string;
    description?: string;
    color?: string;
  },
  versionId: string = "latest"
): Promise<DomainResponse> {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/domains`, {
    method: 'POST',
    body: JSON.stringify(data)
  }) as Promise<DomainResponse>;
}

/**
 * Update a domain
 * 
 * @param landscapeId - The ID of the landscape
 * @param domainId - The ID of the domain to update
 * @param data - Domain update data
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the updated domain
 */
export async function updateDomain(
  landscapeId: string,
  domainId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
  },
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/domains/${domainId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/**
 * Get all diagrams in a landscape
 * 
 * @param landscapeId - The ID of the landscape
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the diagrams
 */
export async function getDiagrams(
  landscapeId: string,
  versionId: string = "latest"
): Promise<DiagramsResponse> {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/diagrams`) as Promise<DiagramsResponse>;
}

/**
 * Get a specific diagram
 * 
 * @param landscapeId - The ID of the landscape
 * @param diagramId - The ID of the diagram
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the diagram
 */
export async function getDiagram(
  landscapeId: string,
  diagramId: string,
  versionId: string = "latest"
): Promise<DiagramResponse> {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/diagrams/${diagramId}`) as Promise<DiagramResponse>;
}

/**
 * Create a new diagram in a landscape
 * 
 * @param landscapeId - The ID of the landscape
 * @param data - Diagram creation data
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the created diagram
 */
export async function createDiagram(
  landscapeId: string,
  data: {
    name: string;
    description?: string;
    viewType: 'landscape' | 'context' | 'container' | 'component';
    rootObjectId?: string;
    objectIds?: string[];
  },
  versionId: string = "latest"
): Promise<DiagramResponse> {
  // Log the request data for debugging
  console.error('Creating diagram with data:', JSON.stringify(data, null, 2));
  
  // Create a new object to ensure we don't modify the input data
  const requestData = { ...data };
  
  // Ensure objectIds is always an array, even if empty
  if (!requestData.objectIds) {
    requestData.objectIds = [];
  } else if (!Array.isArray(requestData.objectIds)) {
    console.error('objectIds is not an array, converting to array');
    requestData.objectIds = [requestData.objectIds as unknown as string];
  }
  
  // Log the final request data
  console.error('Final request data for diagram creation:', JSON.stringify(requestData, null, 2));
  
  const response = await apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/diagrams`, {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
  
  // Log the response for debugging
  console.error('Diagram creation response:', JSON.stringify(response, null, 2));
  
  // Cast the response to DiagramResponse
  const typedResponse = response as DiagramResponse;
  
  // If the response doesn't include objectIds, add it manually
  if (typedResponse.diagram && !typedResponse.diagram.objectIds) {
    console.error('Response diagram does not have objectIds, adding empty array');
    typedResponse.diagram.objectIds = [];
  }
  
  return typedResponse;
}

/**
 * Update a diagram
 * 
 * @param landscapeId - The ID of the landscape
 * @param diagramId - The ID of the diagram to update
 * @param data - Diagram update data
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the updated diagram
 */
export async function updateDiagram(
  landscapeId: string,
  diagramId: string,
  data: {
    name?: string;
    description?: string;
    viewType?: 'landscape' | 'context' | 'container' | 'component';
    rootObjectId?: string;
    objectIds?: string[];
  },
  versionId: string = "latest"
): Promise<DiagramResponse> {
  // Log the update data for debugging
  console.error('Updating diagram with data:', JSON.stringify(data, null, 2));
  
  // Create a new object to ensure we don't modify the input data
  const requestData = { ...data };
  
  // If objectIds is provided, ensure it's an array
  if (requestData.objectIds !== undefined) {
    if (!Array.isArray(requestData.objectIds)) {
      console.error('objectIds is not an array, converting to array');
      requestData.objectIds = [requestData.objectIds as unknown as string];
    }
    
    // Ensure we're not sending an empty array if objectIds is provided
    if (requestData.objectIds.length === 0) {
      console.error('Warning: Attempting to update diagram with empty objectIds array');
    }
  }
  
  // Log the final request data
  console.error('Final request data for diagram update:', JSON.stringify(requestData, null, 2));
  
  const response = await apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/diagrams/${diagramId}`, {
    method: 'PATCH',
    body: JSON.stringify(requestData)
  });
  
  // Log the response for debugging
  console.error('Diagram update response:', JSON.stringify(response, null, 2));
  
  // Cast the response to DiagramResponse
  const typedResponse = response as DiagramResponse;
  
  // If the response doesn't include objectIds, add it manually
  if (typedResponse.diagram && !typedResponse.diagram.objectIds) {
    console.error('Response diagram does not have objectIds, adding empty array');
    typedResponse.diagram.objectIds = [];
  }
  
  return typedResponse;
}

/**
 * Delete a diagram
 * 
 * @param landscapeId - The ID of the landscape
 * @param diagramId - The ID of the diagram to delete
 * @param versionId - The ID of the version (defaults to "latest")
 * @returns Promise with the deletion result
 */
export async function deleteDiagram(
  landscapeId: string,
  diagramId: string,
  versionId: string = "latest"
) {
  return apiRequest(`/landscapes/${landscapeId}/versions/${versionId}/diagrams/${diagramId}`, {
    method: 'DELETE'
  });
}
