export interface Icon {
  catalogTechnologyId: string;
  name: string;
  url: string;
  urlDark: string[];
  urlLight: string[];
}

export interface ModelObject {
  caption: string;
  commit: number;
  description: string;
  external: boolean;
  groupIds: string[];
  icon: Icon;
  labels: Record<string, any>;
  links: Record<string, any>;
  name: string;
  parentId: string;
  status: 'deprecated';
  tagIds: string[];
  teamIds: string[];
  teamOnlyEditing: boolean;
  technologyIds: string[];
  type: 'actor';
  domainId: string;
  handleId: string;
  childDiagramIds: string[];
  childIds: string[];
  createdAt: string;
  createdBy: string;
  createdById: string;
  deletedAt: string;
  deletedBy: string;
  deletedById: string;
  diagrams: Record<string, any>;
  flows: Record<string, any>;
  id: string;
  landscapeId: string;
  parentIds: string[];
  technologies: Record<string, any>;
  updatedAt: string;
  updatedBy: string;
  updatedById: string;
  version: number;
  versionId: string;
}

export interface CatalogTechnology {
  category: string;
  color: string;
  deprecatedAt: string;
  description: string;
  docsUrl: string;
  iconUrlDark: string[];
  iconUrlLight: string[];
  name: string;
  nameShort: string;
  provider: string;
  rejectionMessage: string;
  rejectionReason: string;
  restrictions: string[];
  status: string;
  type: string;
  updatesUrl: string;
  websiteUrl: string;
  awsXmlSelector: string;
  azureUpdatesKeyword: string;
  createdAt: string;
  createdBy: string;
  createdById: string;
  defaultSlug: string;
  deletedAt: string;
  deletedBy: string;
  deletedById: string;
  disabled: boolean;
  iconUrl: string;
  id: string;
  organizationId: string;
  slugs: string[];
  updatedAt: string;
  updatedBy: string;
  updatedById: string;
  updatesXmlUrl: string;
}

export interface ModelObjectsResponse {
  modelObjects: ModelObject[];
}

export interface ModelObjectResponse {
  modelObject: ModelObject;
}

export interface CatalogTechnologyResponse {
  catalogTechnologies: CatalogTechnology[];
}

export interface Team {
  color: string;
  name: string;
  userIds: string[];
  createdAt: string;
  createdBy: string;
  createdById: string;
  id: string;
  modelObjectHandleIds: string[];
  organizationId: string;
  updatedAt: string;
  updatedBy: string;
  updatedById: string;
}

export interface TeamsResponse {
  teams: Team[];
}

export interface ModelConnectionDirection {
  direction: 'outgoing' | 'bidirectional' | null;
}

export interface ModelConnectionDiagram {
  connectionId: string;
  id: string;
  originModelId: string;
  targetModelId: string;
}

export interface ModelConnectionFlow {
  id: string;
  stepId: string;
}

export interface ModelConnection {
  commit: number;
  description?: string;
  direction: 'outgoing' | 'bidirectional' | null;
  labels: Record<string, string>;
  name: string;
  originId: string;
  status: 'deprecated' | 'future' | 'live' | 'removed';
  tagIds: string[];
  targetId: string;
  technologyIds: string[];
  handleId: string;
  createdAt: string;
  createdBy: 'user' | 'api-key' | 'notification-key' | 'service';
  createdById: string;
  deletedAt?: string;
  deletedBy?: 'user' | 'api-key' | 'notification-key' | 'service';
  deletedById?: string;
  diagrams: Record<string, ModelConnectionDiagram>;
  flows: Record<string, ModelConnectionFlow>;
  id: string;
  landscapeId: string;
  updatedAt: string;
  updatedBy: 'user' | 'api-key' | 'notification-key' | 'service';
  updatedById: string;
  version: number;
  versionId: string;
}

export interface ModelConnectionsResponse {
  modelConnections: ModelConnection[];
}

export interface LandscapeResponse {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  visibility: 'private' | 'public';
  // Add other fields as needed
}

export interface DomainResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  // Add other fields as needed
}

export interface ConnectionResponse {
  id: string;
  name: string;
  originId: string;
  targetId: string;
  direction: 'outgoing' | 'bidirectional';
  description?: string;
  status?: 'deprecated' | 'future' | 'live' | 'removed';
  // Add other fields as needed
}

export interface Diagram {
  id: string;
  name: string;
  description?: string;
  viewType: 'landscape' | 'context' | 'container' | 'component';
  rootObjectId?: string;
  objectIds: string[]; // Changed from optional to required to ensure it's always present
  createdAt: string;
  updatedAt: string;
  versionId: string;
}

export interface DiagramResponse {
  diagram: Diagram;
}

export interface DiagramsResponse {
  diagrams: Diagram[];
}
