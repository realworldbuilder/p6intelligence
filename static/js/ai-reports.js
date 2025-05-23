/**
 * AI-Reports.js
 * This file contains functions for generating AI-powered project reports
 * based on XER file analysis using the OpenAI API.
 */

// Configuration for OpenAI API
const AI_CONFIG = {
    apiKey: "", // To be configured by the user
    model: "gpt-4", // Default model, can be changed
    temperature: 0.7,
    maxTokens: 2000
};

/**
 * Generate a project summary report
 * @param {Object} project - The analyzed project
 * @param {Object} baseline - The baseline project (optional)
 * @returns {Promise<string>} - HTML content for the report
 */
async function generateExecutiveSummary(project, baseline = null) {
    try {
        if (!AI_CONFIG.apiKey) {
            return `<div class="error-message">
                <h3>API Key Required</h3>
                <p>Please configure your OpenAI API key in the settings.</p>
            </div>`;
        }

        // Prepare project data for the AI
        const projectData = prepareProjectDataForAI(project);
        
        // Create the prompt for the AI
        let prompt = `
        Generate an executive summary for a construction/engineering project based on the following data:
        
        Project Name: ${project.name}
        Project ID: ${project.proj_short_name}
        Start Date: ${formatDate(project.start)}
        Planned Finish: ${formatDate(project.scd_end_date)}
        
        Schedule Statistics:
        - Total Activities: ${project.tasks.size}
        - Not Started: ${project.notStarted.length} (${((project.notStarted.length / project.tasks.size) * 100).toFixed(1)}%)
        - In Progress: ${project.inProgress.length} (${((project.inProgress.length / project.tasks.size) * 100).toFixed(1)}%)
        - Complete: ${project.completed.length} (${((project.completed.length / project.tasks.size) * 100).toFixed(1)}%)
        - Critical Activities: ${project.critical.length}
        - Physical % Complete: ${(project.physPercentComp * 100).toFixed(1)}%
        - Schedule % Complete: ${(project.schedPercentComp * 100).toFixed(1)}%
        
        Cost Statistics:
        - Budgeted Cost: ${formatCost(project.budgetCost)}
        - Actual Cost: ${formatCost(project.actualCost)}
        - Remaining Cost: ${formatCost(project.remainingCost)}
        `;

        // Add baseline comparison if available
        if (baseline) {
            const baselineData = prepareProjectDataForAI(baseline);
            prompt += `
        Baseline Comparison:
        - Original Planned Finish: ${formatDate(baseline.scd_end_date)} (Current: ${formatDate(project.scd_end_date)})
        - Original Duration: ${baseline.scheduleDuration} days (Current: ${project.scheduleDuration} days)
        - Schedule Variance: ${project.scheduleDuration - baseline.scheduleDuration} days
        - Original Budget: ${formatCost(baseline.budgetCost)} (Current: ${formatCost(project.budgetCost)})
        - Cost Variance: ${formatCost(project.budgetCost - baseline.budgetCost)}
        - Original Activity Count: ${baseline.tasks.size} (Current: ${project.tasks.size})
            `;
        }
        
        prompt += `
        ${baseline ? 'Focus on comparing current project status against the baseline.' : 'Identify key project health indicators and potential issues.'}
        Provide recommendations and assess overall project status.
        Format the response as HTML that can be directly inserted into a web page.
        `;

        // Call OpenAI API
        const response = await callOpenAI(prompt);
        
        // Return the generated report
        return response;
    } catch (error) {
        console.error("Error generating executive summary:", error);
        return `<div class="error-message">
            <h3>Error Generating Report</h3>
            <p>${error.message}</p>
        </div>`;
    }
}

/**
 * Generate a detailed schedule analysis report
 * @param {Object} project - The analyzed project
 * @param {Object} baseline - The baseline project (optional)
 * @returns {Promise<string>} - HTML content for the report
 */
async function generateScheduleAnalysis(project, baseline = null) {
    try {
        if (!AI_CONFIG.apiKey) {
            return `<div class="error-message">
                <h3>API Key Required</h3>
                <p>Please configure your OpenAI API key in the settings.</p>
            </div>`;
        }

        // Prepare project data for the AI
        const projectData = prepareProjectDataForAI(project);

        // Create the prompt for the AI
        let prompt = `
        Generate a detailed schedule analysis for a construction/engineering project based on the following data:
        
        Project Name: ${project.name}
        Project ID: ${project.proj_short_name}
        Start Date: ${formatDate(project.start)}
        Planned Finish: ${formatDate(project.scd_end_date)}
        
        Schedule Statistics:
        - Total Activities: ${project.tasks.size}
        - Not Started: ${project.notStarted.length} (${((project.notStarted.length / project.tasks.size) * 100).toFixed(1)}%)
        - In Progress: ${project.inProgress.length} (${((project.inProgress.length / project.tasks.size) * 100).toFixed(1)}%)
        - Complete: ${project.completed.length} (${((project.completed.length / project.tasks.size) * 100).toFixed(1)}%)
        - Critical Activities: ${project.critical.length}
        - Near Critical Activities: ${project.nearCritical.length}
        - Physical % Complete: ${(project.physPercentComp * 100).toFixed(1)}%
        - Schedule % Complete: ${(project.schedPercentComp * 100).toFixed(1)}%
        `;

        // Add baseline comparison if available
        if (baseline) {
            const baselineData = prepareProjectDataForAI(baseline);
            prompt += `
        Baseline Schedule Comparison:
        - Original Start Date: ${formatDate(baseline.start)} (Current: ${formatDate(project.start)})
        - Original Planned Finish: ${formatDate(baseline.scd_end_date)} (Current: ${formatDate(project.scd_end_date)})
        - Original Duration: ${baseline.scheduleDuration} days (Current: ${project.scheduleDuration} days)
        - Schedule Variance: ${project.scheduleDuration - baseline.scheduleDuration} days
        - Original Critical Activities: ${baseline.critical.length} (Current: ${project.critical.length})
        - Original Activity Count: ${baseline.tasks.size} (Current: ${project.tasks.size})
        - Milestone Delays: ${identifyMilestoneDelays(project, baseline)}
            `;
        }
        
        prompt += `
        ${baseline ? 'Focus on analyzing schedule changes from baseline to current, identifying slippage areas, and explaining the impact of deviations.' : 'Identify potential schedule risks and bottlenecks.'}
        Provide critical path analysis and recommendations for schedule optimization.
        Analyze the current progress rate and forecast completion based on the data.
        Format the response as HTML that can be directly inserted into a web page.
        `;

        // Call OpenAI API
        const response = await callOpenAI(prompt);
        
        // Return the generated report
        return response;
    } catch (error) {
        console.error("Error generating schedule analysis:", error);
        return `<div class="error-message">
            <h3>Error Generating Report</h3>
            <p>${error.message}</p>
        </div>`;
    }
}

/**
 * Generate a custom report for a specific stakeholder
 * @param {Object} project - The analyzed project
 * @param {Object} baseline - The baseline project (optional)
 * @param {string} stakeholderType - Type of stakeholder (executive, pm, team_lead)
 * @returns {Promise<string>} - HTML content for the report
 */
async function generateStakeholderReport(project, stakeholderType, baseline = null) {
    try {
        if (!AI_CONFIG.apiKey) {
            return `<div class="error-message">
                <h3>API Key Required</h3>
                <p>Please configure your OpenAI API key in the settings.</p>
            </div>`;
        }

        // Prepare project data for the AI
        const projectData = prepareProjectDataForAI(project);
        
        let stakeholderFocus = "";
        switch(stakeholderType) {
            case "executive":
                stakeholderFocus = "Focus on high-level project status, financial performance, major risks, and key milestones.";
                break;
            case "pm":
                stakeholderFocus = "Focus on detailed schedule performance, resource utilization, critical path analysis, and actionable recommendations.";
                break;
            case "team_lead":
                stakeholderFocus = "Focus on detailed task completion status, upcoming activities, resource requirements, and technical challenges.";
                break;
            default:
                stakeholderFocus = "Provide a balanced overview of the project status.";
        }

        // Create the prompt for the AI
        let prompt = `
        Generate a custom project report for a ${stakeholderType.replace('_', ' ')} based on the following data:
        
        Project Name: ${project.name}
        Project ID: ${project.proj_short_name}
        Start Date: ${formatDate(project.start)}
        Planned Finish: ${formatDate(project.scd_end_date)}
        
        Schedule Statistics:
        - Total Activities: ${project.tasks.size}
        - Not Started: ${project.notStarted.length} (${((project.notStarted.length / project.tasks.size) * 100).toFixed(1)}%)
        - In Progress: ${project.inProgress.length} (${((project.inProgress.length / project.tasks.size) * 100).toFixed(1)}%)
        - Complete: ${project.completed.length} (${((project.completed.length / project.tasks.size) * 100).toFixed(1)}%)
        - Critical Activities: ${project.critical.length}
        - Physical % Complete: ${(project.physPercentComp * 100).toFixed(1)}%
        - Schedule % Complete: ${(project.schedPercentComp * 100).toFixed(1)}%
        
        Cost Statistics:
        - Budgeted Cost: ${formatCost(project.budgetCost)}
        - Actual Cost: ${formatCost(project.actualCost)}
        - Remaining Cost: ${formatCost(project.remainingCost)}
        `;

        // Add baseline comparison if available
        if (baseline) {
            const baselineData = prepareProjectDataForAI(baseline);
            prompt += `
        Baseline Comparison:
        - Original Planned Finish: ${formatDate(baseline.scd_end_date)} (Current: ${formatDate(project.scd_end_date)})
        - Schedule Variance: ${project.scheduleDuration - baseline.scheduleDuration} days
        - Original Budget: ${formatCost(baseline.budgetCost)} (Current: ${formatCost(project.budgetCost)})
        - Cost Variance: ${formatCost(project.budgetCost - baseline.budgetCost)}
        - Earned Value Metrics:
          * SPI: ${calculateSPI(project, baseline).toFixed(2)}
          * CPI: ${calculateCPI(project, baseline).toFixed(2)}
        `;
        }
        
        prompt += `
        ${stakeholderFocus}
        ${baseline ? 'Include analysis of variances from baseline and their impact on project objectives.' : ''}
        
        Format the response as HTML that can be directly inserted into a web page.
        `;

        // Call OpenAI API
        const response = await callOpenAI(prompt);
        
        // Return the generated report
        return response;
    } catch (error) {
        console.error("Error generating stakeholder report:", error);
        return `<div class="error-message">
            <h3>Error Generating Report</h3>
            <p>${error.message}</p>
        </div>`;
    }
}

/**
 * Prepare project data for submission to the AI
 * @param {Object} project - The analyzed project
 * @returns {Object} - Summarized project data for AI processing
 */
function prepareProjectDataForAI(project) {
    // Extract and summarize relevant project data for AI analysis
    return {
        projectInfo: {
            name: project.name,
            id: project.proj_short_name,
            start: formatDate(project.start),
            finish: formatDate(project.scd_end_date),
            duration: project.scheduleDuration,
            remDuration: project.remScheduleDuration
        },
        
        scheduleMetrics: {
            totalActivities: project.tasks.size,
            notStartedCount: project.notStarted.length,
            inProgressCount: project.inProgress.length,
            completedCount: project.completed.length,
            criticalCount: project.critical.length,
            nearCriticalCount: project.nearCritical.length,
            normalFloatCount: project.normalFloat.length,
            highFloatCount: project.highFloat.length,
            physPercentComplete: project.physPercentComp,
            schedPercentComplete: project.schedPercentComp
        },
        
        costMetrics: {
            budgetCost: project.budgetCost,
            actualCost: project.actualCost,
            thisPeriodCost: project.thisPeriodCost,
            remainingCost: project.remainingCost
        },

        resourceMetrics: {
            budgetQty: project.budgetQty,
            actualQty: project.actualQty,
            thisPeriodQty: project.thisPeriodQty,
            remainingQty: project.remainingQty
        }
    };
}

/**
 * Calculate Schedule Performance Index (SPI)
 * @param {Object} project - Current project
 * @param {Object} baseline - Baseline project
 * @returns {number} - SPI value
 */
function calculateSPI(project, baseline) {
    if (!baseline || !project.schedPercentComp) return 1.0;
    
    // Calculate planned percent complete based on baseline duration and current elapsed time
    const startDate = new Date(project.start);
    const currentDate = new Date();
    const totalDuration = baseline.scheduleDuration;
    const elapsedDays = Math.max(0, Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)));
    
    const plannedPercentComplete = Math.min(1.0, elapsedDays / totalDuration);
    
    // Calculate SPI (Earned Value / Planned Value)
    return plannedPercentComplete > 0 ? project.schedPercentComp / plannedPercentComplete : 1.0;
}

/**
 * Calculate Cost Performance Index (CPI)
 * @param {Object} project - Current project
 * @param {Object} baseline - Baseline project
 * @returns {number} - CPI value
 */
function calculateCPI(project, baseline) {
    if (!baseline || !project.budgetCost || !project.actualCost) return 1.0;
    
    // Calculate CPI (Earned Value / Actual Cost)
    const earnedValue = project.schedPercentComp * project.budgetCost;
    return project.actualCost > 0 ? earnedValue / project.actualCost : 1.0;
}

/**
 * Identify milestone delays between current and baseline
 * @param {Object} project - Current project
 * @param {Object} baseline - Baseline project
 * @returns {string} - Summary of milestone delays
 */
function identifyMilestoneDelays(project, baseline) {
    if (!baseline) return "No baseline data available";
    
    // This would need to be implemented based on the actual project data structure
    // For now, returning a placeholder message
    return "Analysis of milestone dates requires further implementation";
}

/**
 * Call OpenAI API with prompt
 * @param {string} prompt - The prompt to send to OpenAI
 * @returns {Promise<string>} - Generated text
 */
async function callOpenAI(prompt) {
    // This is a placeholder for the actual API call
    // In a real implementation, you would make a fetch call to OpenAI's API
    
    // For development purposes, return a mock response
    if (!AI_CONFIG.apiKey) {
        throw new Error("API Key not configured");
    }
    
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { 
                        role: "system", 
                        content: "You are an experienced project management assistant specialized in analyzing construction and engineering projects." 
                    },
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                temperature: AI_CONFIG.temperature,
                max_tokens: AI_CONFIG.maxTokens
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        return data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw error;
    }
}

/**
 * Configure OpenAI API settings
 * @param {Object} config - Configuration object
 */
function configureAI(config) {
    AI_CONFIG.apiKey = config.apiKey || AI_CONFIG.apiKey;
    AI_CONFIG.model = config.model || AI_CONFIG.model;
    AI_CONFIG.temperature = config.temperature || AI_CONFIG.temperature;
    AI_CONFIG.maxTokens = config.maxTokens || AI_CONFIG.maxTokens;
} 