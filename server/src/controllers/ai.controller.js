const Report = require('../models/Report');
const { generateText } = require('../services/ai.service');
const logger = require('../utils/logger');

const VALID_CATEGORIES = [
  'Illegal Dumping', 'Blocked Drainage', 'Oil Spill',
  'Air Pollution', 'Water Pollution', 'Flooding', 'Deforestation', 'Other'
];

const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const CATEGORY_KEYWORDS = [
  { name: 'Illegal Dumping', keywords: ['dump', 'waste', 'trash', 'garbage', 'refuse', 'rubbish', 'litter', 'debris', 'landfill'] },
  { name: 'Blocked Drainage', keywords: ['drain', 'drainage', 'canal', 'gutter', 'blocked', 'clog', 'silt', 'flood'] },
  { name: 'Oil Spill', keywords: ['oil', 'spill', 'petroleum', 'fuel', 'diesel', 'petrol', 'grease', 'slick'] },
  { name: 'Air Pollution', keywords: ['smoke', 'fume', 'smog', 'dust', 'emission', 'exhaust', 'gas', 'burn'] },
  { name: 'Water Pollution', keywords: ['sewage', 'runoff', 'stream', 'river', 'pond', 'chemical', 'toxic', 'wastewater'] },
  { name: 'Flooding', keywords: ['flood', 'flooding', 'submerge', 'water rising', 'overflow', 'storm', 'rainwater'] },
  { name: 'Deforestation', keywords: ['tree', 'forest', 'logging', 'deforest', 'clearing', 'wood', 'timber', 'vegetation'] },
  { name: 'Other', keywords: [] },
];

const SEVERITY_KEYWORDS = [
  { name: 'Critical', keywords: ['emergency', 'disaster', 'hazardous', 'collapse', 'immediate', 'urgent', 'life-threatening', 'explosion', 'fire'] },
  { name: 'High', keywords: ['severe', 'dangerous', 'major', 'critical condition', 'toxic', 'chemical', 'heavy'] },
  { name: 'Medium', keywords: ['moderate', 'concern', 'blockage', 'damage', 'overflow', 'leak'] },
  { name: 'Low', keywords: ['minor', 'small', 'slight', 'little', 'minimal'] },
];

const ORGANIZATIONS = [
  { name: 'Local Waste Management Authority', keywords: ['dump', 'waste', 'trash', 'garbage', 'refuse', 'rubbish', 'litter', 'landfill'] },
  { name: 'Water Resources & Drainage Agency', keywords: ['drain', 'drainage', 'flood', 'canal', 'gutter', 'sewage', 'runoff', 'stream', 'river'] },
  { name: 'Environmental Protection Agency (EPA)', keywords: ['oil', 'spill', 'pollution', 'chemical', 'toxic', 'hazardous', 'smoke', 'fume', 'emission'] },
  { name: 'Public Health & Sanitation Department', keywords: ['health', 'sanitation', 'disease', 'vermin', 'rat', 'mosquito', 'wastewater'] },
  { name: 'Roads & Infrastructure Authority', keywords: ['road', 'hazard', 'pothole', 'manhole', 'sidewalk', 'pavement', 'street'] },
  { name: 'Parks & Forestry Commission', keywords: ['tree', 'deforestation', 'logging', 'park', 'forest', 'wood', 'timber', 'clearing'] },
];

function keywordMatch(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function countKeywordMatches(text, items) {
  const lower = text.toLowerCase();
  return items.map(item => ({
    ...item,
    score: item.keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0),
  }));
}

function localAnalysis(report) {
  const text = (report.title + ' ' + report.description + ' ' + (report.location || '')).toLowerCase();

  // Category
  const categoryScores = countKeywordMatches(text, CATEGORY_KEYWORDS);
  categoryScores.sort((a, b) => b.score - a.score);
  const suggestedCategory = categoryScores[0]?.score > 0 ? categoryScores[0].name : report.category;

  // Severity
  const severityScores = countKeywordMatches(text, SEVERITY_KEYWORDS);
  severityScores.sort((a, b) => b.score - a.score);
  const suggestedSeverity = severityScores[0]?.score > 0 ? severityScores[0].name : 'Medium';

  // Organization
  const orgScores = countKeywordMatches(text, ORGANIZATIONS);
  orgScores.sort((a, b) => b.score - a.score);
  const suggestedOrg = orgScores[0]?.score > 0 ? orgScores[0].name : 'Local Government Authority';

  // Summary
  const sentences = report.description.match(/[^.!?]+[.!?]+/g);
  let summary = (report.title.endsWith('.') ? report.title : report.title + '.').trim();
  if (sentences && sentences.length > 0) {
    const first = sentences[0].trim();
    if (first.length > 10) summary = first;
  }
  if (summary.length > 200) summary = summary.substring(0, 197) + '...';

  return { category: suggestedCategory, severity: suggestedSeverity, org: suggestedOrg, summary };
}

/**
 * Analyze a single report using Gemini AI (with local fallback)
 * POST /api/reports/:id/analyze
 */
exports.analyzeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let analysis;

    try {
      const prompt = `You are an environmental report analyst. Analyze this report and return ONLY valid JSON:

Report Data:
Title: "${report.title}"
Description: "${report.description}"
Location: "${report.location}"
User-selected Category: "${report.category}"

Respond with this exact JSON structure (no markdown, no code fences):
{
  "category": "one of: Illegal Dumping, Blocked Drainage, Oil Spill, Air Pollution, Water Pollution, Flooding, Deforestation, Other",
  "summary": "one concise sentence summarizing the issue",
  "severity": "one of: Low, Medium, High, Critical",
  "suggestedOrganization": "name of the most appropriate agency to handle this"
}`;

      const raw = await generateText(prompt);
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
      }

      analysis = {
        category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : report.category,
        severity: VALID_SEVERITIES.includes(parsed.severity) ? parsed.severity : report.priority,
        org: parsed.suggestedOrganization || '',
        summary: parsed.summary || '',
      };
      logger.info('Gemini AI analysis succeeded');
    } catch (aiError) {
      logger.warn('Gemini AI unavailable, using local analysis:', aiError.message);
      analysis = localAnalysis(report);
    }

    report.aiCategory = analysis.category;
    report.aiSummary = analysis.summary;
    report.aiSeverity = analysis.severity;
    report.aiSuggestedOrg = analysis.org;
    report.aiAnalyzed = true;
    await report.save();

    const duplicates = await findDuplicates(report);
    if (duplicates.length > 0) {
      report.aiDuplicateOf = duplicates[0]._id;
      await report.save();
    }

    const populated = await Report.findById(report._id)
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'fullName email role')
      .populate('aiDuplicateOf', 'title location createdAt');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('AI analysis error:', error);
    return res.status(500).json({ success: false, message: 'AI analysis failed' });
  }
};

/**
 * Find potential duplicate reports
 * GET /api/reports/:id/find-duplicates
 */
exports.findDuplicates = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const duplicates = await findDuplicates(report);
    return res.status(200).json(duplicates);
  } catch (error) {
    logger.error('Find duplicates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to find duplicates' });
  }
};

async function findDuplicates(report) {
  const candidates = await Report.find({
    _id: { $ne: report._id },
    category: report.aiCategory || report.category,
    createdAt: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  }).select('title description location createdAt');

  const reportWords = new Set((report.title + ' ' + report.description).toLowerCase().split(/\s+/).filter(Boolean));

  return candidates
    .map((candidate) => {
      const candidateWords = new Set((candidate.title + ' ' + candidate.description).toLowerCase().split(/\s+/).filter(Boolean));
      const intersection = new Set([...reportWords].filter((w) => candidateWords.has(w)));
      const union = new Set([...reportWords, ...candidateWords]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;
      return { report: candidate, similarity };
    })
    .filter((item) => item.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .map((item) => item.report);
}

/**
 * Get AI analysis result for a report
 * GET /api/reports/:id/analysis
 */
exports.getAnalysis = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('aiDuplicateOf', 'title location createdAt');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json({
      aiAnalyzed: report.aiAnalyzed,
      aiCategory: report.aiCategory,
      aiSummary: report.aiSummary,
      aiSeverity: report.aiSeverity,
      aiDuplicateOf: report.aiDuplicateOf || null,
      aiSuggestedOrg: report.aiSuggestedOrg,
    });
  } catch (error) {
    logger.error('Get analysis error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get analysis' });
  }
};
