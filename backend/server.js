const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));


// ============================================
// TEST ROUTE
// ============================================

app.get("/", function (req, res) {

    res.json({
        message: "StudyQuiz local AI backend is running!"
    });

});


// ============================================
// GENERATE QUIZ
// ============================================

app.post("/generate-quiz", async function (req, res) {

    try {

        const {
            text,
            quizType,
            questionCount
        } = req.body;


        // ========================================
        // VALIDATION
        // ========================================

        if (!text || text.trim() === "") {

            return res.status(400).json({
                error: "No PDF text was provided."
            });

        }

        if (!quizType) {

            return res.status(400).json({
                error: "Quiz type is required."
            });

        }

        if (!questionCount) {

            return res.status(400).json({
                error: "Question count is required."
            });

        }


        // ========================================
        // QUIZ TYPE
        // ========================================

        let quizInstructions = "";

        if (quizType === "multiple-choice") {

            quizInstructions = `
Create ${questionCount} multiple-choice questions.

Rules:

- Every question must be SHORT and CLEAR.
- Test understanding of the study material.
- Do not simply copy an entire sentence from the PDF.
- Create exactly FOUR choices.
- There must be exactly ONE correct answer.
- Incorrect choices should be plausible.
- Do not invent information.
- Every answer must be supported by the study material.
- Avoid duplicate questions.
- Try to cover different topics from the material.
`;

        } else if (quizType === "identification") {

            quizInstructions = `
Create ${questionCount} identification questions.

Rules:

- Every question must be SHORT and CLEAR.
- Ask about an important term, concept, person, process, definition, or fact.
- Test understanding of the study material.
- Do not simply copy an entire sentence from the PDF.
- Give one concise correct answer.
- Do not invent information.
- Every answer must be supported by the study material.
- Avoid duplicate questions.
- Try to cover different topics from the material.
`;

        } else {

            return res.status(400).json({
                error: "Invalid quiz type."
            });

        }


        // ========================================
        // PROMPT
        // ========================================

        const prompt = `

You are an expert educational quiz generator.

Your task is to create a student quiz using ONLY
the study material provided below.

Do NOT use outside knowledge.

Do NOT invent facts.

Do NOT create information that is not supported
by the study material.

${quizInstructions}

Return ONLY valid JSON.

For MULTIPLE CHOICE, use exactly this format:

{
    "questions": [
        {
            "question": "Short question here",
            "options": [
                "Choice A",
                "Choice B",
                "Choice C",
                "Choice D"
            ],
            "answer": "Correct choice"
        }
    ]
}

For IDENTIFICATION, use exactly this format:

{
    "questions": [
        {
            "question": "Short question here",
            "answer": "Correct answer"
        }
    ]
}

STUDY MATERIAL:

----------------------------

${text}

----------------------------
`;


        // ========================================
        // SEND TO OLLAMA
        // ========================================

        const response = await fetch(
            "http://localhost:11434/api/generate",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    model: "llama3.2:3b",

                    prompt: prompt,

                    stream: false,

                    format: "json"

                })

            }
        );


        // ========================================
        // CHECK OLLAMA RESPONSE
        // ========================================

        if (!response.ok) {

            throw new Error(
                `Ollama returned status ${response.status}`
            );

        }


        const data = await response.json();


        // ========================================
        // PARSE AI RESPONSE
        // ========================================

        const result =
            JSON.parse(data.response);


        // ========================================
        // SEND QUIZ TO WEBSITE
        // ========================================

        res.json(result);


    } catch (error) {

        console.error("AI ERROR:");
        console.error(error);

        res.status(500).json({

            error:
                error.message ||
                "Something went wrong while generating the quiz."

        });

    }

});


// ============================================
// START SERVER
// ============================================

app.listen(3000, function () {

    console.log(
        "StudyQuiz local AI backend is running at http://localhost:3000"
    );

});