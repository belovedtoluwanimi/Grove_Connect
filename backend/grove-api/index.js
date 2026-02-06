require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
// IMPORT VALIDATION CONTROLLER
const { validateCourse } = require('./controllers/validation');

const app = express();
const port = process.env.PORT || 5000; // Use environment port for Render

// 1. CONFIGURATION
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json({ limit: '50mb' })); // Increase limit for large JSON payload
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. SUPABASE CLIENT
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use SERVICE ROLE key for backend access
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. MULTER CONFIGURATION (The "Dual Strategy")

// A. Image Uploader (Strict & Light)
// Used for: Avatars, Course Thumbnails
const uploadImage = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for this action.'));
    }
  }
});

// B. Video/Content Uploader (Heavy Duty)
// Used for: Course Videos, Resources
// Note: 500MB in memory is risky on small servers. If Render crashes, reduce this or switch to stream uploads.
const uploadVideo = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB Max
  fileFilter: (req, file, cb) => {
    // Accept pretty much anything here, but primarily video
    cb(null, true);
  }
});

// C. The Switcher Middleware
// Decides which uploader to use based on the ?type= query param from frontend
const uploadHandler = (req, res, next) => {
  const type = req.query.type; // 'image' or 'video'

  if (type === 'image') {
    return uploadImage.single('file')(req, res, next);
  } else {
    // Default to heavy uploader if type is 'video' or missing
    return uploadVideo.single('file')(req, res, next);
  }
};

// --- ROUTE 1: UNIVERSAL UPLOAD API ---
app.post('/api/upload', uploadHandler, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected by filter' });
    }

    // 1. Sanitize Filename (Remove spaces/weird chars)
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    // 2. Determine Folder (images/ or videos/)
    // This keeps your storage bucket organized
    const folder = req.query.type === 'image' ? 'images' : 'videos';
    const filePath = `${folder}/${fileName}`;

    console.log(`Uploading ${file.mimetype} to ${filePath} (${file.size} bytes)...`);

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('course-content')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        duplex: 'half' // Critical setting for Node 18+ environments like Render
      });

    if (error) throw error;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('course-content')
      .getPublicUrl(filePath);

    res.json({ url: publicUrl });

  } catch (error) {
    console.error('Upload Logic Error:', error);
    // Handle Multer size errors specifically
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large for this upload type.' });
    }
    res.status(500).json({ error: error.message || 'Server upload failed' });
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
    // (Ensure your validation.js file exists and exports this function)
    const { isValid, score, flags } = await validateCourse(req.body, instructor_id);

    // 3. REJECT IF INVALID (Unless in Dev Mode override)
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
          description: subtitle + "\n" + description, // Combine for simpler storage if needed
          price: price === 'Free' ? 0 : parseFloat(price),
          category,
          
          // ALGORITHM FIELDS
          status: 'Review',  // Must pass human review to become 'Active'
          admin_flags: flags, // Store warnings for the admin dashboard
          quality_score: score, // Store the automated score

          thumbnail_url: thumbnailUrl,
          video_url: promoVideoUrl,
          curriculum_data: curriculum, // Ensure column is JSONB in Supabase
          objectives_data: objectives, // Ensure column is JSONB or Text[]
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

// Start Server
app.listen(port, () => {
  console.log(`Grove Connect API running on port ${port}`);
});