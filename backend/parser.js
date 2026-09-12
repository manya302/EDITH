const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

// ============================================================
// PATH CONFIGURATION
// ============================================================

const BASE_PATH = __dirname;

const RESUME_DIR = path.join(BASE_PATH, "Dummy Resumes");
const OUTPUT_DIR = path.join(BASE_PATH, "parsed_resumes");

const CATEGORIES = [
  "AI_Developer",
  "App_Developer",
  "Content_Creation",
  "Cyber_Security",
  "Data_Scientist",
  "Design",
  "Founders_Office",
  "HR",
  "IT_Support",
  "Marketing",
  "Python_Developer",
  "Sales",
  "SDE",
  "Social_Media_Intern",
  "Video_Editing",
  "Web_Developer"
];

// ============================================================
// SECTION HEADINGS
// ============================================================

const SECTION_PATTERNS = {
  skills: [
    "skills",
    "technical skills",
    "technical expertise",
    "core skills",
    "core competencies",
    "technologies",
    "technical proficiencies",
    "tools and technologies",
    "skills & technologies",
    "skills and technologies"
  ],

  projects: [
    "projects",
    "academic projects",
    "personal projects",
    "key projects",
    "relevant projects",
    "project experience"
  ],

  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "employment history",
    "internship",
    "internships",
    "work history"
  ],

  education: [
    "education",
    "academic background",
    "academic qualifications",
    "qualifications",
    "educational background"
  ]
};

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeLine(line) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeading(line) {
  return line
    .toLowerCase()
    .replace(/[:|•\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSectionHeading(line) {
  const normalized = normalizeHeading(line);

  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (patterns.includes(normalized)) {
      return section;
    }
  }

  return null;
}

// ============================================================
// PDF TEXT EXTRACTION
// ============================================================

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: buffer
  });

  const result = await parser.getText();

  return result.text || "";
}

// ============================================================
// SECTION DETECTION
// ============================================================

function detectSections(text) {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const sections = {
    skills: [],
    projects: [],
    experience: [],
    education: [],
    other: []
  };

  let currentSection = "other";

  for (const line of lines) {
    const detectedSection = isSectionHeading(line);

    if (detectedSection) {
      currentSection = detectedSection;
      continue;
    }

    sections[currentSection].push(line);
  }

  return sections;
}

// ============================================================
// SKILLS
// ============================================================

function extractSkills(lines) {
  if (!lines.length) return [];

  const text = lines.join(" ");

  // Split common resume skill separators.
  const rawSkills = text
    .split(/[,|•·;]/)
    .map(skill => skill.trim())
    .filter(Boolean);

  const skills = [];

  for (let skill of rawSkills) {
    skill = skill
      .replace(/^[-–—]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    // Avoid putting entire paragraphs into skills.
    if (skill.length > 80) continue;

    if (!skills.includes(skill)) {
      skills.push(skill);
    }
  }

  return skills;
}

// ============================================================
// PROJECTS
// ============================================================

function extractProjects(lines) {
  if (!lines.length) return [];

  const projects = [];

  let currentProject = null;

  for (const line of lines) {
    // Heuristic:
    // Short lines are likely project titles.
    // Longer lines are likely descriptions.
    if (line.length <= 100 && !/[.!?]$/.test(line)) {
      if (currentProject) {
        projects.push(currentProject);
      }

      currentProject = {
        title: line,
        text: ""
      };
    } else {
      if (!currentProject) {
        currentProject = {
          title: null,
          text: ""
        };
      }

      currentProject.text +=
        (currentProject.text ? " " : "") + line;
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects.filter(project => project.text || project.title);
}

// ============================================================
// EXPERIENCE
// ============================================================

function extractExperience(lines) {
  if (!lines.length) return [];

  const experience = [];

  let current = null;

  for (const line of lines) {
    // Look for common role/title indicators.
    const looksLikeRole =
      /\b(intern|developer|engineer|designer|analyst|manager|executive|specialist|consultant|associate|lead|trainee)\b/i.test(
        line
      );

    if (looksLikeRole && line.length < 120) {
      if (current) {
        experience.push(current);
      }

      current = {
        company: null,
        role: line,
        text: ""
      };
    } else {
      if (!current) {
        current = {
          company: null,
          role: null,
          text: ""
        };
      }

      current.text +=
        (current.text ? " " : "") + line;
    }
  }

  if (current) {
    experience.push(current);
  }

  return experience.filter(
    item => item.role || item.company || item.text
  );
}

// ============================================================
// EDUCATION
// ============================================================

function extractEducation(lines) {
  if (!lines.length) return [];

  const education = [];

  const degreePatterns =
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|B\.?Sc|M\.?Sc|BCA|MCA|MBA|BBA|Ph\.?D|Bachelor|Master|Diploma|Degree)\b/i;

  for (const line of lines) {
    if (!degreePatterns.test(line)) continue;

    let degree = line;
    let field = null;

    // Try to separate common "in" / "-" patterns.
    const match = line.match(
      /(.+?)\s+(?:in|of|-)\s+(.+)/i
    );

    if (match) {
      degree = match[1].trim();
      field = match[2].trim();
    }

    education.push({
      degree,
      field
    });
  }

  return education;
}

// ============================================================
// PARSING CONFIDENCE
// ============================================================

function calculateParsingConfidence(text, sections) {
  let score = 0;

  const textLength = text.trim().length;

  // Text extraction quality
  if (textLength > 3000) {
    score += 0.30;
  } else if (textLength > 1500) {
    score += 0.25;
  } else if (textLength > 700) {
    score += 0.18;
  } else if (textLength > 200) {
    score += 0.10;
  }

  // Section detection
  const detectedSections = [
    sections.skills.length > 0,
    sections.projects.length > 0,
    sections.experience.length > 0,
    sections.education.length > 0
  ].filter(Boolean).length;

  score += detectedSections * 0.15;

  // Small bonus if several sections were successfully extracted.
  if (detectedSections >= 3) {
    score += 0.10;
  }

  return Math.min(Number(score.toFixed(2)), 1.0);
}

// ============================================================
// CANDIDATE ID
// ============================================================

function generateCandidateId(category, filename, existingIds) {
  const baseName = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const baseId = `${category}_${baseName}`;

  // Deterministic ID based on category + filename.
  // This means rerunning the parser gives the same ID.
  return baseId;
}

// ============================================================
// PROCESS ONE RESUME
// ============================================================

async function processResume(filePath, category) {
  try {
    const filename = path.basename(filePath);

    console.log(`Processing: ${category}/${filename}`);

    const text = await extractPdfText(filePath);

    if (!text.trim()) {
      throw new Error("No extractable text found");
    }

    const sections = detectSections(text);

    const candidateId = generateCandidateId(
      category,
      filename
    );

    const resumeJson = {
      candidate_id: candidateId,

      skills: extractSkills(sections.skills),

      projects: extractProjects(sections.projects),

      experience: extractExperience(
        sections.experience
      ),

      education: extractEducation(
        sections.education
      ),

      parsing_confidence: calculateParsingConfidence(
        text,
        sections
      )
    };

    const outputCategoryDir = path.join(
      OUTPUT_DIR,
      category
    );

    fs.mkdirSync(outputCategoryDir, {
      recursive: true
    });

    const outputFilename =
      path.basename(
        filename,
        path.extname(filename)
      ) + ".json";

    const outputPath = path.join(
      outputCategoryDir,
      outputFilename
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(resumeJson, null, 2),
      "utf8"
    );

    console.log(`✓ Created: ${outputPath}`);

    return {
      success: true,
      outputPath
    };

  } catch (error) {
    console.error(
      `✗ Failed: ${filePath}`,
      error.message
    );

    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================
// FIND ALL PDF FILES
// ============================================================

function getPdfFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(
      currentDir,
      { withFileTypes: true }
    );

    for (const entry of entries) {
      const fullPath = path.join(
        currentDir,
        entry.name
      );

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".pdf")
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);

  return files;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("\n========================================");
  console.log(" Resume PDF → JSON Parser");
  console.log("========================================\n");

  console.log(`Base path:    ${BASE_PATH}`);
  console.log(`Resume path:  ${RESUME_DIR}`);
  console.log(`Output path:  ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(RESUME_DIR)) {
    console.error(
      `Resume directory does not exist:\n${RESUME_DIR}`
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true
  });

  let total = 0;
  let successful = 0;
  let failed = 0;

  for (const category of CATEGORIES) {
    const categoryPath = path.join(
      RESUME_DIR,
      category
    );

    if (!fs.existsSync(categoryPath)) {
      console.log(
        `Skipping missing category: ${category}`
      );
      continue;
    }

    const pdfFiles = getPdfFiles(categoryPath);

    console.log(
      `\n${category}: ${pdfFiles.length} PDF(s)`
    );

    for (const pdfFile of pdfFiles) {
      total++;

      const result = await processResume(
        pdfFile,
        category
      );

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
  }

  console.log("\n========================================");
  console.log(" Parsing Complete");
  console.log("========================================");
  console.log(`Total PDFs:       ${total}`);
  console.log(`Successfully parsed: ${successful}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log("========================================\n");
}

// Run only when executed directly.
if (require.main === module) {
  main();
}

module.exports = {
  processResume,
  extractPdfText,
  detectSections,
  extractSkills,
  extractProjects,
  extractExperience,
  extractEducation,
  calculateParsingConfidence
};