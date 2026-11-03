// server/services/geminiService.js
const { getSettings } = require('./storageService');

/**
 * Intelligent fallback analyzer when Gemini API key is not configured or fails
 */
function analyzeWithHeuristicEngine(resumeText, jobRole, originalFilename = '') {
  const text = resumeText.toLowerCase();
  
  // Extract Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = resumeText.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : 'Not found in resume';

  // Extract Phone
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}/;
  const phoneMatch = resumeText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : 'Not found';

  // Extract Name (first 2-4 non-empty lines, looking for capitalized title)
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let name = 'Candidate';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line.includes('@') && !line.includes('http') && !line.match(/\d{5,}/) && line.length < 50 && line.length > 2) {
      name = line.replace(/^(resume|curriculum vitae|cv)\s*:?/i, '').trim();
      if (name.length > 2) break;
    }
  }
  if (name === 'Candidate' && originalFilename) {
    name = originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/(resume|cv)/gi, '').trim() || 'Candidate';
  }

  // Estimate experience
  let expYears = 0;
  const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i);
  if (expMatch) {
    expYears = parseInt(expMatch[1], 10);
  } else {
    // Count year ranges like 2019 - 2023 or 2021 - Present
    const yearMatches = text.match(/\b(20\d{2}|19\d{2})\s*(?:-|to)\s*(20\d{2}|present|current)\b/gi);
    if (yearMatches && yearMatches.length > 0) {
      expYears = Math.min(15, yearMatches.length * 2);
    }
  }

  const matchedSkills = [];
  const missingSkills = [];
  let totalWeightedScore = 0;

  const criteriaBreakdown = (jobRole.criteria || []).map(criterion => {
    const cName = criterion.name.toLowerCase();
    const cWords = cName.split(/[\s,&/]+/).filter(w => w.length > 2);
    
    // Check evidence
    let found = false;
    let evidence = '';
    
    // Direct or partial match
    if (text.includes(cName)) {
      found = true;
      evidence = `Direct mention of "${criterion.name}" found in resume.`;
    } else {
      const matchedWords = cWords.filter(w => text.includes(w));
      if (matchedWords.length >= Math.ceil(cWords.length * 0.6)) {
        found = true;
        evidence = `Contextual terms identified: ${matchedWords.join(', ')}.`;
      }
    }

    let score = 0;
    if (found) {
      score = 90;
      matchedSkills.push(criterion.name);
    } else {
      score = 15; // minimal baseline
      missingSkills.push(criterion.name);
      evidence = `No direct evidence or relevant keywords found for "${criterion.name}".`;
    }

    // Special logic for Education & Experience
    if (criterion.category === 'Education' || cName.includes('degree') || cName.includes('education')) {
      const hasDegree = /b\.?e|b\.?tech|m\.?tech|mca|bca|b\.?sc|m\.?sc|bachelor|master|degree|university|college/i.test(text);
      if (hasDegree) {
        score = 95;
        evidence = 'Candidate possesses recognized academic degree/qualifications.';
        if (!matchedSkills.includes(criterion.name)) matchedSkills.push(criterion.name);
      } else {
        score = 40;
        evidence = 'Formal educational details not prominently stated.';
      }
    }

    const weight = Number(criterion.weight || 0);
    const weightedScore = Math.round((score * weight) / 100);
    totalWeightedScore += weightedScore;

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      category: criterion.category,
      weight: weight,
      score: score,
      weightedScore: weightedScore,
      evidenceFound: evidence,
      evaluationNotes: found 
        ? `Meets requirements for ${criterion.name} based on resume experience and skills sections.`
        : `Lacks explicit demonstration of ${criterion.name}.`
    };
  });

  const overallMatchPercentage = Math.min(100, Math.max(0, totalWeightedScore));
  const settings = getSettings();
  const strongThresh = settings.thresholds?.strongMatch || 80;
  const potentialThresh = settings.thresholds?.potentialMatch || 60;

  let recommendation = 'Low Match';
  if (overallMatchPercentage >= strongThresh) recommendation = 'Strong Match';
  else if (overallMatchPercentage >= potentialThresh) recommendation = 'Potential Match';

  return {
    candidateName: name,
    candidateEmail: email,
    candidatePhone: phone,
    candidateLocation: 'Not specified',
    totalExperienceYears: expYears,
    educationDetails: ['Extracted from resume credentials'],
    experienceDetails: [`Estimated ${expYears} years relevant industry/project experience`],
    matchedSkills,
    missingSkills,
    educationMatch: 'Academic criteria evaluated based on resume profile',
    experienceMatch: expYears >= (jobRole.minExperienceYears || 0) 
      ? `Meets or exceeds minimum ${jobRole.minExperienceYears || 0} years requirement` 
      : `Has ~${expYears} years, target role suggests ${jobRole.minExperienceYears || 0} years`,
    criteriaBreakdown,
    overallMatchPercentage,
    recommendation,
    evaluationSummary: `Candidate demonstrates competencies in ${matchedSkills.slice(0, 3).join(', ') || 'general engineering'}. Overall alignment with ${jobRole.title} is ${overallMatchPercentage}% based on defined criteria weights.`,
    analyzedBy: 'Built-in Intelligent Parser (Configure Gemini API key in Settings for enhanced LLM deep evaluation)',
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Call Google Gemini API
 */
async function analyzeWithGemini(resumeText, jobRole, originalFilename = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.log('No GEMINI_API_KEY detected in environment. Using intelligent heuristic analysis.');
    return analyzeWithHeuristicEngine(resumeText, jobRole, originalFilename);
  }

  const criteriaListText = (jobRole.criteria || []).map((c, idx) => 
    `${idx + 1}. [ID: ${c.id}] ${c.name} (Category: ${c.category}, Weight: ${c.weight}%) - ${c.description || 'No additional notes'}`
  ).join('\n');

  const systemInstruction = `You are DP Hire, an advanced AI Recruitment and Talent Assessment Assistant for DataPage.
Your objective is to meticulously evaluate the provided candidate resume text against the specific criteria and weightages established by HR for the role: "${jobRole.title}".

CRITICAL INSTRUCTIONS:
1. Grounding & Evidence: NEVER assume a candidate possesses a skill unless there is clear supporting evidence (projects, companies, tools, degree, or bullet points) in the resume.
2. Transparent Scoring: For EACH criterion listed below, assign an honest score from 0 to 100 based strictly on candidate evidence. Explain why that score was awarded and quote the evidence found.
3. Weighted Calculation:
   - For each criterion: weightedScore = (score * weight) / 100.
   - The overallMatchPercentage MUST be the exact sum of all weightedScores (rounded to the nearest integer, 0-100).
4. Output Format: You MUST reply with ONLY a valid, parseable JSON object without markdown fences or additional conversational text.

JOB ROLE SPECIFICATIONS:
Role Title: ${jobRole.title}
Department: ${jobRole.department || 'Not specified'}
Minimum Experience Required: ${jobRole.minExperienceYears || 0} years
CRITERIA & WEIGHTAGES:
${criteriaListText}

REQUIRED JSON SCHEMA:
{
  "candidateName": "Full Name",
  "candidateEmail": "email@example.com",
  "candidatePhone": "+91 98765 43210 or Not found",
  "candidateLocation": "City, Country or Not specified",
  "totalExperienceYears": 3.5,
  "educationDetails": ["Degree, College, Year"],
  "experienceDetails": ["Role at Company (Duration) - Brief summary"],
  "projects": ["Project Name - Description"],
  "certifications": ["Certification Name"],
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Skill 3", "Skill 4"],
  "educationMatch": "Brief evaluation of education against role requirements",
  "experienceMatch": "Brief evaluation of years & quality of experience",
  "criteriaBreakdown": [
    {
      "criterionId": "criterion id matching input",
      "criterionName": "Exact name of criterion",
      "category": "Required Skill | Preferred Skill | Education | Soft Skill",
      "weight": 30,
      "score": 85,
      "weightedScore": 25.5,
      "evidenceFound": "Exact quote or proof from resume",
      "evaluationNotes": "Clear transparent explanation of why this score was given"
    }
  ],
  "overallMatchPercentage": 82,
  "recommendation": "Strong Match | Potential Match | Low Match",
  "evaluationSummary": "Concise 2-3 sentence executive HR summary of candidate suitability, key strengths, and missing requirements."
}`;

  const prompt = `${systemInstruction}\n\nRESUME CONTENT TO ANALYZE (Filename: ${originalFilename}):\n${resumeText.slice(0, 15000)}`;

  try {
    // Try Gemini 2.5 Flash, then fallback to Gemini 1.5 Flash
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Gemini API ${model} HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawReply) {
          throw new Error('Empty response from Gemini API');
        }

        // Clean JSON
        const cleaned = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Calculate and verify overall match percentage
        let computedSum = 0;
        if (Array.isArray(parsed.criteriaBreakdown)) {
          parsed.criteriaBreakdown = parsed.criteriaBreakdown.map(item => {
            const weight = Number(item.weight || 0);
            const score = Number(item.score || 0);
            const weighted = Math.round((score * weight) / 100);
            computedSum += weighted;
            return {
              ...item,
              weight,
              score,
              weightedScore: weighted
            };
          });
        }

        parsed.overallMatchPercentage = Math.min(100, Math.max(0, computedSum || parsed.overallMatchPercentage || 0));
        parsed.analyzedBy = `Google Gemini (${model})`;
        parsed.analyzedAt = new Date().toISOString();

        return parsed;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} attempt failed:`, err.message);
      }
    }

    throw lastError || new Error('All Gemini model attempts failed');
  } catch (err) {
    console.error('Error invoking Gemini API:', err.message);
    console.log('Falling back to intelligent heuristic analysis...');
    const fallbackResult = analyzeWithHeuristicEngine(resumeText, jobRole, originalFilename);
    fallbackResult.warning = `Gemini API call failed (${err.message}). Analyzed with built-in heuristic engine.`;
    return fallbackResult;
  }
}

module.exports = {
  analyzeWithGemini,
  analyzeWithHeuristicEngine
};
