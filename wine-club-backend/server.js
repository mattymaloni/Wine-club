const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ status: 'Wine Club API is running!' });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/analyze-wine', upload.single('image'), async (req, res) => {
  try {
    console.log('Received image upload');
    
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Calling OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify this wine from the image. Provide the information in this exact JSON format: {\"name\": \"Wine Name\", \"varietal\": \"Grape Varietal\", \"region\": \"Wine Region\", \"vintage\": \"Year\", \"notes\": \"Brief tasting notes\"}. Only respond with the JSON, nothing else."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    console.log('OpenAI Response:', response.choices[0].message.content);
    
    // Parse the JSON response
    const content = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(cleanContent);
    
    console.log('Parsed result:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Detailed Error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze wine',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});