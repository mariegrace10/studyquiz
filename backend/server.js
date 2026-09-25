const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
    res.json({
        message: "StudyQuiz backend is running!"
    });
});

app.post("/generate-quiz", async (req, res) => {
    try {
        const { text, quizType, questionCount } = req.body;

        if (!text || !quizType || !questionCount) {
            return res.status(400).json({
                error: "Missing text, quizType, or questionCount."
            });
        }

        const count = Number(questionCount);

        let prompt;

        if (quizType === "multiple-choice") {
            prompt = `
You are generating a study quiz from the provided study material.

Create exactly ${count} multiple-choice questions.

Rules:
- Use ONLY information found in the study material.
- Do not invent facts.
- Each question must have exactly 4 options.
- Only ONE option must be correct.
- Make the incorrect options plausible.
- The answer must exactly match one of the options.
- Cover different parts of the study material when possible.
- Return ONLY valid JSON.

Required JSON format:
{
  "questions": [
    {
      "question": "Question here",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "answer": "Correct option"
    }
  ]
}

Study material:
${text}
`;
        } else if (quizType === "identification") {
            prompt = `
You are generating an identification quiz from the provided study material.

Create exactly ${count} identification questions.

Rules:
- Use ONLY information found in the study material.
- Do not invent facts.
- Questions should ask for a specific person, term, concept, place, date, process, or other identifiable answer found in the material.
- Keep answers concise.
- Return ONLY valid JSON.

Required JSON format:
{
  "questions": [
    {
      "question": "Question here",
      "answer": "Correct answer"
    }
  ]
}

Study material:
${text}
`;
        } else {
            return res.status(400).json({
                error: "Unsupported quiz type."
            });
        }

        console.log(
            `Generating ${count} ${quizType} questions with Gemini...`
        );

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const result = JSON.parse(response.text);

        if (!result.questions || !Array.isArray(result.questions)) {
            throw new Error("Gemini returned an invalid quiz format.");
        }

        console.log(
            `Successfully generated ${result.questions.length} questions.`
        );

        res.json(result);

    } catch (error) {
        console.error("Quiz generation error:", error);

        res.status(500).json({
            error: "Failed to generate quiz.",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`StudyQuiz backend running on port ${PORT}`);
});