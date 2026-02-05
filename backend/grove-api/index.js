require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
// IMPORT VALIDATION CONTROLLER
const { validateCourse } = require('./controllers/validation');

const app = express();
const port = 5000;

// 1. CONFIGURATION
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON

// 2. SUPABASE CLIENT
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use SERVICE ROLE key for backend access
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. MULTER SETUP (File Handling)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // Limit uploads to 500MB
});

// --- ROUTE 1: UPLOAD FILES (Thumbnail/Video) ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const filePath = `public/${fileName}`;

    const { data, error } = await supabase
      .storage
      .from('course-content')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        duplex: 'half' // Critical for Node 18+
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase
      .storage
      .from('course-content')
      .getPublicUrl(filePath);

    res.json({ url: publicUrl });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 2: PUBLISH COURSE (Save to DB with Validation) ---
app.post('/api/courses', async (req, res) => {
  try {
    // 1. Destructure all data
    const { 
      title, subtitle, description, category, 
      level, price, objectives, curriculum, 
      thumbnailUrl, promoVideoUrl, instructor_id 
    } = req.body;

    // 2. RUN VALIDATION ALGORITHM
    const { isValid, score, flags } = await validateCourse(req.body, instructor_id);

    // 3. REJECT IF INVALID
    if (!isValid) {
      return res.status(400).json({ 
        error: "Automated Quality Check Failed", 
        details: flags 
      });
    }

    // 4. INSERT INTO DATABASE (Status = 'Review')
    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          instructor_id,
          title,
          description: subtitle + "\n" + description,
          price: price === 'Free' ? 0 : parseFloat(price),
          category,
          
          // ALGORITHM FIELDS
          status: 'Review',  // Must pass human review to become 'Active'
          admin_flags: flags, // Store warnings for the admin
          quality_score: score, // Store the automated score

          thumbnail_url: thumbnailUrl,
          video_url: promoVideoUrl,
          curriculum_data: curriculum, 
          objectives_data: objectives, 
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Course submitted for review', course: data[0] });

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Grove Connect API running on port ${port}`);
});