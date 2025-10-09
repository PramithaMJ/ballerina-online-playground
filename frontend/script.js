// JavaScript for the Ballerina Online Compiler
const API_URL = 'http://localhost:8081'; // Backend server URL

document.getElementById('runButton').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value;
    const outputElement = document.getElementById('output');
    const runButton = document.getElementById('runButton');
    
    // Validate input
    if (!code.trim()) {
        outputElement.textContent = 'Error: Please write some Ballerina code first!';
        return;
    }
    
    // Disable button and show loading state
    runButton.disabled = true;
    runButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    outputElement.textContent = 'Running your code... Please wait.';

    try {
        const response = await fetch(`${API_URL}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (response.ok) {
            if (result.error) {
                // Show error from execution
                outputElement.textContent = `Error:\n${result.error}\n\nOutput:\n${result.output || 'No output'}`;
                outputElement.style.color = '#ff6b6b';
            } else {
                // Show successful output
                outputElement.textContent = result.output || 'Code executed successfully with no output.';
                outputElement.style.color = '#51cf66';
            }
        } else {
            outputElement.textContent = `Server Error: ${result.error || 'Something went wrong!'}`;
            outputElement.style.color = '#ff6b6b';
        }
    } catch (error) {
        outputElement.textContent = `Connection Error: ${error.message}\n\nMake sure the backend server is running on ${API_URL}`;
        outputElement.style.color = '#ff6b6b';
    } finally {
        // Re-enable button
        runButton.disabled = false;
        runButton.innerHTML = '<i class="fas fa-play"></i> Run';
    }
});

document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('codeInput').value = '';
    const outputElement = document.getElementById('output');
    outputElement.textContent = '// Your output will appear here';
    outputElement.style.color = '#adb5bd';
});

// Add sample code on load
window.addEventListener('DOMContentLoaded', () => {
    const sampleCode = `import ballerina/io;

public function main() {
    io:println("Hello, Ballerina!");
}`;
    
    document.getElementById('codeInput').value = sampleCode;
});
