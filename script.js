document.addEventListener("DOMContentLoaded", function () {

    console.log("StudyQuiz JavaScript loaded.");

    // ============================================
    // CHECK PDF.JS
    // ============================================

    if (typeof pdfjsLib === "undefined") {
        alert(
            "PDF reader could not be loaded.\n\n" +
            "Please make sure you are connected to the internet and refresh the page."
        );
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


    // ============================================
    // ELEMENTS
    // ============================================

    const pdfFile = document.getElementById("pdfFile");
    const fileName = document.getElementById("fileName");
    const continueButton = document.getElementById("continueButton");

    const uploadSection = document.getElementById("uploadSection");
    const textPreview = document.getElementById("textPreview");
    const extractedTextPreview =
        document.getElementById("extractedTextPreview");

    const continueToQuizSettings =
        document.getElementById("continueToQuizSettings");

    const quizSettings =
        document.getElementById("quizSettings");

    const generateButton =
        document.getElementById("generateButton");

    const quizSection =
        document.getElementById("quizSection");

    const resultsSection =
        document.getElementById("resultsSection");

    const questionNumber =
        document.getElementById("questionNumber");

    const quizTypeDisplay =
        document.getElementById("quizTypeDisplay");

    const questionText =
        document.getElementById("questionText");

    const answerArea =
        document.getElementById("answerArea");

    const nextButton =
        document.getElementById("nextButton");

    const progressBar =
        document.getElementById("progressBar");

    const score =
        document.getElementById("score");

    const totalScore =
        document.getElementById("totalScore");

    const percentage =
        document.getElementById("percentage");


    // ============================================
    // VARIABLES
    // ============================================

    let extractedText = "";

    let selectedQuizType =
        "multiple-choice";

    let selectedQuestionCount = 5;

    let questions = [];

    let currentQuestion = 0;

    let answers = [];

    let answerChecked = false;


    // ============================================
    // PDF UPLOAD
    // ============================================

    pdfFile.addEventListener("change", async function () {

        const file = pdfFile.files[0];

        if (!file) {
            return;
        }

        fileName.textContent =
            "Selected: " + file.name;

        continueButton.disabled = true;

        continueButton.textContent =
            "Reading PDF...";

        try {

            const isPDF =
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf");

            if (!isPDF) {
                throw new Error(
                    "Please select a PDF file."
                );
            }

            extractedText =
                await readPDF(file);

            if (
                !extractedText ||
                extractedText.trim().length === 0
            ) {

                throw new Error(
                    "No readable text was found in this PDF."
                );

            }

            extractedTextPreview.textContent =
                extractedText;

            continueButton.disabled = false;

            continueButton.textContent =
                "Continue →";

            console.log(
                "PDF successfully read:",
                extractedText.length,
                "characters"
            );

        } catch (error) {

            console.error(error);

            extractedText = "";

            continueButton.disabled = true;

            continueButton.textContent =
                "Continue →";

            alert(
                "Unable to read the PDF.\n\n" +
                error.message
            );

        }

    });


    // ============================================
    // READ PDF
    // ============================================

    async function readPDF(file) {

        const arrayBuffer =
            await file.arrayBuffer();

        const pdf =
            await pdfjsLib.getDocument({
                data: arrayBuffer
            }).promise;

        let text = "";

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(pageNumber);

            const content =
                await page.getTextContent();

            const pageText =
                content.items
                    .map(item => item.str)
                    .join(" ");

            text +=
                pageText + "\n\n";

        }

        return text
            .replace(/\s+/g, " ")
            .trim();

    }


    // ============================================
    // CONTINUE FROM UPLOAD
    // ============================================

    continueButton.addEventListener(
        "click",
        function () {

            if (!extractedText) {

                alert(
                    "Please select a PDF first."
                );

                return;
            }

            uploadSection.classList.add("hidden");

            textPreview.classList.remove("hidden");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    // ============================================
    // CONTINUE TO SETTINGS
    // ============================================

    continueToQuizSettings.addEventListener(
        "click",
        function () {

            textPreview.classList.add("hidden");

            quizSettings.classList.remove("hidden");

        }
    );


    // ============================================
    // QUIZ TYPE
    // ============================================

    document
        .querySelectorAll(".quiz-type")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(".quiz-type")
                        .forEach(function (item) {

                            item.classList.remove(
                                "active"
                            );

                        });

                    button.classList.add("active");

                    selectedQuizType =
                        button.dataset.type;

                }
            );

        });


    // ============================================
    // QUESTION COUNT
    // ============================================

    document
        .querySelectorAll(".count-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(".count-button")
                        .forEach(function (item) {

                            item.classList.remove(
                                "active"
                            );

                        });

                    button.classList.add("active");

                    selectedQuestionCount =
                        Number(
                            button.dataset.count
                        );

                }
            );

        });


    // ============================================
    // GENERATE QUIZ WITH LOCAL AI
    // ============================================

    generateButton.addEventListener(
        "click",
        async function () {

            if (!extractedText) {

                alert(
                    "Please upload a PDF first."
                );

                return;
            }

            generateButton.disabled = true;

            generateButton.textContent =
                "AI is creating your quiz...";

            try {

                questions =
                    await generateQuizWithAI(
                        extractedText,
                        selectedQuizType,
                        selectedQuestionCount
                    );


                // ====================================
                // VALIDATE QUESTIONS
                // ====================================

                if (
                    !Array.isArray(questions) ||
                    questions.length === 0
                ) {

                    throw new Error(
                        "The AI did not generate any questions."
                    );

                }


                // ====================================
                // PREPARE QUIZ
                // ====================================

                currentQuestion = 0;

                answers = [];

                answerChecked = false;


                quizSettings.classList.add(
                    "hidden"
                );

                quizSection.classList.remove(
                    "hidden"
                );


                displayQuestion();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });


            } catch (error) {

                console.error(
                    "Quiz generation error:",
                    error
                );

                alert(
                    "Unable to generate the quiz.\n\n" +
                    error.message
                );

            }


            generateButton.disabled = false;

            generateButton.textContent =
                "Generate Quiz →";

        }
    );


    // ============================================
    // GENERATE QUIZ USING OLLAMA
    // ============================================

    async function generateQuizWithAI(
        text,
        type,
        count
    ) {

        console.log(
            "Sending study material to local AI..."
        );


        const response =
            await fetch(
                "http://localhost:3000/generate-quiz",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        text: text,

                        quizType: type,

                        questionCount: count

                    })

                }
            );


        if (!response.ok) {

            let errorMessage =
                "The local AI server returned an error.";

            try {

                const errorData =
                    await response.json();

                if (errorData.error) {
                    errorMessage =
                        errorData.error;
                }

            } catch (error) {
                // Ignore JSON parsing error
            }

            throw new Error(
                errorMessage
            );

        }


        const data =
            await response.json();


        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            throw new Error(
                "The AI returned an invalid quiz format."
            );

        }


        console.log(
            "AI generated",
            data.questions.length,
            "questions."
        );


        return data.questions;

    }


    // ============================================
    // DISPLAY QUESTION
    // ============================================

    function displayQuestion() {

        const question =
            questions[currentQuestion];

        if (!question) {
            return;
        }

        answerChecked = false;


        questionNumber.textContent =
            `Question ${
                currentQuestion + 1
            } of ${
                questions.length
            }`;


        quizTypeDisplay.textContent =
            selectedQuizType ===
            "multiple-choice"
                ? "Multiple Choice"
                : "Identification";


        questionText.textContent =
            question.question;


        answerArea.innerHTML = "";


        // ========================================
        // MULTIPLE CHOICE
        // ========================================

        if (
            selectedQuizType ===
            "multiple-choice"
        ) {

            if (
                !Array.isArray(
                    question.options
                )
            ) {

                console.error(
                    "Invalid multiple-choice question:",
                    question
                );

                return;

            }


            question.options.forEach(
                function (option) {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type = "button";

                    button.className =
                        "answer-option";

                    button.textContent =
                        option;


                    button.addEventListener(
                        "click",
                        function () {

                            if (
                                answerChecked
                            ) {

                                return;

                            }


                            document
                                .querySelectorAll(
                                    ".answer-option"
                                )
                                .forEach(
                                    function (item) {

                                        item.classList
                                            .remove(
                                                "selected"
                                            );

                                    }
                                );


                            button.classList.add(
                                "selected"
                            );


                            answers[
                                currentQuestion
                            ] = option;

                        }
                    );


                    answerArea.appendChild(
                        button
                    );

                }
            );


        } else {

            // ====================================
            // IDENTIFICATION
            // ====================================

            const input =
                document.createElement(
                    "input"
                );

            input.type = "text";

            input.className =
                "identification-input";

            input.placeholder =
                "Type your answer here...";


            input.addEventListener(
                "input",
                function () {

                    if (
                        !answerChecked
                    ) {

                        answers[
                            currentQuestion
                        ] =
                            input.value.trim();

                    }

                }
            );


            answerArea.appendChild(
                input
            );

        }


        nextButton.textContent =
            "Check Answer";


        // ========================================
        // PROGRESS
        // ========================================

        const progress =
            (
                (currentQuestion + 1) /
                questions.length
            ) * 100;


        progressBar.style.width =
            progress + "%";

    }


    // ============================================
    // CHECK ANSWER / NEXT
    // ============================================

    nextButton.addEventListener(
        "click",
        function () {

            const question =
                questions[currentQuestion];


            // ========================================
            // FIRST CLICK
            // ========================================

            if (!answerChecked) {

                let userAnswer;


                if (
                    selectedQuizType ===
                    "multiple-choice"
                ) {

                    userAnswer =
                        answers[currentQuestion];


                    if (!userAnswer) {

                        alert(
                            "Please select an answer."
                        );

                        return;

                    }


                } else {

                    const input =
                        document.querySelector(
                            ".identification-input"
                        );


                    if (
                        !input ||
                        !input.value.trim()
                    ) {

                        alert(
                            "Please enter your answer."
                        );

                        return;

                    }


                    userAnswer =
                        input.value.trim();


                    answers[
                        currentQuestion
                    ] = userAnswer;

                }


                const isCorrect =
                    normalize(userAnswer) ===
                    normalize(question.answer);


                showAnswerFeedback(
                    question,
                    userAnswer,
                    isCorrect
                );


                answerChecked = true;


                // ====================================
                // LOCK ANSWERS
                // ====================================

                document
                    .querySelectorAll(
                        ".answer-option"
                    )
                    .forEach(
                        function (button) {

                            button.disabled =
                                true;

                        }
                    );


                const input =
                    document.querySelector(
                        ".identification-input"
                    );


                if (input) {
                    input.disabled = true;
                }


                // ====================================
                // CHANGE BUTTON
                // ====================================

                if (
                    currentQuestion ===
                    questions.length - 1
                ) {

                    nextButton.textContent =
                        "Finish Quiz ✓";

                } else {

                    nextButton.textContent =
                        "Next →";

                }


                return;

            }


            // ========================================
            // SECOND CLICK
            // ========================================

            if (
                currentQuestion <
                questions.length - 1
            ) {

                currentQuestion++;

                displayQuestion();

            } else {

                showResults();

            }

        }
    );


    // ============================================
    // SHOW FEEDBACK
    // ============================================

    function showAnswerFeedback(
        question,
        userAnswer,
        isCorrect
    ) {

        const feedback =
            document.createElement(
                "div"
            );


        feedback.className =
            isCorrect
                ? "answer-feedback correct"
                : "answer-feedback incorrect";


        if (isCorrect) {

            feedback.innerHTML = `
                <div class="feedback-title">
                    ✓ Correct!
                </div>

                <div class="feedback-answer">
                    Correct answer:
                    <strong>
                        ${escapeHTML(
                            question.answer
                        )}
                    </strong>
                </div>
            `;

        } else {

            feedback.innerHTML = `
                <div class="feedback-title">
                    ✕ Incorrect
                </div>

                <div class="feedback-user">
                    Your answer:
                    <strong>
                        ${escapeHTML(
                            userAnswer
                        )}
                    </strong>
                </div>

                <div class="feedback-answer">
                    Correct answer:
                    <strong>
                        ${escapeHTML(
                            question.answer
                        )}
                    </strong>
                </div>
            `;

        }


        answerArea.appendChild(
            feedback
        );

    }


    // ============================================
    // ESCAPE HTML
    // ============================================

    function escapeHTML(text) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            text;

        return div.innerHTML;

    }


    // ============================================
    // RESULTS
    // ============================================

    function showResults() {

        let correct = 0;


        questions.forEach(
            function (question, index) {

                const userAnswer =
                    answers[index];


                if (!userAnswer) {
                    return;
                }


                if (
                    normalize(userAnswer) ===
                    normalize(question.answer)
                ) {

                    correct++;

                }

            }
        );


        const total =
            questions.length;


        const percent =
            Math.round(
                (correct / total) * 100
            );


        score.textContent =
            correct;

        totalScore.textContent =
            total;

        percentage.textContent =
            percent + "%";


        quizSection.classList.add(
            "hidden"
        );

        resultsSection.classList.remove(
            "hidden"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ============================================
    // NORMALIZE
    // ============================================

    function normalize(text) {

        return String(text)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ")
            .replace(
                /[.,!?;:]+$/,
                ""
            );

    }


    // ============================================
    // RESET / UPLOAD NEW PDF
    // ============================================

    function uploadNewPDF() {

        pdfFile.value = "";

        fileName.textContent =
            "No file selected";

        extractedText = "";

        extractedTextPreview.textContent =
            "";

        questions = [];

        answers = [];

        currentQuestion = 0;

        answerChecked = false;


        continueButton.disabled =
            true;

        continueButton.textContent =
            "Continue →";


        uploadSection.classList.remove(
            "hidden"
        );

        textPreview.classList.add(
            "hidden"
        );

        quizSettings.classList.add(
            "hidden"
        );

        quizSection.classList.add(
            "hidden"
        );

        resultsSection.classList.add(
            "hidden"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // ============================================
    // UPLOAD NEW FILE BUTTONS
    // ============================================

    document
        .getElementById(
            "uploadNewFileFromPreview"
        )
        .addEventListener(
            "click",
            uploadNewPDF
        );


    document
        .getElementById(
            "uploadNewFileFromSettings"
        )
        .addEventListener(
            "click",
            uploadNewPDF
        );


    document
        .getElementById(
            "uploadNewFileFromQuiz"
        )
        .addEventListener(
            "click",
            uploadNewPDF
        );


    document
        .getElementById(
            "uploadNewFileFromResults"
        )
        .addEventListener(
            "click",
            uploadNewPDF
        );


    // ============================================
    // RESTART QUIZ
    // ============================================

    document
        .getElementById(
            "restartButton"
        )
        .addEventListener(
            "click",
            function () {

                currentQuestion = 0;

                answers = [];

                answerChecked = false;


                quizSection.classList.remove(
                    "hidden"
                );

                resultsSection.classList.add(
                    "hidden"
                );


                displayQuestion();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


    console.log(
        "StudyQuiz is ready."
    );

});
