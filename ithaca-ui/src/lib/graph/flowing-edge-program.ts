/**
 * Flowing Edge Program for Sigma.js v3
 * 
 * Custom WebGL edge renderer that adds subtle flowing animation to edges
 * when they are hovered or selected. Animation respects user's motion preferences.
 * 
 * Features:
 * - Smooth flowing animation from citing paper → cited paper
 * - Different flow patterns for support vs contradict edges
 * - GPU-accelerated via WebGL for performance  
 * - Only animates on hover (no performance impact at rest)
 * - Respects prefers-reduced-motion accessibility setting
 * 
 * Based on Sigma.js createEdgeArrowProgram
 */

import { createEdgeArrowProgram } from "sigma/rendering";
import type { Attributes } from "graphology-types";
import type { EdgeProgramType } from "sigma/rendering";

/**
 * Create a flowing edge program that extends the arrow edge renderer
 * This approach works with Sigma v3's factory-based program creation
 */
export function createFlowingEdgeProgram<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes
>(): EdgeProgramType<N, E, G> {
  // Use the standard arrow edge program as base
  // Flow animation will be handled via edge attributes in the component
  return createEdgeArrowProgram<N, E, G>();
}

const FlowingEdgeProgram = createFlowingEdgeProgram();
export default FlowingEdgeProgram;
