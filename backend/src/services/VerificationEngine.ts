import Tesseract from 'tesseract.js';
import stringSimilarity from 'string-similarity';

export async function verifyDocuments(
  scCertPath: string,
  incomeCertPath: string,
  expectedName: string
) {
  let scText = '';
  let incomeText = '';
  let overallConfidence = 0;
  
  try {
    const scResult = await Tesseract.recognize(scCertPath, 'eng');
    scText = scResult.data.text;
    
    const incomeResult = await Tesseract.recognize(incomeCertPath, 'eng');
    incomeText = incomeResult.data.text;
    
    // Check name fuzzy matching
    const nameMatchSC = stringSimilarity.compareTwoStrings(expectedName.toLowerCase(), scText.toLowerCase());
    const nameMatchIncome = stringSimilarity.compareTwoStrings(expectedName.toLowerCase(), incomeText.toLowerCase());
    
    const name_match = nameMatchSC > 0.4 || nameMatchIncome > 0.4;
    
    // Check income <= 500000. Look for numbers
    const numbers = incomeText.match(/\d+(,\d+)*(\.\d+)?/g);
    let income_valid = false;
    if (numbers) {
      for (const numStr of numbers) {
        const val = parseFloat(numStr.replace(/,/g, ''));
        if (val > 0 && val <= 500000) {
          income_valid = true;
          break;
        }
      }
    }
    
    // Issuing authority valid (mock check)
    const authKeywords = ['tehsildar', 'sdo', 'adm', 'magistrate', 'officer', 'government', 'revenue'];
    const issuing_authority_valid = authKeywords.some(kw => scText.toLowerCase().includes(kw) || incomeText.toLowerCase().includes(kw));

    overallConfidence = (name_match ? 0.4 : 0) + (income_valid ? 0.4 : 0) + (issuing_authority_valid ? 0.2 : 0);
    
    return {
      name_match,
      income_valid,
      issuing_authority_valid,
      face_match: true, // Face matching requires heavy ML deps, mocking for prototype
      document_quality: true,
      overall_confidence: overallConfidence,
      status: overallConfidence >= 0.8 ? 'verified' : 'pending_manual_review'
    };
  } catch (error) {
    console.error('OCR Verification error:', error);
    return {
      name_match: false,
      income_valid: false,
      issuing_authority_valid: false,
      face_match: false,
      document_quality: false,
      overall_confidence: 0,
      status: 'pending_manual_review'
    };
  }
}
