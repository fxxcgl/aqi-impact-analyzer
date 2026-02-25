function analyzeImpact() {
    const input = document.getElementById("userInput").value;

    if (input.trim() === "") {
        alert("Please describe your daily activities.");
        return;
    }

    document.getElementById("results").style.display = "block";
    document.getElementById("analysisText").innerText =
        "Analyzing your activities... AI extraction logic coming next.";
}