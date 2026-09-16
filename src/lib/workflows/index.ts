/**
 * Workflow System
 * 
 * Entry point for all workflow-related services and types.
 */

// Types
export * from './types';

// Services - export selectively to avoid conflicts
export * from './workflow-generator';
export * from './workflow-validator';
export * from './workflow-execution-engine';

// Workflow definition service - export functions individually
export {
  getWorkflowDefinition,
  getWorkflowVersions,
  getActiveWorkflowVersion,
  listWorkflowDefinitions,
  getWorkflowSteps,
  getWorkflowTransitions,
  getCompleteWorkflow,
  createWorkflowDefinition,
  createWorkflowVersion,
  updateWorkflowDefinition,
  updateWorkflowStatus,
  markWorkflowReviewed,
  deleteWorkflowDefinition,
  type CreateWorkflowDefinitionInput,
  type CreateWorkflowStepInput,
  type UpdateWorkflowDefinitionInput,
} from './workflow-definition-service';

// Re-export commonly used types
export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStepTransition,
  WorkflowInstance,
  WorkflowInstanceStep,
  WorkflowDSL,
  ValidationResult,
  ExecutionResult,
  GraphValidationResult,
  PolicyValidationResult,
  ExecutionContext,
  StepExecutor,
} from './types';

export type { 
  WorkflowGenerationConfig,
  WorkflowGenerationInput,
  WorkflowGenerationResult,
} from './workflow-generator';

export type {
  ValidateWorkflowOptions,
  ComprehensiveValidationResult,
} from './workflow-validator';
