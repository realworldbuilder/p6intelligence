/**
 * AI-Reports-UI.js
 * This file handles the UI interactions for the AI reports section.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const saveApiConfigBtn = document.getElementById('save-api-config');
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('model');
    
    const generateSummaryBtn = document.getElementById('generate-summary-btn');
    const executiveSummaryContainer = document.getElementById('executive-summary');
    const executiveSummaryContent = document.getElementById('executive-summary-content');
    const executiveSummaryLoading = document.getElementById('executive-summary-loading');

    const generateScheduleBtn = document.getElementById('generate-schedule-btn');
    const scheduleAnalysisContainer = document.getElementById('schedule-analysis');
    const scheduleAnalysisContent = document.getElementById('schedule-analysis-content');
    const scheduleAnalysisLoading = document.getElementById('schedule-analysis-loading');

    const generateStakeholderBtn = document.getElementById('generate-stakeholder-btn');
    const stakeholderButtons = document.querySelectorAll('.stakeholder-button');
    const stakeholderReportContainer = document.getElementById('stakeholder-report');
    const stakeholderReportContent = document.getElementById('stakeholder-report-content');
    const stakeholderReportLoading = document.getElementById('stakeholder-report-loading');
    
    // Tab Elements
    const tabButtons = document.querySelectorAll('.ai-tab-button');
    const tabContents = document.querySelectorAll('.ai-tab-content');

    // Initialize from localStorage if available
    if (localStorage.getItem('openai_api_key')) {
        apiKeyInput.value = localStorage.getItem('openai_api_key');
        configureAI({
            apiKey: localStorage.getItem('openai_api_key'),
            model: localStorage.getItem('openai_model') || 'gpt-4o'
        });
        
        if (localStorage.getItem('openai_model')) {
            modelSelect.value = localStorage.getItem('openai_model');
        }
        
        // Enable buttons if API key is set
        toggleReportButtons(true);
    }

    // Save API Configuration
    saveApiConfigBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        const model = modelSelect.value;

        if (apiKey) {
            // Save to localStorage
            localStorage.setItem('openai_api_key', apiKey);
            localStorage.setItem('openai_model', model);

            // Configure the AI module
            configureAI({
                apiKey: apiKey,
                model: model
            });

            // Enable report generation buttons
            toggleReportButtons(true);

            showNotification('API configuration saved successfully!', 'success');
        } else {
            showNotification('Please enter a valid API key.', 'error');
        }
    });
    
    // Tab Switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Generate Executive Summary
    generateSummaryBtn.addEventListener('click', function() {
        if (!projects.current) {
            showNotification('Please analyze a project first.', 'warning');
            return;
        }

        // Show loading state
        executiveSummaryContainer.style.display = 'block';
        executiveSummaryContent.style.display = 'none';
        executiveSummaryLoading.style.display = 'flex';

        // Generate the report
        generateExecutiveSummary(projects.current)
            .then(report => {
                // Hide loading and show content
                executiveSummaryLoading.style.display = 'none';
                executiveSummaryContent.style.display = 'block';
                executiveSummaryContent.innerHTML = report;
            })
            .catch(error => {
                // Handle error
                executiveSummaryLoading.style.display = 'none';
                executiveSummaryContent.style.display = 'block';
                executiveSummaryContent.innerHTML = `
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
    });

    // Generate Schedule Analysis
    generateScheduleBtn.addEventListener('click', function() {
        if (!projects.current) {
            showNotification('Please analyze a project first.', 'warning');
            return;
        }

        // Show loading state
        scheduleAnalysisContainer.style.display = 'block';
        scheduleAnalysisContent.style.display = 'none';
        scheduleAnalysisLoading.style.display = 'flex';

        // Generate the report
        generateScheduleAnalysis(projects.current)
            .then(report => {
                // Hide loading and show content
                scheduleAnalysisLoading.style.display = 'none';
                scheduleAnalysisContent.style.display = 'block';
                scheduleAnalysisContent.innerHTML = report;
            })
            .catch(error => {
                // Handle error
                scheduleAnalysisLoading.style.display = 'none';
                scheduleAnalysisContent.style.display = 'block';
                scheduleAnalysisContent.innerHTML = `
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
    });

    // Stakeholder button selection
    stakeholderButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            stakeholderButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
        });
    });

    // Generate Stakeholder Report
    generateStakeholderBtn.addEventListener('click', function() {
        if (!projects.current) {
            showNotification('Please analyze a project first.', 'warning');
            return;
        }

        // Get selected stakeholder type
        const selectedStakeholder = document.querySelector('.stakeholder-button.active').dataset.stakeholder;

        // Show loading state
        stakeholderReportContainer.style.display = 'block';
        stakeholderReportContent.style.display = 'none';
        stakeholderReportLoading.style.display = 'flex';

        // Generate the report
        generateStakeholderReport(projects.current, selectedStakeholder)
            .then(report => {
                // Hide loading and show content
                stakeholderReportLoading.style.display = 'none';
                stakeholderReportContent.style.display = 'block';
                stakeholderReportContent.innerHTML = report;
            })
            .catch(error => {
                // Handle error
                stakeholderReportLoading.style.display = 'none';
                stakeholderReportContent.style.display = 'block';
                stakeholderReportContent.innerHTML = `
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
    });

    // Helper function to toggle report buttons
    function toggleReportButtons(enabled) {
        generateSummaryBtn.disabled = !enabled;
        generateScheduleBtn.disabled = !enabled;
        generateStakeholderBtn.disabled = !enabled;
    }
    
    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `ai-notification ai-notification-${type}`;
        notification.innerHTML = message;
        
        // Append to body
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Listen for project analysis completion
    document.addEventListener('projectAnalyzed', function() {
        // Only enable buttons if API key is set
        if (AI_CONFIG.apiKey) {
            toggleReportButtons(true);
        }
    });
}); 