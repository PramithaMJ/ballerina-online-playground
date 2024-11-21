// JavaScript for the Enhanced Online Compiler
document.getElementById('runButton').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value;
    const outputElement = document.getElementById('output');
    
    outputElement.textContent = 'Running your code... Please wait.';

    try {
        const response = await fetch('http://localhost:3000/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (response.ok) {
            outputElement.textContent = result.output || 'Code executed successfully!';
        } else {
            outputElement.textContent = `Error: ${result.error || 'Something went wrong!'}`;
        }
    } catch (error) {
        outputElement.textContent = `Request failed: ${error.message}`;
    }
});

document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('codeInput').value = '';
    document.getElementById('output').textContent = '// Your output will appear here';
});
