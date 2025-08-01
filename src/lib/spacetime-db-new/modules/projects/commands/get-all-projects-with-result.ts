/**
 * Project operations with Result<T> pattern
 * Replaces throwing errors with standardized Result handling
 */

import { Result, success, error, ErrorCodes, tryCatchAsync } from '@/lib/result';
import { logger } from '@/lib/logger';
import { getAllProjects, getAllProjectsWithItems, createProject } from './get-all-projects';
import type { GetAllProjectsOptions, CreateProjectRequest, SettlementProject } from './get-all-projects';

/**
 * Fetch all projects with Result<T> pattern
 */
export async function getProjectsWithResult(options: GetAllProjectsOptions = {}): Promise<Result<SettlementProject[]>> {
  return tryCatchAsync(async () => {
    logger.debug('Fetching projects with options', { options });
    
    const projects = options.includeItems 
      ? await getAllProjectsWithItems(options)
      : await getAllProjects(options);
    
    logger.debug(`Fetched ${projects.length} projects`, { count: projects.length });
    return projects;
  });
}

/**
 * Create project with Result<T> pattern
 */
export async function createProjectWithResult(projectData: CreateProjectRequest): Promise<Result<SettlementProject>> {
  return tryCatchAsync(async () => {
    logger.debug('Creating project', { projectName: projectData.name });
    
    const project = await createProject(projectData);
    
    logger.info('Project created successfully', { 
      projectId: project.id, 
      projectName: project.name 
    });
    
    return project;
  });
}

/**
 * Get project by ID with Result<T> pattern
 */
export async function getProjectByIdWithResult(projectId: string): Promise<Result<SettlementProject | null>> {
  return tryCatchAsync(async () => {
    logger.debug('Fetching project by ID', { projectId });
    
    const projects = await getAllProjects({ limit: 1 });
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      logger.warn('Project not found', { projectId });
      return null;
    }
    
    logger.debug('Project found', { projectId, projectName: project.name });
    return project;
  });
}