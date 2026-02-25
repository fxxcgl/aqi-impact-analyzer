let impactChart;

function calculateImpact() {

    const carKm = parseFloat(document.getElementById("carKm").value) || 0;
    const publicKm = parseFloat(document.getElementById("publicKm").value) || 0;
    const flightHours = parseFloat(document.getElementById("flightHours").value) || 0;
    const electricity = parseFloat(document.getElementById("electricity").value) || 0;
    const lpg = parseFloat(document.getElementById("lpg").value) || 0;

    // Emission Factors (approximate scientific averages)
    const carCO2 = carKm * 12 * 0.21;            // kg per km yearly
    const publicCO2 = publicKm * 12 * 0.05;
    const flightCO2 = flightHours * 90;
    const electricityCO2 = electricity * 12 * 0.82;
    const lpgCO2 = lpg * 42;

    const total =
        carCO2 +
        publicCO2 +
        flightCO2 +
        electricityCO2 +
        lpgCO2;

    document.getElementById("results").style.display = "block";

    const ctx = document.getElementById("impactChart").getContext("2d");

    if (impactChart) impactChart.destroy();

    impactChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Car", "Public Transport", "Flights", "Electricity", "Cooking"],
            datasets: [{
                data: [
                    carCO2,
                    publicCO2,
                    flightCO2,
                    electricityCO2,
                    lpgCO2
                ]
            }]
        },
        options: {
            responsive: true
        }
    });

    let level = "";
    if (total < 2000) level = "Low Impact 🟢";
    else if (total < 5000) level = "Moderate Impact 🟡";
    else level = "High Impact 🔴";

    document.getElementById("analysisText").innerText =
        "Total Annual CO₂ Emissions: " + total.toFixed(2) + " kg\n\n" +
        "Impact Level: " + level + "\n\n" +
        "Recommendations:\n" +
        "• Reduce car travel\n" +
        "• Use renewable electricity\n" +
        "• Limit flight travel\n" +
        "• Improve home energy efficiency";
}
