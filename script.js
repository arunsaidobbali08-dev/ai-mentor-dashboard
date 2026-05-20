const avatarMap = {
  happy: {
    label: "Happy",
    image: "https://cdn-icons-png.flaticon.com/512/4712/4712027.png",
    message: "Nice. Celebrate the win, then ship the next small piece. Momentum comes from finished tasks.",
  },
  thinking: {
    label: "Thinking",
    image: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png",
    message: "Pause and analyze the problem. Define the input, the output, and the smallest working version.",
  },
  teaching: {
    label: "Teaching",
    image: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
    message: "Today we build first, then study the gap. One concept, one example, one exercise, one review.",
  },
  sleepy: {
    label: "Sleepy",
    image: "https://cdn-icons-png.flaticon.com/512/4712/4712058.png",
    message: "Energy is low. Do a 10-minute cleanup task instead of pretending you can do a deep session.",
  },
};

const lessonData = {
  HTML: {
    title: "HTML Structure",
    lesson: "01 / 05",
    xp: 420,
    projectTitle: "Build a personal intro card",
    projectText: "Use one heading, one paragraph, one button, and a clean card layout.",
    message: "HTML is the skeleton. Use semantic tags first: header, main, section, nav, and button.",
    progress: 58,
  },
  CSS: {
    title: "CSS Layout",
    lesson: "02 / 05",
    xp: 510,
    projectTitle: "Create a responsive dashboard card",
    projectText: "Use grid, spacing, hover states, and one progress bar.",
    message: "CSS is controlled spacing. Start with layout, then color, then motion. Never decorate a broken structure.",
    progress: 64,
  },
  JavaScript: {
    title: "JavaScript Logic",
    lesson: "03 / 05",
    xp: 620,
    projectTitle: "Make an interactive quiz",
    projectText: "Add answers, score tracking, feedback, and a reset button.",
    message: "JavaScript connects user actions to state. Click, update, render. Keep that loop simple.",
    progress: 71,
  },
  "AI Tools": {
    title: "AI Workflow",
    lesson: "04 / 05",
    xp: 760,
    projectTitle: "Design a prompt checklist",
    projectText: "Create prompts for research, coding, rewriting, and automation planning.",
    message: "Good AI work needs context, constraints, examples, and a clear output format. Vague prompts waste time.",
    progress: 49,
  },
  Freelancing: {
    title: "Freelance Systems",
    lesson: "05 / 05",
    xp: 880,
    projectTitle: "Write a service offer",
    projectText: "Pick one audience, one problem, one outcome, and one delivery promise.",
    message: "Freelancing starts with a specific offer. Do not sell skills. Sell a useful result.",
    progress: 38,
  },
};

const mentorAvatar = document.querySelector("#mentorAvatar");
const typingText = document.querySelector("#typingText");
const emotionLabel = document.querySelector("#emotionLabel");
const emotionButtons = document.querySelectorAll(".emotion-btn");
const lessonButtons = document.querySelectorAll(".lesson-item");
const sessionTitle = document.querySelector("#sessionTitle");
const lessonMetric = document.querySelector("#lessonMetric");
const xpMetric = document.querySelector("#xpMetric");
const projectTitle = document.querySelector("#projectTitle");
const projectText = document.querySelector("#projectText");
const completeProjectBtn = document.querySelector("#completeProjectBtn");
const goalInputs = document.querySelectorAll(".goal-row input");
const goalCount = document.querySelector("#goalCount");
const progressPercent = document.querySelector("#progressPercent");
const ringPercent = document.querySelector("#ringPercent");
const progressCircle = document.querySelector("#progressCircle");
const streakCount = document.querySelector("#streakCount");
const mentorForm = document.querySelector("#mentorForm");
const mentorQuestion = document.querySelector("#mentorQuestion");
const askMentorBtn = document.querySelector("#askMentorBtn");
const apiStatus = document.querySelector("#apiStatus");
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");

let typingTimer = null;
let activeTopic = "HTML";
let activeEmotion = "teaching";
let allGoalsComplete = [...goalInputs].every((input) => input.checked);
const mentorHistory = [];

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  themeLabel.textContent = isLight ? "Light" : "Dark";
  themeToggle.setAttribute("aria-pressed", String(!isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  localStorage.setItem("mentor-theme", theme);
}

function typeMessage(message) {
  window.clearInterval(typingTimer);
  typingText.textContent = "";

  let index = 0;
  typingTimer = window.setInterval(() => {
    typingText.textContent += message.charAt(index);
    index += 1;

    if (index >= message.length) {
      window.clearInterval(typingTimer);
    }
  }, 24);
}

function setAvatarEmotion(emotion) {
  const data = avatarMap[emotion];
  activeEmotion = emotion;

  emotionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.emotion === emotion);
  });

  mentorAvatar.classList.add("switching");
  window.setTimeout(() => {
    mentorAvatar.src = data.image;
    mentorAvatar.alt = `${data.label} AI mentor avatar`;
    emotionLabel.textContent = data.label;
    mentorAvatar.classList.remove("switching");
  }, 160);

  typeMessage(data.message);
}

function setApiStatus(message, state = "") {
  apiStatus.textContent = message;
  apiStatus.classList.remove("error", "online");
  if (state) {
    apiStatus.classList.add(state);
  }
}

function setProgress(value) {
  const circumference = 301.59;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (circumference * clamped) / 100;
  progressCircle.style.strokeDashoffset = offset;
  progressPercent.textContent = `${clamped}%`;
  ringPercent.textContent = `${clamped}%`;
}

function setLesson(topic) {
  const data = lessonData[topic];
  activeTopic = topic;

  lessonButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.topic === topic);
  });

  sessionTitle.textContent = data.title;
  lessonMetric.textContent = data.lesson;
  xpMetric.textContent = data.xp;
  projectTitle.textContent = data.projectTitle;
  projectText.textContent = data.projectText;
  setProgress(data.progress);
  typeMessage(data.message);

  if (activeEmotion === "sleepy") {
    setAvatarEmotion("thinking");
  }
}

function updateGoals() {
  const completed = [...goalInputs].filter((input) => input.checked).length;
  const total = goalInputs.length;
  goalCount.textContent = `${completed} / ${total}`;

  const baseProgress = lessonData[activeTopic].progress;
  const bonus = Math.round((completed / total) * 18);
  setProgress(Math.min(100, baseProgress + bonus));

  if (completed === total && !allGoalsComplete) {
    setAvatarEmotion("happy");
    streakCount.textContent = Number(streakCount.textContent) + 1;
  }

  allGoalsComplete = completed === total;
}

emotionButtons.forEach((button) => {
  button.addEventListener("click", () => setAvatarEmotion(button.dataset.emotion));
});

lessonButtons.forEach((button) => {
  button.addEventListener("click", () => setLesson(button.dataset.topic));
});

goalInputs.forEach((input) => {
  input.addEventListener("change", updateGoals);
});

completeProjectBtn.addEventListener("click", () => {
  const uncheckedGoal = [...goalInputs].find((input) => !input.checked);
  if (uncheckedGoal) {
    uncheckedGoal.checked = true;
  }
  updateGoals();
  setAvatarEmotion("happy");
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
  applyTheme(nextTheme);
});

mentorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = mentorQuestion.value.trim();
  if (!question) {
    setAvatarEmotion("thinking");
    typeMessage("Ask a specific question. For example: explain CSS grid with one beginner exercise.");
    return;
  }

  askMentorBtn.disabled = true;
  mentorQuestion.disabled = true;
  setApiStatus("Asking OpenAI...", "online");
  setAvatarEmotion("thinking");
  typeMessage("Thinking through your question...");

  const completedGoals = [...goalInputs]
    .filter((input) => input.checked)
    .map((input) => input.nextElementSibling.textContent.trim());

  try {
    const response = await fetch("/api/mentor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        topic: activeTopic,
        lesson: lessonData[activeTopic],
        completedGoals,
        history: mentorHistory.slice(-6),
      }),
    });

    let data = {};

try {
  data = await response.json();
} catch (error) {
  data.reply = "API response failed. Check backend/server.";
};

    if (!response.ok) {
      throw new Error(data.error || "Mentor API request failed.");
    }

    mentorHistory.push({ role: "user", content: question });
    mentorHistory.push({ role: "assistant", content: data.reply });
    mentorQuestion.value = "";
    setAvatarEmotion("teaching");
    typeMessage(data.reply);
    setApiStatus("Mentor online", "online");
  } catch (error) {
    setAvatarEmotion("sleepy");
    typeMessage(error.message || "The mentor API is not reachable yet. Check the local server and API key.");
    setApiStatus("API connection failed", "error");
  } finally {
    askMentorBtn.disabled = false;
    mentorQuestion.disabled = false;
    mentorQuestion.focus();
  }
});

applyTheme(localStorage.getItem("mentor-theme") || "dark");
setProgress(58);
typeMessage(avatarMap.teaching.message);
