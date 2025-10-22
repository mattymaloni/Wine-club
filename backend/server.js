const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

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
              text: "Identify this wine from the image. You MUST provide ALL fields in this exact JSON format:\n\n{\n  \"name\": \"Wine Name\",\n  \"varietal\": \"Grape Varietal\",\n  \"region\": \"Wine Region\",\n  \"vintage\": \"Year\",\n  \"notes\": \"Brief tasting notes\",\n  \"flavorProfile\": {\n    \"potency\": 3,\n    \"acidity\": 4,\n    \"sweetness\": 2,\n    \"tannins\": 3,\n    \"fruitiness\": 4\n  }\n}\n\nThe flavorProfile field is REQUIRED. Rate each characteristic on a scale of 1-5:\n- potency: intensity/boldness (1=light, 5=bold)\n- acidity: tartness (1=low, 5=high)\n- sweetness: sugar level (1=dry, 5=sweet)\n- tannins: drying sensation (1=soft, 5=firm)\n- fruitiness: fruit flavor intensity (1=subtle, 5=fruit-forward)\n\nBase ratings on typical characteristics of this wine type. Respond ONLY with valid JSON, no markdown formatting."
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