import { AgentOrchestrator } from '../../../lib/agentOrchestrator.js';

// Initialize the agent orchestrator
let orchestrator = null;

async function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator();
    await orchestrator.initialize();
  }
  return orchestrator;
}

export async function POST(request) {
  try {
    const { text, language, level, motherTongue = 'English' } = await request.json();

    console.log(`Processing text adaptation: ${language} ${level}, Mother tongue: ${motherTongue}`);
    
    // Get the orchestrator instance
    const orch = await getOrchestrator();
    
    // Process the text through the agentic workflow
    const workflowResult = await orch.processTextAdaptation({
      originalText: text,
      targetLanguage: language,
      proficiencyLevel: level,
      motherTongue: motherTongue
    });

    if (!workflowResult.success) {
      console.error('Workflow failed:', workflowResult.error);
      return Response.json({ 
        adaptedText: "Text adaptation service is currently unavailable. Please try again.",
        vocabulary: [],
        error: workflowResult.error
      }, { status: 500 });
    }

    // Return the result from the agentic workflow
    return Response.json({
      adaptedText: workflowResult.result.adaptedText,
      vocabulary: workflowResult.result.vocabulary,
      workflowId: workflowResult.workflowId,
      metrics: workflowResult.result.metrics
    });
  } catch (error) {
    console.error('Error in adapt API:', error);
    return Response.json({ 
      adaptedText: "Service temporarily unavailable. Please try again.",
      vocabulary: []
    }, { status: 500 });
  }
}