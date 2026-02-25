let impactChart; // prevent duplicate charts

function analyzeImpact() {

    const input = document.getElementById("userInput").value.toLowerCase();

    if (input.trim() === "") {
        alert("Please describe your daily activities.");
        return;
    }

    let transport = 0;
    let electricity = 0;
    let cooking = 0;

    // Basic keyword extraction (AI-style logic simulation)
    if (input.includes("car") || input.includes("drive") || input.includes("petrol") || input.includes("diesel")) {
        transport += 40;
    }

    if (input.includes("ac") || input.includes("electricity") || input.includes("fan") || input.includes("computer")) {
        electricity += 30;
    }

    if (input.includes("lpg") || input.includes("gas") || input.includes("cook")) {
        cooking += 20;
    }

    // If nothing detected, assign small base values
    if (transport === 0 && electricity === 0 && cooking === 0) {
        transport = 20;
        electricity = 20;
        cooking = 20;
    }

    document.getElementById("results").style.display = "block";

    const ctx = document.getElementById("impactChart").getContext("2d");

    // Destroy old chart if exists
    if (impactChart) {
        impactChart.destroy();
    }

    impactChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Transport", "Electricity", "Cooking"],
            datasets: [{
                data: [transport, electricity, cooking]
            }]
        },
        options: {
            responsive: true
        }
    });

    // AI-like explanation
    let highest = Math.max(transport, electricity, cooking);

    let source = "";
    if (highest === transport) source = "transport (vehicle fuel usage)";
    else if (highest === electricity) source = "electricity consumption";
    else source = "cooking fuel usage";

    document.getElementById("analysisText").innerText =
        "Your largest estimated pollution source is " + source +
        ". Consider reducing usage or switching to cleaner alternatives like public transport, renewable electricity, or induction cooking.";
}
