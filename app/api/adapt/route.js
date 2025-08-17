import { AgentOrchestrator } from '../../../lib/agentOrchestrator.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    // Check authentication first
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get user data including credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, email, total_adaptations')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient credits
    if (userData.credits <= 0) {
      return Response.json({ 
        error: 'No credits remaining. You get 2 free credits daily at midnight.',
        creditsRemaining: 0
      }, { status: 402 });
    }

    const requestBody = await request.json();
    const { text, language, level, motherTongue = 'English' } = requestBody;

    console.log(`Processing text adaptation: ${language} ${level}, Mother tongue: ${motherTongue}`);
    console.log('Request details:', {
      textLength: text?.length,
      language,
      level,
      motherTongue,
      textPreview: text?.substring(0, 50)
    });
    
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

    // Deduct 1 credit from user after successful adaptation
    const newCredits = userData.credits - 1;
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits: newCredits,
        total_adaptations: userData.total_adaptations ? userData.total_adaptations + 1 : 1
      })
      .eq('email', user.email);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      // Don't fail the request if credit update fails, but log it
    }

    console.log(`Credit deducted for user ${user.email}: ${userData.credits} -> ${newCredits}`);

    // Return the result from the agentic workflow
    return Response.json({
      adaptedText: workflowResult.result.adaptedText,
      vocabulary: workflowResult.result.vocabulary,
      workflowId: workflowResult.workflowId,
      metrics: workflowResult.result.metrics,
      creditsRemaining: newCredits
    });
  } catch (error) {
    console.error('Error in adapt API:', error);
    return Response.json({ 
      adaptedText: "Service temporarily unavailable. Please try again.",
      vocabulary: []
    }, { status: 500 });
  }
}