const { fetchAllPatients, submitAssessment } = require('./apiClient');
const { processPatients } = require('./riskScoring');

// Main execution
async function main() {
  try {
    const patients = await fetchAllPatients();
    
    if (patients.length === 0) {
      console.error('No patients fetched. Exiting.');
      return;
    }
    
    const results = processPatients(patients);
    await submitAssessment(results);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchAllPatients,
  submitAssessment,
  processPatients
};
