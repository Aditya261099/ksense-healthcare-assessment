# Healthcare API Risk Scoring Assessment

A Node.js application that analyzes patient data from a healthcare API and calculates risk scores based on blood pressure, temperature, and age.

## 🎯 Assessment Overview

This project was completed as part of the Ksense Technical Assessment. The goal was to:
- Integrate with a healthcare API with realistic challenges (rate limiting, intermittent failures, inconsistent data)
- Calculate patient risk scores using medical guidelines
- Identify high-risk patients, fever cases, and data quality issues

## 🏗️ Project Structure

```
ksense-healthcare-assessment/
├── apiClient.js           # API communication with retry logic and error handling
├── riskScoring.js         # Risk calculation algorithms
├── index.js               # Main application entry point
├── package.json           # Project dependencies
├── package-lock.json      # Locked dependency versions
├── .gitignore             # Git ignore rules
└── README.md              # Documentation
```
## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ksense-healthcare-assessment.git
cd ksense-healthcare-assessment

# Install dependencies
npm install

# Run the application
npm start
```

## 📋 Features
1. Robust API Client (apiClient.js)
Handles Real-World API Challenges:

Retry Logic: Automatically retries failed requests (500/502/503 errors)

Rate Limiting: Implements exponential backoff for 429 errors

Pagination: Fetches all patient records across multiple pages

Error Recovery: Gracefully handles network failures

```javascript
// Example: Retry logic with exponential backoff
if (status === 429) {
  await delay(3000 * rateLimitAttempts);
}
```

2. Risk Scoring Algorithm (riskScoring.js)
Three-Factor Risk Assessment:
```
Blood Pressure Risk (0-3 points)
Normal (Systolic <120 AND Diastolic <80): 0 points

Elevated (Systolic 120-129 AND Diastolic <80): 1 point

Stage 1 (Systolic 130-139 OR Diastolic 80-89): 2 points

Stage 2 (Systolic ≥140 OR Diastolic ≥90): 3 points
```
```
Temperature Risk (0-2 points)
Normal (≤99.5°F): 0 points

Low Fever (99.6-100.9°F): 1 point

High Fever (≥101.0°F): 2 points
```
```
Age Risk (0-2 points)
Under 40: 0 points

40-65 (inclusive): 1 point

Over 65: 2 points

Total Risk Score = BP Score + Temp Score + Age Score (0-7 possible)
```
3. Data Quality Handling
Validates and tracks invalid data:

Missing or malformed blood pressure (e.g., "150/", "/90", "INVALID")

Non-numeric temperature values (e.g., "TEMP_ERROR", null)

Invalid age values (e.g., "unknown", non-numeric strings)

4. Alert Generation
Three categories of alerts:

High-Risk Patients: Total risk score ≥ 4

Fever Patients: Temperature ≥ 99.6°F

Data Quality Issues: Any invalid/missing data

 Technical Highlights
Error Handling Strategy
```
// Separate counters for rate limits vs. regular retries
let attempt = 1;
let rateLimitAttempts = 0;

// More aggressive retry strategy for rate limits
while (attempt <= maxRetries || rateLimitAttempts < maxRateLimitRetries) {
  // ... retry logic
}
```
Data Validation
```
// Robust blood pressure parsing
function parseBP(bp) {
  if (!bp || typeof bp !== 'string') return null;
  const match = bp.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  return { systolic: parseInt(match), diastolic: parseInt(match) };[1][2]
}
```
👨‍💻 Author
Aditya Sai

Assessment: Ksense Healthcare API Challenge

Date: January 2026
