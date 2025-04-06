import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProblemDetailPage.css';

const SERVERURL = 'https://codementor-b244.onrender.com'

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('// Write your code here');
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [confirmingSolution, setConfirmingSolution] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${SERVERURL}/api/problems/${problemId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setProblem(data.problem);
          setIsSolved(data.problem.isSolved || false);
          if (data.problem.starterCode) {
            setCode(data.problem.starterCode);
          }
        } else {
          setError(data.message || 'Failed to fetch problem details');
        }
      } catch (error) {
        console.error('Error fetching problem details:', error);
        setError('An error occurred while fetching problem details');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemDetails();
  }, [problemId]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    // Update starter code based on selected language
    if (problem && problem.starterCodeMap && problem.starterCodeMap[newLanguage]) {
      setCode(problem.starterCodeMap[newLanguage]);
    } else {
      // Default starter code for different languages with proper test case handling
      const defaultStarters = {
        javascript: `// Write your JavaScript code here
// Each test case will be provided as input through stdin
// Read the input and process each test case

// Example for handling string reversal
// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  // Process each line of input
  const input = line.trim();
  
  // Your solution logic goes here
  const result = input.split('').reverse().join('');
  
  // Print output to stdout
  console.log(result);
});`,

        python: `# Write your Python code here
# Each test case will be provided as input through stdin
# Read the input and process each test case

# Example for string reversal
import sys

# Process each line from stdin
for line in sys.stdin:
    input_str = line.strip()
    
    # Your solution logic goes here
    result = input_str[::-1]
    
    # Print output to stdout
    print(result)`,

        cpp: `// Write your C++ code here
// Each test case will be provided as input through stdin
// Read the input and process each test case

#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string input;
    
    // Process each line from stdin
    while (getline(cin, input)) {
        // Your solution logic goes here
        reverse(input.begin(), input.end());
        
        // Print output to stdout
        cout << input << endl;
    }
    
    return 0;
}`,

        java: `// Write your Java code here
// Each test case will be provided as input through stdin
// Read the input and process each test case

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Process each line from stdin
        while (scanner.hasNextLine()) {
            String input = scanner.nextLine();
            
            // Your solution logic goes here
            StringBuilder sb = new StringBuilder(input);
            String result = sb.reverse().toString();
            
            // Print output to stdout
            System.out.println(result);
        }
        
        scanner.close();
    }
}`
      };
      
      setCode(defaultStarters[newLanguage] || defaultStarters.javascript);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
      setCode(newCode);
      
      // Set cursor position after indentation
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      }, 0);
    }
    
    // Handle enter key for auto-indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const { selectionStart } = e.target;
      const currentLine = code.substring(0, selectionStart).split('\n').pop();
      const indentation = currentLine.match(/^\s*/)[0]; // Get leading whitespace
      
      // Add extra indentation after opening brackets
      let extraIndent = '';
      if (currentLine.trim().endsWith('{') || 
          currentLine.trim().endsWith('(') || 
          currentLine.trim().endsWith('[')) {
        extraIndent = '  ';
      }
      
      const newCode = code.substring(0, selectionStart) + '\n' + indentation + extraIndent + code.substring(selectionStart);
      setCode(newCode);
      
      // Set cursor position after indentation
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + indentation.length + extraIndent.length;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    // Prevent submission if already solved
    if (isSolved) {
      setOutput("You have already solved this problem! Move on to the next challenge.");
      return;
    }
    
    setSubmitting(true);
    setOutput('');
    
    try {
      const response = await fetch(`${SERVERURL}/api/problems/${problemId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          language,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update solved status if submission was successful and all tests passed
        if (data.submission.isSolved) {
          setIsSolved(true);
        }
        
        // Format the submission results for display
        const testResults = data.submission.testResults.map((test, index) => 
          `Test ${index + 1}: ${test.passed ? 'Passed' : 'Failed'}\n` +
          `Input: ${test.input}\n` +
          `Expected: ${test.expected}\n` +
          `Actual: ${test.actual}\n` +
          (test.error ? `Error: ${test.error}\n` : '') +
          '------------------------'
        ).join('\n');
        
        // Format AI evaluation if available
        let aiEvaluation = '';
        if (data.submission.evaluation) {
          const evaluation = data.submission.evaluation;
          aiEvaluation = `\n\nAI Evaluation:\n` + 
                        `Score: ${evaluation.score}/10\n` + 
                        `Feedback: ${evaluation.feedback}\n` + 
                        `Time Complexity: ${evaluation.timeComplexity}\n` + 
                        `Space Complexity: ${evaluation.spaceComplexity}\n` + 
                        `Improvements:\n${evaluation.improvements.map(imp => `- ${imp}`).join('\n')}`;
        }
        
        setOutput(`Status: ${data.submission.status}\n\n${testResults}${aiEvaluation}`);
      } else {
        if (data.alreadySolved) {
          setIsSolved(true);
          setOutput("You have already solved this problem! Move on to the next challenge.");
        } else {
          setOutput(`Error: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunTests = async () => {
    setSubmitting(true);
    setOutput('');
    
    try {
      const response = await fetch(`${SERVERURL}/api/problems/${problemId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code,
          language, // Now using the selected language
        }),
        credentials: 'include', // Include cookies for authentication
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOutput(
          `Output:\n${data.result.output}\n\n` +
          `Status: ${data.result.status}\n` +
          `Execution Time: ${data.result.time}s\n` +
          `Memory Used: ${data.result.memory} KB`
        );
      } else {
        setOutput(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHints = () => {
    setShowHints(!showHints);
  };

  const toggleSolutionConfirmation = () => {
    setConfirmingSolution(!confirmingSolution);
  };
  
  const viewSolution = () => {
    setShowSolution(true);
    setConfirmingSolution(false);
  };

  if (loading) {
    return <div className="problem-loading">Loading problem...</div>;
  }

  if (error) {
    return <div className="problem-error">Error: {error}</div>;
  }

  if (!problem) {
    return <div className="problem-error">Problem not found</div>;
  }

  return (
    <div className="problem-detail-container">
      <div className="problem-header">
        <h1>{problem.title}</h1>
        <div className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
          {problem.difficulty}
        </div>
        {isSolved && (
          <div className="solved-badge">
            ✅ Solved
          </div>
        )}
      </div>
      
      <div className="problem-description">
        <p>{problem.description}</p>
        
        <h2>Examples:</h2>
        {problem.examples && problem.examples.map((example, index) => (
          <div key={index} className="example">
            <div className="example-title">Example {index + 1}:</div>
            <div className="example-content">
              <div><strong>Input:</strong> {example.input}</div>
              <div><strong>Output:</strong> {example.output}</div>
              {example.explanation && (
                <div><strong>Explanation:</strong> {example.explanation}</div>
              )}
            </div>
          </div>
        ))}
        
        <h2>Constraints:</h2>
        <ul className="constraints-list">
          {problem.constraints && (
            Array.isArray(problem.constraints) 
              ? problem.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))
              : (<li>{problem.constraints}</li>)
          )}
        </ul>
        
        {/* Hints Section */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="hints-section">
            <div className="hints-header" onClick={toggleHints}>
              <h2>Hints {showHints ? '▼' : '▶'}</h2>
              <button className="toggle-button">{showHints ? 'Hide' : 'Show'}</button>
            </div>
            
            {showHints && (
              <div className="hints-content">
                {problem.hints.map((hint, index) => (
                  <div key={index} className="hint-item">
                    <div className="hint-number">Hint {index + 1}:</div>
                    <div className="hint-text">{hint}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Solution Section */}
        {problem.solution && (
          <div className="solution-section">
            <div className="solution-header" onClick={toggleSolutionConfirmation}>
              <h2>Solution {showSolution ? '▼' : '▶'}</h2>
              <button className="toggle-button">{showSolution ? 'Hide' : 'View'}</button>
            </div>
            
            {confirmingSolution && !showSolution && (
              <div className="solution-confirmation">
                <p>Are you sure you want to see the solution? Try solving the problem on your own first.</p>
                <div className="confirmation-buttons">
                  <button onClick={viewSolution} className="confirm-button">Yes, show me the solution</button>
                  <button onClick={toggleSolutionConfirmation} className="cancel-button">No, I'll keep trying</button>
                </div>
              </div>
            )}
            
            {showSolution && (
              <div className="solution-content">
                <pre className="solution-code">{problem.solution}</pre>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="code-editor-container">
        <div className="editor-header">
          <h2>Solution:</h2>
          <div className="language-selector">
            <label htmlFor="language-select">Language:</label>
            <select 
              id="language-select" 
              value={language} 
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>
        
        <div className="coding-instructions">
          <div className="instruction-panel">
            <h3>How to Process Test Cases:</h3>
            <ul>
              <li>Each test case will be provided to your code as a separate input through stdin.</li>
              <li>Your code should read each input, process it, and output the result to stdout.</li>
              <li>Avoid hardcoding responses. Process each input dynamically.</li>
              <li>For array inputs, parse them appropriately based on the input format.</li>
              <li>Make sure output format matches exactly what's expected in the problem description.</li>
            </ul>
          </div>
        </div>
        
        <div className="code-editor">
          <textarea
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            className="editor-textarea"
            spellCheck="false"
          />
        </div>
        
        <div className="editor-actions">
          <button 
            className="run-button"
            onClick={handleRunTests}
            disabled={submitting}
          >
            {submitting ? 'Running...' : 'Run Tests'}
          </button>
          <button
            className="submit-button"
            disabled={submitting || isSolved}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : isSolved ? 'Already Solved' : 'Submit Solution'}
          </button>
        </div>
        
        {isSolved && (
          <div className="solved-message">
            <p>🎉 Congratulations! You've successfully solved this problem.</p>
          </div>
        )}
        
        {output && (
          <div className="output-container">
            <h3>Output:</h3>
            <pre className="output">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetailPage;
