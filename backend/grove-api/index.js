require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

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
// We use memoryStorage to keep the file in RAM briefly before sending to Supabase
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // Limit uploads to 500MB
});

// --- ROUTE 1: UPLOAD FILES (Thumbnail/Video) ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Create a unique file path: public/timestamp-filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const filePath = `public/${fileName}`;

    // Upload to Supabase Storage bucket named 'course-content'
    const { data, error } = await supabase
      .storage
      .from('course-content')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        duplex: 'half'
      });

    if (error) throw error;

    // Get the Public URL
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

// --- ROUTE 2: PUBLISH COURSE (Save to DB) ---
app.post('/api/courses', async (req, res) => {
  try {
    const { 
      title, subtitle, description, category, 
      level, price, objectives, curriculum, 
      thumbnailUrl, promoVideoUrl, instructor_id 
    } = req.body;

    // Insert into 'courses' table
    // Note: We are storing 'curriculum' and 'objectives' as JSONB columns
    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          instructor_id,
          title,
          description: subtitle + "\n" + description, // Combining for simplicity
          price: price === 'Free' ? 0 : parseFloat(price),
          category,
          status: 'Review', // Default status
          thumbnail_url: thumbnailUrl,
          video_url: promoVideoUrl,
          curriculum_data: curriculum, // Ensure you add this column to Supabase (type: jsonb)
          objectives_data: objectives, // Ensure you add this column to Supabase (type: jsonb)
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Course created successfully', course: data[0] });

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Grove Connect API running on port ${port}`);
});