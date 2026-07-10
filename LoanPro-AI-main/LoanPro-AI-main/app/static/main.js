// Predefined Applicant Profiles for Easy Testing
const PRESETS = {
    excellent: {
        "purpose": "credit_card",
        "int.rate": 0.0788,
        "installment": 125.13,
        "log.annual.inc": 11.904968,
        "dti": 8.1,
        "fico": 782,
        "days.with.cr.line": 6120.0,
        "revol.bal": 8000,
        "revol.util": 23.2,
        "inq.last.6mths": 0,
        "delinq.2yrs": 0,
        "pub.rec": 0
    },
    average: {
        "purpose": "debt_consolidation",
        "int.rate": 0.1189,
        "installment": 354.76,
        "log.annual.inc": 11.082143,
        "dti": 14.29,
        "fico": 707,
        "days.with.cr.line": 2760.0,
        "revol.bal": 15000,
        "revol.util": 52.1,
        "inq.last.6mths": 1,
        "delinq.2yrs": 0,
        "pub.rec": 0
    },
    high_debt: {
        "purpose": "debt_consolidation",
        "int.rate": 0.1496,
        "installment": 685.99,
        "log.annual.inc": 10.434116,
        "dti": 24.85,
        "fico": 632,
        "days.with.cr.line": 1200.0,
        "revol.bal": 42000,
        "revol.util": 93.8,
        "inq.last.6mths": 3,
        "delinq.2yrs": 1,
        "pub.rec": 1
    },
    delinquent: {
        "purpose": "small_business",
        "int.rate": 0.1836,
        "installment": 504.13,
        "log.annual.inc": 9.923290,
        "dti": 28.04,
        "fico": 590,
        "days.with.cr.line": 1500.0,
        "revol.bal": 25000,
        "revol.util": 93.4,
        "inq.last.6mths": 6,
        "delinq.2yrs": 4,
        "pub.rec": 2
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loan-evaluation-form");
    const resultCard = document.getElementById("result-card");
    const emptyState = document.getElementById("empty-state");
    const loadingState = document.getElementById("loading-state");
    const completedState = document.getElementById("completed-state");
    
    const statusText = document.getElementById("status-text");
    const labelDecision = document.getElementById("label-decision");
    const confidencePercentage = document.getElementById("confidence-percentage");
    const probabilityEligible = document.getElementById("probability-eligible");
    const probabilityIneligible = document.getElementById("probability-ineligible");
    const confidenceCircle = document.getElementById("confidence-circle");
    const insightsList = document.getElementById("insights-list");
    
    // Preset Buttons Click Event
    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const presetName = btn.getAttribute("data-preset");
            loadPreset(presetName);
        });
    });
    
    // Form Submission Event
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Show loading state
        emptyState.classList.add("hidden");
        completedState.classList.add("hidden");
        loadingState.classList.remove("hidden");
        
        resultCard.className = "card result-card"; // Reset modifier classes
        
        // Collect form data
        const formData = new FormData(form);
        const payload = {};
        formData.forEach((value, key) => {
            // Convert to numeric if possible, except for the categorical column 'purpose'
            if (key === "purpose") {
                payload[key] = value;
            } else {
                payload[key] = parseFloat(value);
            }
        });
        
        try {
            const response = await fetch("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === "success") {
                displayResults(result, payload);
            } else {
                alert(`Error: ${result.message || "Something went wrong"}`);
                resetToEmpty();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to communicate with prediction server.");
            resetToEmpty();
        }
    });
    
    // Fill form elements with a preset
    function loadPreset(name) {
        const data = PRESETS[name];
        if (!data) return;
        
        document.getElementById("purpose").value = data["purpose"];
        document.getElementById("int_rate").value = data["int.rate"];
        document.getElementById("installment").value = data["installment"];
        document.getElementById("log_annual_inc").value = data["log.annual.inc"];
        document.getElementById("dti").value = data["dti"];
        document.getElementById("fico").value = data["fico"];
        document.getElementById("days_with_cr_line").value = data["days.with.cr.line"];
        document.getElementById("revol_bal").value = data["revol.bal"];
        document.getElementById("revol_util").value = data["revol.util"];
        document.getElementById("inq_last_6mths").value = data["inq.last.6mths"];
        document.getElementById("delinq_2yrs").value = data["delinq.2yrs"];
        document.getElementById("pub_rec").value = data["pub.rec"];
        
        // Add subtle animation check to the form elements
        form.classList.add("pulse");
        setTimeout(() => form.classList.remove("pulse"), 400);
    }
    
    // Display results in the result card
    function displayResults(data, inputs) {
        loadingState.classList.add("hidden");
        completedState.classList.remove("hidden");
        
        const prediction = data.prediction;
        const confidence = data.confidence;
        
        // Style based on classification
        if (prediction === 1) {
            resultCard.className = "card result-card eligible";
            statusText.innerText = "Meets Policy";
            labelDecision.innerText = "ELIGIBLE (Class 1)";
        } else {
            resultCard.className = "card result-card ineligible";
            statusText.innerText = "Does Not Meet Policy";
            labelDecision.innerText = "INELIGIBLE (Class 0)";
        }
        
        // Update percentages
        const percentageStr = `${Math.round(confidence * 100)}%`;
        confidencePercentage.innerText = percentageStr;
        probabilityEligible.innerText = `${(data.probability_eligible * 100).toFixed(2)}%`;
        probabilityIneligible.innerText = `${(data.probability_ineligible * 100).toFixed(2)}%`;
        
        // Circular Gauge Animation: circumference = 2 * PI * r = 2 * 3.14159 * 70 = 439.82
        const circumference = 439.82;
        const dashoffset = circumference - (confidence * circumference);
        confidenceCircle.style.strokeDashoffset = dashoffset;
        
        // Render dynamic risk insights based on thresholds
        generateInsights(inputs, prediction);
    }
    
    // Generate AI underwriter suggestions
    function generateInsights(inputs, prediction) {
        insightsList.innerHTML = "";
        const insights = [];
        
        // 1. Credit Score (FICO) Insight
        if (inputs.fico < 660) {
            insights.push({
                type: "warn",
                text: `FICO score of ${inputs.fico} is low (below 660) and poses a high default risk.`
            });
        } else if (inputs.fico >= 740) {
            insights.push({
                type: "good",
                text: `FICO score of ${inputs.fico} is excellent (740+), demonstrating high creditworthiness.`
            });
        }
        
        // 2. Debt-to-Income (DTI)
        if (inputs.dti > 20) {
            insights.push({
                type: "warn",
                text: `DTI ratio of ${inputs.dti}% is high, indicating the borrower has substantial monthly debts.`
            });
        } else if (inputs.dti < 10) {
            insights.push({
                type: "good",
                text: `Very healthy DTI ratio of ${inputs.dti}%, leaving plenty of room for installments.`
            });
        }
        
        // 3. Credit Utilization
        if (inputs["revol.util"] > 80) {
            insights.push({
                type: "warn",
                text: `Revolving credit utilization is critical at ${inputs["revol.util"]}%, suggesting maxed out lines.`
            });
        }
        
        // 4. Inquiries
        if (inputs["inq.last.6mths"] >= 3) {
            insights.push({
                type: "warn",
                text: `Recent hard credit inquiries (${inputs["inq.last.6mths"]} in 6 months) indicates active search for credit.`
            });
        }
        
        // 5. Delinquencies
        if (inputs["delinq.2yrs"] > 0) {
            insights.push({
                type: "warn",
                text: `${inputs["delinq.2yrs"]} delinquencies reported in the last 2 years, highlighting payment history issues.`
            });
        }
        
        // Fallback default statements if profile is very plain
        if (insights.length === 0) {
            if (prediction === 1) {
                insights.push({ type: "good", text: "Applicant exhibits solid credentials with well-balanced indicators." });
            } else {
                insights.push({ type: "warn", text: "Applicant has a combination of factors that trigger eligibility thresholds." });
            }
        }
        
        // Append insights to list with correct CSS classes
        insights.forEach(item => {
            const li = document.createElement("li");
            li.innerText = item.text;
            li.className = item.type;
            insightsList.appendChild(li);
        });
    }
    
    function resetToEmpty() {
        loadingState.classList.add("hidden");
        completedState.classList.add("hidden");
        emptyState.classList.remove("hidden");
        resultCard.className = "card result-card empty";
    }
});
