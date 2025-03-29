export const keywordCategories: Record<string, string> = {
    // ENT
    "runny nose": "Otolaryngology",
    "sore throat": "Otolaryngology",
    "cough": "Otolaryngology",
    "ear pain": "Otolaryngology",
    "nasal congestion": "Otolaryngology",
    "sinus": "Otolaryngology",
  
    // Pulmonology
    "shortness of breath": "Pulmonology",
    "wheezing": "Pulmonology",
    "asthma": "Pulmonology",
    "chest tightness": "Pulmonology",
    "lung pain": "Pulmonology",
    "trouble breathing": "Pulmonology",
  
    // Orthopedics
    "broken": "Orthopedics",
    "fracture": "Orthopedics",
    "sprain": "Orthopedics",
    "joint pain": "Orthopedics",
    "bone": "Orthopedics",
    "back pain": "Orthopedics",
  
    // Neurology
    "headache": "Neurology",
    "migraine": "Neurology",
    "dizzy": "Neurology",
    "numbness": "Neurology",
    "seizure": "Neurology",
    "tremor": "Neurology",
  
    // Cardiology
    "palpitations": "Cardiology",
    "chest pain": "Cardiology",
    "high blood pressure": "Cardiology",
    "arrhythmia": "Cardiology",
    "tightness in chest": "Cardiology",
  
    // Gastroenterology
    "stomach pain": "Gastroenterology",
    "diarrhea": "Gastroenterology",
    "constipation": "Gastroenterology",
    "nausea": "Gastroenterology",
  
    // Dermatology
    "rash": "Dermatology",
    "itching": "Dermatology",
    "acne": "Dermatology",
    "eczema": "Dermatology",
  
    // Urology
    "urination pain": "Urology",
    "frequent urination": "Urology",
    "blood in urine": "Urology",
  };
  
  export function categorizeQuestion(prompt: string): string {
    const lower = prompt.toLowerCase();
    const matchedCategories = new Set<string>();
  
    for (const keyword in keywordCategories) {
      if (lower.includes(keyword)) {
        matchedCategories.add(keywordCategories[keyword]);
      }
    }
  
    if (matchedCategories.size === 1) {
      return [...matchedCategories][0]; // single category
    }
  
    return "General"; // none or multiple matched
  }