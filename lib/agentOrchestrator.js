// Agent Orchestrator for Language Lite
// Manages the multi-agent workflow for text adaptation

import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';

export class AgentOrchestrator {
  constructor() {
    this.config = null;
    this.linguisticRules = null;
    this.currentWorkflow = null;
  }

  async initialize() {
    // Load configuration files
    const configPath = path.join(process.cwd(), 'config', 'agents.yaml');
    const rulesPath = path.join(process.cwd(), 'config', 'linguistic-adaptation-rules.yaml');
    
    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      this.config = yaml.load(configFile);
      
      const rulesFile = await fs.readFile(rulesPath, 'utf8');
      this.linguisticRules = yaml.load(rulesFile);
      
      console.log('Agent orchestrator initialized successfully');
      console.log(`Loaded ${Object.keys(this.linguisticRules.languages).length} languages:`, Object.keys(this.linguisticRules.languages));
    } catch (error) {
      console.error('Failed to initialize agent orchestrator:', error);
      console.error('Config path:', configPath);
      console.error('Rules path:', rulesPath);
      throw error;
    }
  }

  async processTextAdaptation(input) {
    const {
      originalText,
      targetLanguage,
      proficiencyLevel,
      motherTongue
    } = input;

    // Initialize workflow tracking
    this.currentWorkflow = {
      id: this.generateWorkflowId(),
      startTime: new Date(),
      input,
      phases: [],
      currentPhase: 0,
      status: 'running'
    };

    try {
      // Phase 1: Text Adaptation
      console.log('Starting Phase 1: Text Adaptation');
      const adaptationResult = await this.executeAdaptationPhase(input);
      
      if (!adaptationResult.success) {
        throw new Error('Adaptation phase failed: ' + adaptationResult.error);
      }

      // Phase 2: Pedagogical Review (with potential revision cycles)
      console.log('Starting Phase 2: Pedagogical Review');
      const reviewResult = await this.executeReviewPhase({
        ...input,
        adaptedText: adaptationResult.adaptedText,
        adaptationNotes: adaptationResult.notes
      });

      if (!reviewResult.success) {
        throw new Error('Review phase failed: ' + reviewResult.error);
      }

      // Phase 3: Vocabulary Extraction
      console.log('Starting Phase 3: Vocabulary Extraction');
      const vocabularyResult = await this.executeVocabularyPhase({
        ...input,
        adaptedText: reviewResult.finalText
      });

      if (!vocabularyResult.success) {
        throw new Error('Vocabulary phase failed: ' + vocabularyResult.error);
      }

      // Finalize workflow
      this.currentWorkflow.status = 'completed';
      this.currentWorkflow.endTime = new Date();
      this.currentWorkflow.result = {
        adaptedText: vocabularyResult.adaptedText,
        vocabulary: vocabularyResult.vocabulary,
        metrics: this.calculateMetrics()
      };

      return {
        success: true,
        result: this.currentWorkflow.result,
        workflowId: this.currentWorkflow.id
      };

    } catch (error) {
      this.currentWorkflow.status = 'failed';
      this.currentWorkflow.error = error.message;
      console.error('Workflow failed:', error);
      
      return {
        success: false,
        error: error.message,
        workflowId: this.currentWorkflow.id
      };
    }
  }

  // Map frontend level names to CEFR levels
  mapLevelToCEFR(level) {
    const levelMapping = {
      'Beginner': 'A1',
      'Intermediate': 'B1', 
      'Advanced': 'C1'
    };
    return levelMapping[level] || level;
  }

  async executeAdaptationPhase(input) {
    const { originalText, targetLanguage, proficiencyLevel, motherTongue } = input;
    
    // Convert frontend level to CEFR level and get language key
    const cefrLevel = this.mapLevelToCEFR(proficiencyLevel);
    const languageKey = targetLanguage.toLowerCase();
    
    // Get language-specific rules
    const languageRules = this.linguisticRules.languages[languageKey];
    const levelRules = languageRules?.levels?.[cefrLevel];
    const universalRules = this.linguisticRules.universal_principles;

    if (!languageRules || !levelRules) {
      console.error(`Language mapping: ${targetLanguage} -> ${languageKey}`);
      console.error(`Level mapping: ${proficiencyLevel} -> ${cefrLevel}`);
      console.error(`Available languages:`, Object.keys(this.linguisticRules.languages || {}));
      console.error(`Available levels for ${languageKey}:`, Object.keys(languageRules?.levels || {}));
      throw new Error(`No rules found for ${targetLanguage} (${languageKey}) at ${proficiencyLevel} (${cefrLevel}) level`);
    }

    // Calculate target word count
    const originalWordCount = originalText.split(/\s+/).length;
    const targetWordCount = this.calculateTargetWordCount(originalWordCount);

    // Build adaptation prompt
    const adaptationPrompt = this.buildAdaptationPrompt({
      originalText,
      targetLanguage,
      proficiencyLevel,
      cefrLevel,
      motherTongue,
      languageRules,
      levelRules,
      universalRules,
      targetWordCount
    });

    try {
      // Call OpenAI API for adaptation
      const response = await this.callOpenAI(adaptationPrompt, 'adaptation');
      
      // Validate adaptation result
      const validation = this.validateAdaptation(response.adaptedText, {
        originalText,
        targetWordCount,
        proficiencyLevel,
        languageRules
      });

      this.currentWorkflow.phases.push({
        phase: 'adaptation',
        status: 'completed',
        result: response,
        validation
      });

      return {
        success: true,
        adaptedText: response.adaptedText,
        notes: response.adaptationNotes,
        validation
      };

    } catch (error) {
      this.currentWorkflow.phases.push({
        phase: 'adaptation',
        status: 'failed',
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeReviewPhase(input, revisionCycle = 0) {
    // Find the review phase configuration
    const reviewPhase = this.config.workflows.text_adaptation.phases.find(p => p.phase_2);
    const maxRevisions = reviewPhase?.phase_2?.max_revision_cycles || 2;
    
    if (revisionCycle >= maxRevisions) {
      console.log('Max revision cycles reached, proceeding with current text');
      return { success: true, finalText: input.adaptedText };
    }

    // Build review prompt
    const reviewPrompt = this.buildReviewPrompt(input);

    try {
      const response = await this.callOpenAI(reviewPrompt, 'review');
      
      this.currentWorkflow.phases.push({
        phase: 'review',
        cycle: revisionCycle,
        status: 'completed',
        decision: response.decision,
        feedback: response.feedback
      });

      switch (response.decision.toLowerCase()) {
        case 'approve':
          return { success: true, finalText: input.adaptedText };
          
        case 'revise':
        case 'reject':
          console.log(`Review result: ${response.decision}. Starting revision cycle ${revisionCycle + 1}`);
          
          // Re-run adaptation with feedback
          const revisionResult = await this.executeAdaptationPhase({
            ...input,
            feedback: response.feedback,
            revisionCycle: revisionCycle + 1
          });
          
          if (!revisionResult.success) {
            return revisionResult;
          }
          
          // Re-review the revised text
          return await this.executeReviewPhase({
            ...input,
            adaptedText: revisionResult.adaptedText
          }, revisionCycle + 1);
          
        default:
          throw new Error('Unknown review decision: ' + response.decision);
      }

    } catch (error) {
      this.currentWorkflow.phases.push({
        phase: 'review',
        cycle: revisionCycle,
        status: 'failed',
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeVocabularyPhase(input) {
    const { adaptedText, targetLanguage, proficiencyLevel, motherTongue } = input;

    // Build vocabulary extraction prompt
    const vocabularyPrompt = this.buildVocabularyPrompt(input);

    try {
      const response = await this.callOpenAI(vocabularyPrompt, 'vocabulary');
      
      this.currentWorkflow.phases.push({
        phase: 'vocabulary',
        status: 'completed',
        result: response
      });

      return {
        success: true,
        adaptedText,
        vocabulary: response.vocabulary
      };

    } catch (error) {
      this.currentWorkflow.phases.push({
        phase: 'vocabulary',
        status: 'failed',
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildAdaptationPrompt({ originalText, targetLanguage, proficiencyLevel, cefrLevel, motherTongue, languageRules, levelRules, universalRules, targetWordCount }) {
    return `You are a specialist language teacher adapting text for ${proficiencyLevel} level ${targetLanguage} learners whose mother tongue is ${motherTongue}.

ORIGINAL TEXT:
${originalText}

ADAPTATION REQUIREMENTS:
- Target word count: ${targetWordCount} words (original: ${originalText.split(/\s+/).length} words)
- CRITICAL: Maintain the exact same number of paragraphs and paragraph structure as the original
- CRITICAL: Preserve paragraph breaks with double line breaks (\n\n) exactly as in the original
- Follow ${proficiencyLevel} level constraints for ${targetLanguage}

LANGUAGE-SPECIFIC RULES FOR ${targetLanguage}:
${this.formatRulesForPrompt(languageRules, levelRules)}

UNIVERSAL PRINCIPLES:
${this.formatUniversalRulesForPrompt(universalRules, cefrLevel)}

Please adapt the text following these rules exactly. Return your response in JSON format:
{
  "adaptedText": "your adapted text here",
  "adaptationNotes": "brief notes about what you changed and why",
  "wordCount": actual_word_count,
  "paragraphCount": actual_paragraph_count
}`;
  }

  buildReviewPrompt({ adaptedText, originalText, targetLanguage, proficiencyLevel, adaptationNotes }) {
    return `You are an experienced language teacher reviewing an adapted text. Evaluate whether this adaptation is appropriate for ${proficiencyLevel} level ${targetLanguage} learners.

ORIGINAL TEXT:
${originalText}

ADAPTED TEXT:
${adaptedText}

ADAPTATION NOTES:
${adaptationNotes}

Please review from a pedagogical perspective and decide whether to:
- APPROVE: Text is appropriate and well-adapted
- REVISE: Text needs minor adjustments
- REJECT: Text needs significant rework

Return your response in JSON format:
{
  "decision": "approve/revise/reject",
  "feedback": "specific feedback about what works well and what needs improvement",
  "pedagogicalScore": score_from_0_to_1,
  "specificIssues": ["list", "of", "specific", "issues"]
}`;
  }

  buildVocabularyPrompt({ adaptedText, targetLanguage, proficiencyLevel, motherTongue }) {
    return `You are a vocabulary specialist. Extract new vocabulary from this ${proficiencyLevel} level ${targetLanguage} text that learners should learn. Provide translations in ${motherTongue}.

TEXT:
${adaptedText}

Instructions:
- Identify 5-8 key vocabulary words appropriate for ${proficiencyLevel} level
- Focus on words that are important for comprehension
- AVOID international words, cognates, or words similar to ${motherTongue} (e.g., "hospital", "restaurant", "computer")
- PRIORITIZE original ${targetLanguage} roots, cultural words, and language-specific expressions
- Focus on words that are genuinely different from ${motherTongue} and represent the essence of ${targetLanguage}
- Avoid overly basic words that ${proficiencyLevel} learners should already know
- Provide clear, contextual translations in ${motherTongue}

Return your response in JSON format:
{
  "vocabulary": [
    {
      "word": "target language word",
      "translation": "translation in ${motherTongue}",
      "difficulty": "appropriate/challenging", 
      "context": "how it's used in the text"
    }
  ]
}`;
  }

  formatRulesForPrompt(languageRules, levelRules) {
    let formatted = '';
    
    if (levelRules.allowed_grammar) {
      formatted += `ALLOWED GRAMMAR: ${levelRules.allowed_grammar.join(', ')}\n`;
    }
    
    if (levelRules.avoid_grammar) {
      formatted += `AVOID: ${levelRules.avoid_grammar.join(', ')}\n`;
    }
    
    if (levelRules.verb_restrictions) {
      formatted += `VERB RESTRICTIONS: ${levelRules.verb_restrictions.join(', ')}\n`;
    }
    
    if (levelRules.specific_features) {
      formatted += `SPECIFIC RULES: ${levelRules.specific_features.join(', ')}\n`;
    }
    
    return formatted;
  }

  formatUniversalRulesForPrompt(universalRules, level) {
    const levelRules = universalRules.vocabulary_frequency[level];
    const sentenceRules = universalRules.sentence_complexity[level];
    return `
- Maximum sentence length: ${sentenceRules.max_clauses} clauses
- Vocabulary frequency: ${levelRules.frequency_band}
- Keep sentences simple and ${sentenceRules.subordination === 'None' ? 'avoid subordination' : 'use ' + sentenceRules.subordination}
`;
  }

  calculateTargetWordCount(originalWordCount) {
    const requirements = this.config.requirements.word_count;
    
    if (originalWordCount < 200) {
      return requirements.short_texts.target;
    } else {
      const reduction = requirements.long_texts.reduction / 100;
      return Math.round(originalWordCount * (1 - reduction));
    }
  }

  validateAdaptation(adaptedText, criteria) {
    const wordCount = adaptedText.split(/\s+/).length;
    const paragraphCount = adaptedText.split(/\n\s*\n/).length;
    const originalParagraphCount = criteria.originalText.split(/\n\s*\n/).length;
    
    return {
      wordCountValid: Math.abs(wordCount - criteria.targetWordCount) <= 20,
      paragraphStructurePreserved: paragraphCount === originalParagraphCount,
      actualWordCount: wordCount,
      targetWordCount: criteria.targetWordCount
    };
  }

  async callOpenAI(prompt, agentType) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Making OpenAI API call for agent: ${agentType}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPromptForAgent(agentType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      console.log(`OpenAI ${agentType} agent response received successfully`);
      return result;
    } catch (error) {
      console.error('Failed to parse JSON response from OpenAI:', content);
      console.error('Agent type:', agentType);
      throw new Error(`Invalid JSON response from AI agent (${agentType}): ${error.message}`);
    }
  }

  getSystemPromptForAgent(agentType) {
    const prompts = {
      adaptation: "You are a professional language teacher specializing in text adaptation for language learners. You excel at simplifying texts while maintaining their meaning and educational value.",
      review: "You are an experienced language pedagogy expert who reviews adapted texts for appropriateness and educational effectiveness.",
      vocabulary: "You are a vocabulary specialist who identifies key learning words and provides accurate, contextual translations."
    };
    
    return prompts[agentType] || "You are a helpful language learning assistant.";
  }

  generateWorkflowId() {
    return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  calculateMetrics() {
    const phases = this.currentWorkflow.phases;
    const totalTime = this.currentWorkflow.endTime - this.currentWorkflow.startTime;
    
    return {
      totalProcessingTime: totalTime,
      phasesCompleted: phases.length,
      revisionCycles: phases.filter(p => p.phase === 'review').length,
      success: this.currentWorkflow.status === 'completed'
    };
  }
}