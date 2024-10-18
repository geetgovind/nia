const tagsSelect = document.querySelector("#tags");
const questionsContainer = document.querySelector("#questions-container");
let chattagsQuestions = []; // To hold the questions data fetched from the API

// Fetch chat tags (same as before)
const fetchChatTags = async () => {
    try {
        const response = await fetch('http://192.168.9.241:8000/get_chattags_keywords/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xapi': '1234'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch chat tags');
        }

        const data = await response.json();
        populateTagsDropdown(data);

    } catch (error) {
        console.error('Error fetching chat tags:', error);
    }
};

// Populate the select dropdown with fetched chat tags
const populateTagsDropdown = (data) => {
    tagsSelect.innerHTML = '<option selected>Select Smart Tags</option>';

    data.chattags_keywords.forEach(tag => {
        const optionElement = document.createElement("option");
        optionElement.value = tag.chatags_id;
        optionElement.textContent = tag.chattag_words;
        tagsSelect.appendChild(optionElement);
    });
};

// Fetch chat questions based on tag ID
const fetchChatQuestions = async () => {
    try {
        const response = await fetch('http://192.168.9.241:8000/get_chattags_questions/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xapi': '1234'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch chat questions');
        }

        const data = await response.json();
        chattagsQuestions = data.chattags_questions; // Store fetched questions

    } catch (error) {
        console.error('Error fetching chat questions:', error);
    }
};

// Function to filter questions based on the selected chat tag
const filterQuestionsByTag = (tagId) => {
    const filteredQuestions = chattagsQuestions.filter(q => q.chattags_id == tagId);

    // Clear previous buttons
    questionsContainer.innerHTML = "";

    // Create buttons for each filtered question
    filteredQuestions.forEach(question => {
        const button = document.createElement("button");
        button.classList.add("btn","btn-success");
       
        // button.style.margin = "5px 0";
        // button.textContent = question.chattag_ques;
        // questionsContainer.appendChild(button);


        button.style.marginBottom = "10px"; // Space between buttons
        button.textContent = question.chattag_ques;
        button.addEventListener('click', () => {
            messageInput.value = question.chattag_ques; // Set the input value to the question when clicked
            handleChat(); // Send the chat message immediately
            // Reset the select tag
            tagsSelect.selectedIndex = 0; // Reset to "Select Smart Tags"
            
            // Hide question buttons
            questionsContainer.innerHTML = ""; // Clear the question buttons
        });

            questionsContainer.appendChild(button);
    });
};

// Event listener for when the tag is selected from the dropdown
tagsSelect.addEventListener("change", () => {
    const selectedTagId = tagsSelect.value;
    if (selectedTagId !== "Select Smart Tags") {
        filterQuestionsByTag(selectedTagId);
    } else {
        questionsContainer.innerHTML = ""; // Clear if no valid tag is selected
    }
});

// Call the functions to fetch tags and questions on page load
window.addEventListener('load', async () => {
    await fetchChatTags();
    await fetchChatQuestions(); // Fetch questions after the page loads
});

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const messageInput = document.querySelector("#messageInput");
const sendChatBtn = document.querySelector("#send-btn");
const suggestionDropdown = document.querySelector("#suggestionDropdown");

let keywordsData = { "keywords": [] };
let questionsData = { "questions": [] };
let userMessage = null;








// Function to fetch keywords from the API
const fetchKeywords = async () => {
    try {
        const response = await fetch('http://192.168.9.241:8000/get_keywords/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xapi': '1234'
            }
        });

        if (response.ok) {
            const data = await response.json();
            keywordsData = data;  // Update the global keywordsData
        } else {
            console.error('Failed to fetch keywords');
        }
    } catch (error) {
        console.error('Error fetching keywords:', error);
    }
};

// Function to fetch questions from the API
const fetchQuestions = async () => {
    try {
        const response = await fetch('http://192.168.9.241:8000/get_questions/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'xapi': '1234'
            }
        });

        if (response.ok) {
            const data = await response.json();
            questionsData = data;  // Update the global questionsData
        } else {
            console.error('Failed to fetch questions');
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
};

// Call the API fetch functions when the page loads
window.addEventListener('load', () => {
    fetchKeywords();
    fetchQuestions();
});

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    chatLi.innerHTML = `<p>${message}</p>`;
    return chatLi;
};

const generateResponse = async (chatElement) => {
    const messageElement = chatElement.querySelector("p");
    const apiUrl = 'http://192.168.9.241:8000/get_response/?msg=' + encodeURIComponent(userMessage);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain',
                'xapi': '1234'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            messageElement.textContent = `Error: ${errorText}`;
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let responseText = '';
        messageElement.textContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            responseText += chunk;
            messageElement.innerHTML = responseText;
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        messageElement.classList.add("error");
        messageElement.textContent = 'Error fetching data';
    } finally {
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }
};

const handleChat = () => {
    userMessage = messageInput.value.trim();

    if (!userMessage) return;

    messageInput.value = "";
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 600);
};

const showSuggestions = () => {
    const inputText = messageInput.value.trim().toLowerCase();
    suggestionDropdown.innerHTML = ""; // Clear previous suggestions

    if (inputText.length < 1) {
        suggestionDropdown.style.display = 'none'; // Hide if input is empty
        return;
    }

    // Get matching keywords (partial match)
    const matchingKeywords = keywordsData.keywords.filter(keyword =>
        keyword.keywords.toLowerCase().includes(inputText)
    );

    // Get matching questions (based on keyword matches)
    const matchingQuestions = questionsData.questions.filter(question =>
        keywordsData.keywords.some(keyword =>
            question.suggest_questions.toLowerCase().includes(keyword.keywords.toLowerCase()) && 
            inputText.includes(keyword.keywords.toLowerCase())
        )
    );

    // Combine and display suggestions
    const suggestions = [...matchingKeywords, ...matchingQuestions];
    if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
            const listItem = document.createElement("li");
            listItem.textContent = suggestion.keywords || suggestion.suggest_questions;
            listItem.addEventListener("click", () => {
                messageInput.value = listItem.textContent; // Set the input value
                suggestionDropdown.innerHTML = ""; // Clear suggestions
                suggestionDropdown.style.display = 'none'; // Hide dropdown after selection
            });
            suggestionDropdown.appendChild(listItem);
        });
        suggestionDropdown.style.display = 'block'; // Show suggestions
    } else {
        suggestionDropdown.style.display = 'none'; // Hide if no matches
    }
};

messageInput.addEventListener("input", showSuggestions);

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

// Hide dropdown when clicking outside
document.addEventListener("click", function (event) {
    if (!messageInput.contains(event.target) && !suggestionDropdown.contains(event.target)) {
        suggestionDropdown.innerHTML = ""; // Clear suggestions if clicked outside
        suggestionDropdown.style.display = 'none'; // Hide dropdown
    }
});