const { createClient } = require('@supabase/supabase-js');
const stringSimilarity = require('string-similarity'); // Run: npm install string-similarity

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const validateCourse = async (courseData, instructorId) => {
  let score = 0;
  let flags = [];

  // --- 1. COMPLETENESS CHECK (Validity) ---
  if (courseData.curriculum.length >= 2) score += 20; // At least 2 sections
  else flags.push("Course too short (needs 2+ sections)");

  const lectureCount = courseData.curriculum.reduce((acc, sec) => acc + sec.lectures.length, 0);
  if (lectureCount >= 5) score += 20; // At least 5 lectures
  else flags.push("Not enough lectures (needs 5+)");

  if (courseData.thumbnailUrl && courseData.promoVideoUrl) score += 20;
  else flags.push("Missing visual assets");

  // --- 2. ORIGINALITY CHECK (Anti-Plagiarism) ---
  // Fetch existing titles to check for duplicates
  const { data: existingCourses } = await supabase
    .from('courses')
    .select('title, description')
    .neq('instructor_id', instructorId); // Don't check against self

  if (existingCourses && existingCourses.length > 0) {
    const titles = existingCourses.map(c => c.title);
    const match = stringSimilarity.findBestMatch(courseData.title, titles);
    
    if (match.bestMatch.rating > 0.8) {
      score -= 50; // Huge penalty for copying a title
      flags.push(`Potential Duplicate: Similar to "${match.bestMatch.target}"`);
    } else {
      score += 20; // Original title
    }
  }

  // --- 3. INSTRUCTOR CHECK (Authorship) ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, full_name')
    .eq('id', instructorId)
    .single();

  if (profile && profile.avatar_url && profile.full_name) {
    score += 20; // Completed profile = higher trust
  } else {
    flags.push("Instructor profile incomplete");
  }

  return { 
    isValid: score >= 60, // Threshold to pass to human review
    score, 
    flags 
  };
};

module.exports = { validateCourse };