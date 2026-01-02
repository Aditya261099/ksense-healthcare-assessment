const axios = require('axios');

const BASE_URL = 'https://assessment.ksensetech.com/api';
const API_KEY = 'ak_efd1271ed6b24b7bc5c3ef616edf23053353605cfd5dbf1a';

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes API request with retry logic for 500/502/503 errors and rate limiting
 */
async function makeRequest(endpoint, options = {}, maxRetries = 3) {
  const config = {
    ...options,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  let attempt = 1;
  let rateLimitAttempts = 0;
  const maxRateLimitRetries = 8; // More retries specifically for rate limits
  
  while (attempt <= maxRetries || (rateLimitAttempts > 0 && rateLimitAttempts < maxRateLimitRetries)) {
    try {
      const response = await axios({
        url: `${BASE_URL}${endpoint}`,
        ...config
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      
      // Handle rate limiting (429) - keep retrying with longer delays (separate counter)
      if (status === 429) {
        rateLimitAttempts++;
        if (rateLimitAttempts <= maxRateLimitRetries) {
          console.log(`Rate limited. Waiting before retry (rate limit attempt ${rateLimitAttempts}/${maxRateLimitRetries})...`);
          await delay(3000 * rateLimitAttempts); // Longer delay for rate limits
          continue; // Don't increment attempt for rate limits
        } else {
          console.error(`Rate limited. Max rate limit retries (${maxRateLimitRetries}) reached.`);
          throw error;
        }
      }
      
      // Reset rate limit counter on non-rate-limit errors
      rateLimitAttempts = 0;
      
      // Handle server errors (500/502/503) - retry these
      if (status === 500 || status === 502 || status === 503) {
        if (attempt < maxRetries) {
          console.log(`Server error ${status}. Retrying (attempt ${attempt}/${maxRetries})...`);
          await delay(1000 * attempt);
          attempt++;
          continue;
        } else {
          console.error(`Server error ${status} after ${maxRetries} attempts`);
          throw error;
        }
      }
      
      // Other errors - log and throw
      if (attempt >= maxRetries) {
        console.error(`Request failed after ${maxRetries} attempts`);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Response:', error.response.data);
        } else {
          console.error('Error:', error.message);
        }
        throw error;
      }
      
      // For non-retryable errors, throw immediately
      if (status && status !== 429 && status !== 500 && status !== 502 && status !== 503) {
        throw error;
      }
      
      attempt++; // Increment attempt for other retryable errors
    }
  }
  
  // Should not reach here, but just in case
  throw new Error(`Request failed after ${maxRetries} attempts`);
}

/**
 * Fetches all patients using pagination
 */
async function fetchAllPatients() {
  console.log('Fetching patient data...\n');
  
  let allPatients = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      console.log(`Fetching page ${page}...`);
      
      const data = await makeRequest(`/patients?page=${page}&limit=5`);
      
      // Handle case where makeRequest returns undefined (after failed retries)
      if (!data) {
        console.error(`Failed to fetch page ${page} after retries. Continuing to next page...`);
        page++;
        await delay(1000); // Longer delay before trying next page
        continue;
      }
      
      // Try different possible response structures
      let patients = null;
      if (data && data.data && Array.isArray(data.data)) {
        patients = data.data;
      } else if (data && data.patients && Array.isArray(data.patients)) {
        patients = data.patients;
      } else if (data && Array.isArray(data)) {
        patients = data;
      }
      
      if (patients && patients.length > 0) {
        allPatients = allPatients.concat(patients);
        console.log(`Page ${page}: Got ${patients.length} patients (Total: ${allPatients.length})`);
        
        // Check for pagination - continue if we got a full page
        hasMore = patients.length >= 5;
        page++;
        
        // Small delay to avoid rate limiting
        await delay(300);
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      // Continue to next page instead of stopping completely
      page++;
      await delay(1000);
      if (page > 15) { // Safety limit
        hasMore = false;
      }
    }
  }
  
  console.log(`\nTotal patients: ${allPatients.length}\n`);
  return allPatients;
}

/**
 * Submits assessment results
 */
async function submitAssessment(results) {
  console.log('Submitting results...\n');
  
  try {
    const response = await makeRequest('/submit-assessment', {
      method: 'POST',
      data: results
    });
    
    console.log('Submission successful!\n');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Submission failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  fetchAllPatients,
  submitAssessment
};

