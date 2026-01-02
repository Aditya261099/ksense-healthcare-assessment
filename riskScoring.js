/**
 * Parse blood pressure string (e.g., "120/80")
 * Handles invalid cases like "150/", "/90", "INVALID", etc.
 */
function parseBP(bp) {
  if (!bp || typeof bp !== 'string') return null;
  
  // Check for invalid patterns like "INVALID", "N/A", etc.
  if (bp.toUpperCase().match(/^(INVALID|N\/A|NULL|UNDEFINED|ERROR)$/)) {
    return null;
  }
  
  const match = bp.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  
  // Validate both values are numbers
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  
  return { systolic, diastolic };
}

/**
 * Calculate blood pressure risk (1-4 points)
 * If systolic and diastolic fall into different categories, use the higher risk stage
 */
function getBPRisk(bp) {
  const parsed = parseBP(bp);
  if (!parsed) return { score: 0, hasIssue: true };
  
  const { systolic, diastolic } = parsed;
  
  // Check combined conditions first (as defined in requirements)
  // Normal: Systolic <120 AND Diastolic <80
  if (systolic < 120 && diastolic < 80) {
    return { score: 1, hasIssue: false };
  }
  
  // Elevated: Systolic 120-129 AND Diastolic <80
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return { score: 2, hasIssue: false };
  }
  
  // Stage 1: Systolic 130-139 OR Diastolic 80-89
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return { score: 3, hasIssue: false };
  }
  
  // Stage 2: Systolic ≥140 OR Diastolic ≥90
  if (systolic >= 140 || diastolic >= 90) {
    return { score: 4, hasIssue: false };
  }
  
  // Fallback (shouldn't reach here with valid numbers)
  return { score: 1, hasIssue: false };
}

/**
 * Calculate temperature risk (0-2 points)
 * Invalid/Missing: Non-numeric, null, undefined, empty, or strings like "TEMP_ERROR"
 */
function getTempRisk(temp) {
  // Check for invalid string values
  if (temp && typeof temp === 'string') {
    const upper = temp.toUpperCase();
    if (upper.match(/^(INVALID|ERROR|TEMP_ERROR|N\/A|NULL|UNDEFINED)$/)) {
      return { score: 0, hasIssue: true };
    }
  }
  
  const tempNum = parseFloat(temp);
  if (temp === null || temp === undefined || temp === '' || isNaN(tempNum)) {
    return { score: 0, hasIssue: true };
  }
  
  if (tempNum <= 99.5) return { score: 0, hasIssue: false };
  if (tempNum >= 99.6 && tempNum <= 100.9) return { score: 1, hasIssue: false };
  if (tempNum >= 101.0) return { score: 2, hasIssue: false };
  
  return { score: 0, hasIssue: false };
}

/**
 * Calculate blood pressure risk (0-3 points)
 * If systolic and diastolic fall into different categories, use the higher risk stage
 */
function getBPRisk(bp) {
  const parsed = parseBP(bp);
  if (!parsed) {
    return { score: 0, hasIssue: true };
  }
  
  const { systolic, diastolic } = parsed;
  
  // Stage 2: Systolic ≥140 OR Diastolic ≥90 → 3 points
  if (systolic >= 140 || diastolic >= 90) {
    return { score: 3, hasIssue: false };
  }
  
  // Stage 1: Systolic 130-139 OR Diastolic 80-89 → 2 points
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return { score: 2, hasIssue: false };
  }
  
  // Elevated: Systolic 120-129 AND Diastolic <80 → 1 point
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return { score: 1, hasIssue: false };
  }
  
  // Normal: Systolic <120 AND Diastolic <80 → 0 points
  if (systolic < 120 && diastolic < 80) {
    return { score: 0, hasIssue: false };
  }
  
  // Fallback
  return { score: 0, hasIssue: false };
}

/**
 * Calculate age risk (0-2 points)
 * Invalid/Missing: null, undefined, empty, or non-numeric strings
 */
function getAgeRisk(age) {
  // Check for invalid string values
  if (age && typeof age === 'string') {
    const upper = age.toUpperCase();
    if (upper.match(/UNKNOWN|INVALID|ERROR|NA|NULL|UNDEFINED/)) {
      return { score: 0, hasIssue: true };
    }
    // Check if it's a non-numeric string like "fifty-three"
    if (!/^\d+$/.test(age.trim())) {
      return { score: 0, hasIssue: true };
    }
  }
  
  if (age === null || age === undefined || age === '') {
    return { score: 0, hasIssue: true };
  }
  
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum <= 0) {
    return { score: 0, hasIssue: true };
  }
  
  // Over 65: >65 years → 2 points
  if (ageNum > 65) {
    return { score: 2, hasIssue: false };
  }
  
  // 40-65: inclusive → 1 point
  if (ageNum >= 40 && ageNum <= 65) {
    return { score: 1, hasIssue: false };
  }
  
  // Under 40: <40 years → 0 points
  if (ageNum < 40) {
    return { score: 0, hasIssue: false };
  }
  
  return { score: 0, hasIssue: false };
}

/**
 * Process patients and generate alert lists
 */
function processPatients(patients) {
  console.log('Processing patients and calculating risk scores...\n');
  
  const highRiskPatients = [];
  const feverPatients = [];
  const dataQualityIssues = [];
  
  patients.forEach(patient => {
    if (!patient || !patient.patient_id) return;
    
    const bpRisk = getBPRisk(patient.blood_pressure);
    const tempRisk = getTempRisk(patient.temperature);
    const ageRisk = getAgeRisk(patient.age);
    
    const totalScore = bpRisk.score + tempRisk.score + ageRisk.score;
    
    // High risk: score ≥ 4
    if (totalScore >= 4) {
      highRiskPatients.push(patient.patient_id);
    }
    
    // Fever: temp ≥ 99.6°F
    const temp = parseFloat(patient.temperature);
    if (!isNaN(temp) && temp >= 99.6) {
      feverPatients.push(patient.patient_id);
    }
    
    // Data quality issues
    if (bpRisk.hasIssue || tempRisk.hasIssue || ageRisk.hasIssue) {
      dataQualityIssues.push(patient.patient_id);
    }
  });
  
  console.log(`High Risk Patients (score ≥ 4): ${highRiskPatients.length}`);
  console.log(`Fever Patients (temp ≥ 99.6°F): ${feverPatients.length}`);
  console.log(`Data Quality Issues: ${dataQualityIssues.length}\n`);
  
  return {
    high_risk_patients: highRiskPatients,
    fever_patients: feverPatients,
    data_quality_issues: dataQualityIssues
  };
}

module.exports = {
  processPatients
};

