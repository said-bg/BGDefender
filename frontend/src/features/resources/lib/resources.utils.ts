import { Resource, ResourceSource, ResourceType } from '@/types/api';

export interface ResourcesSummary {
  adminShared: number;
  files: number;
  links: number;
  mine: number;
  total: number;
}

export const getResourcesSummary = (resources: Resource[]): ResourcesSummary => ({
  adminShared: resources.filter((resource) => resource.source === ResourceSource.ADMIN).length,
  files: resources.filter((resource) => resource.type === ResourceType.FILE).length,
  links: resources.filter((resource) => resource.type === ResourceType.LINK).length,
  mine: resources.filter((resource) => resource.source === ResourceSource.USER).length,
  total: resources.length,
});
