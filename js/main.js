'use strict'

const QUESTIONS_PER_PAGE = 25
const totalQuestions = questions.length
const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)

let currentPage = 0
let collectedAnswers = []
let userSquad = ''
let userCallsign = ''

const SPREADSHEET_ID = '1qLLdgnesl_SQIxFsaRMMPPyTApfo5OkvvSL7mdY1ffc'
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8lkNpXG8e_aofc5MlmaZu2qPqlrsEsQ8Gx14f0XCtrCntxt56n007g_wTVtKcjCjn/exec'

// DOM элементы
const startScreen = document.getElementById('start-screen')
const quizScreen = document.getElementById('quiz-screen')
const finalScreen = document.getElementById('final-screen')
const answersContainer = document.getElementById('answers-container')
const validationMessage = document.getElementById('validation-message')
const submitButton = document.getElementById('submit-button')
const questionCounter = document.getElementById('question-counter')
const progressFill = document.getElementById('progress-fill')

// стартовая форма
function submitStart() {
	userSquad = document.getElementById('squad').value.trim()
	userCallsign = document.getElementById('callsign').value.trim()

	if (!userSquad || !userCallsign) {
		validationMessage.style.display = 'block'
		return
	}

	validationMessage.style.display = 'none'
	startQuiz()
}

function startQuiz() {
	startScreen.classList.add('hidden')
	quizScreen.classList.remove('hidden')
	finalScreen.classList.add('hidden')
	currentPage = 0
	collectedAnswers = []
	renderCurrentPage()
}

// обновление счетчика и прогресс-бара
function updateProgress() {
	const lastQuestionOnPage = Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, totalQuestions)
	questionCounter.textContent = `Прогресс ${currentPage * QUESTIONS_PER_PAGE + 1} / ${totalQuestions}`

	const progressPercent = (lastQuestionOnPage / totalQuestions) * 100
	progressFill.style.width = progressPercent + '%'
}

// рендерим текущую страницу с вопросами
function renderCurrentPage() {
	answersContainer.innerHTML = ''

	const startIndex = currentPage * QUESTIONS_PER_PAGE
	const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, totalQuestions)

	if (startIndex >= totalQuestions) {
		showFinalScreen()
		return
	}

	updateProgress()

	for (let questionIndex = startIndex; questionIndex < endIndex; questionIndex++) {
		const currentQuestion = questions[questionIndex]

		const answerItem = document.createElement('div')
		answerItem.className = 'answer-item'

		const questionContent = document.createElement('div')
		questionContent.className = 'answer-item__content'

		const questionNumber = document.createElement('span')
		questionNumber.className = 'answer-item__number'
		questionNumber.textContent = currentQuestion.id

		const questionText = document.createElement('span')
		questionText.className = 'answer-item__text'
		questionText.textContent = currentQuestion.text

		questionContent.appendChild(questionNumber)
		questionContent.appendChild(questionText)

		const controlsWrapper = document.createElement('div')
		controlsWrapper.className = 'answer-item__controls'

		currentQuestion.options.forEach((optionText, optionIndex) => {
			const radioId = `question_${currentQuestion.id}_option_${optionIndex}`

			const radioInput = document.createElement('input')
			radioInput.type = 'radio'
			radioInput.className = 'answer-item__radio'
			radioInput.name = `question_${currentQuestion.id}`
			radioInput.id = radioId
			radioInput.value = optionText

			const previouslyAnswered = collectedAnswers.find((answerItem) => answerItem.questionId === currentQuestion.id)
			if (previouslyAnswered && previouslyAnswered.selectedAnswer === optionText) {
				radioInput.checked = true
			}

			radioInput.addEventListener('change', () => {
				if (radioInput.checked) {
					saveAnswer(currentQuestion.id, currentQuestion.text, optionText)
				}
			})

			const optionLabel = document.createElement('label')
			optionLabel.className = 'answer-item__label'
			optionLabel.htmlFor = radioId
			optionLabel.textContent = optionText

			controlsWrapper.appendChild(radioInput)
			controlsWrapper.appendChild(optionLabel)
		})

		answerItem.appendChild(questionContent)
		answerItem.appendChild(controlsWrapper)
		answersContainer.appendChild(answerItem)
	}

	updateNavigationButton()
}

// обновление кнопки навигации
function updateNavigationButton() {
	const oldButton = document.querySelector('.question-screen__button')
	if (oldButton) {
		oldButton.remove()
	}

	const navigationButton = document.createElement('button')
	navigationButton.className = 'question-screen__button'

	if (currentPage >= totalPages - 1) {
		navigationButton.textContent = 'Завершить тест'
		navigationButton.addEventListener('click', () => {
			collectAnswersFromCurrentPage()
			showFinalScreen()
		})
	} else {
		navigationButton.textContent = 'Далее'
		navigationButton.addEventListener('click', () => {
			collectAnswersFromCurrentPage()
			currentPage++
			renderCurrentPage()
			window.scrollTo({ top: 0, behavior: 'smooth' })
		})
	}

	const questionScreenAnswers = document.querySelector('.question-screen__answers')
	questionScreenAnswers.appendChild(navigationButton)
}

// собираем ответы с текущей страницы
function collectAnswersFromCurrentPage() {
	const allRadioInputs = answersContainer.querySelectorAll('input[type="radio"]:checked')

	allRadioInputs.forEach((radioInput) => {
		const questionId = parseInt(radioInput.name.replace('question_', ''), 10)
		const selectedAnswer = radioInput.value

		const questionData = questions.find((question) => question.id === questionId)
		const actualQuestionText = questionData ? questionData.text : ''

		const existingAnswerIndex = collectedAnswers.findIndex((answerItem) => answerItem.questionId === questionId)

		if (existingAnswerIndex !== -1) {
			collectedAnswers[existingAnswerIndex].selectedAnswer = selectedAnswer
		} else {
			collectedAnswers.push({
				questionId: questionId,
				questionText: actualQuestionText,
				selectedAnswer: selectedAnswer,
			})
		}
	})
}

// сохраняем отдельный ответ
function saveAnswer(questionId, questionText, selectedAnswer) {
	const existingAnswerIndex = collectedAnswers.findIndex((answerItem) => answerItem.questionId === questionId)

	if (existingAnswerIndex !== -1) {
		collectedAnswers[existingAnswerIndex].selectedAnswer = selectedAnswer
	} else {
		collectedAnswers.push({
			questionId: questionId,
			questionText: questionText,
			selectedAnswer: selectedAnswer,
		})
	}
}

// показываем финальный экран
function showFinalScreen() {
	quizScreen.classList.add('hidden')
	finalScreen.classList.remove('hidden')

	progressFill.style.width = '100%'
	questionCounter.textContent = `Прогресс ${totalQuestions} / ${totalQuestions}`
}

function prepareDataForSheet() {
	// Сортируем ответы по ID вопроса
	const sortedAnswers = [...collectedAnswers].sort((a, b) => a.questionId - b.questionId)

	return {
		squad: userSquad,
		callsign: userCallsign,
		timestamp: new Date().toISOString(),
		answers: sortedAnswers.map((item) => ({
			id: item.questionId,
			answer: item.selectedAnswer,
		})),
	}
}

// Отправка данных
async function sendDataToGoogleSheets() {
	submitButton.innerHTML = `<span class="loader"></span>`
	submitButton.classList.remove('final-screen__submit')

	submitButton.disabled = true
	// Собираем последние ответы
	collectAnswersFromCurrentPage()

	// Подготавливаем данные
	const data = prepareDataForSheet()

	try {
		// Отправляем через Apps Script
		const response = await fetch(SCRIPT_URL, {
			method: 'POST',
			mode: 'no-cors',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				spreadsheetId: SPREADSHEET_ID,
				callsign: data.callsign,
				squad: data.squad,
				timestamp: data.timestamp,
				answers: data.answers,
			}),
		})

		// Меняем кнопку
		submitButton.classList.add('final-screen__submit')
		submitButton.textContent = 'Отправлено!'
		submitButton.style.backgroundColor = '#4CAF50'
	} catch (error) {
		submitButton.disabled = false
	}
}

// вешаем обработчик на кнопку отправки

submitButton.addEventListener('click', sendDataToGoogleSheets)
