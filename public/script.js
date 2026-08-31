const socket = io();


// ---------------- ADMIN ----------------

function addOption() {

    const options = document.querySelectorAll(".option");

    if (options.length >= 6) {
        alert("Maximum 6 options allowed");
        return;
    }

    const input = document.createElement("input");

    input.className = "option";

    input.placeholder = `Option ${options.length + 1}`;

    document.getElementById("options").appendChild(input);
}


function createPoll() {

    const question =
        document.getElementById("question").value.trim();

    const optionInputs =
        document.querySelectorAll(".option");

    const options = [];

    optionInputs.forEach(input => {

        if (input.value.trim() !== "") {
            options.push(input.value.trim());
        }

    });

    if (!question) {
        alert("Enter a question");
        return;
    }

    if (options.length < 2) {
        alert("Add at least 2 options");
        return;
    }

    socket.emit("createPoll", {
        question,
        options
    });
}


socket.on("pollCreated", data => {

    document
        .getElementById("createSection")
        .classList.add("hidden");

    document
        .getElementById("adminSection")
        .classList.remove("hidden");

    document.getElementById("roomCode").textContent =
        data.roomCode;
});


socket.on("participantCount", data => {

    const element =
        document.getElementById("participantCount");

    if (element) {
        element.textContent = data.count;
    }
});


function startPoll() {

    socket.emit("startPoll");
}


socket.on("pollStarted", data => {

    const resultDiv =
        document.getElementById("adminResults");

    if (!resultDiv) return;

    document
        .getElementById("endButton")
        .classList.remove("hidden");

    resultDiv.innerHTML =
        `<h2>${data.question}</h2>`;

    data.options.forEach(option => {

        resultDiv.innerHTML += `
            <div class="result">
                <b>${option}</b>
                <div class="bar">
                    <div class="fill"></div>
                </div>
                <span>0 votes</span>
            </div>
        `;

    });
});


function endPoll() {

    socket.emit("endPoll");
}


socket.on("resultsUpdated", data => {

    updateResults(data);

});


function updateResults(data) {

    const containers =
        document.querySelectorAll(".result");

    const total = data.totalVotes;

    containers.forEach((container, index) => {

        const votes =
            data.options[index].votes;

        const percentage =
            total === 0
                ? 0
                : (votes / total) * 100;

        const fill =
            container.querySelector(".fill");

        const text =
            container.querySelector("span");

        if (fill) {
            fill.style.width = percentage + "%";
        }

        if (text) {
            text.textContent =
                `${votes} votes`;
        }

    });
}


socket.on("pollEnded", data => {

    const result =
        document.getElementById("adminResults");

    if (result) {

        result.innerHTML += `
            <h2>Winner: ${data.winner}</h2>
            <p>Total Votes: ${data.totalVotes}</p>
        `;

    }

});


// ---------------- PARTICIPANT ----------------

function joinPoll() {

    const room =
        document.getElementById("roomInput")
            .value
            .trim()
            .toUpperCase();

    if (!room) {
        alert("Enter room code");
        return;
    }

    socket.emit("joinPoll", room);
}


socket.on("waiting", () => {

    document
        .getElementById("joinSection")
        .classList.add("hidden");

    document
        .getElementById("waitingSection")
        .classList.remove("hidden");

});


socket.on("pollStarted", data => {

    const voteSection =
        document.getElementById("voteSection");

    if (!voteSection) return;

    document
        .getElementById("waitingSection")
        .classList.add("hidden");

    voteSection.classList.remove("hidden");

    document
        .getElementById("participantQuestion")
        .textContent = data.question;

    const optionsDiv =
        document.getElementById("voteOptions");

    optionsDiv.innerHTML = "";

    data.options.forEach((option, index) => {

        const button =
            document.createElement("button");

        button.className = "optionButton";

        button.textContent = option;

        button.onclick = () => vote(index, button);

        optionsDiv.appendChild(button);

    });

});


function vote(index, button) {

    socket.emit("vote", index);

    button.disabled = true;

}


socket.on("voteSubmitted", () => {

    document.getElementById("message").textContent =
        "Vote submitted";

});


socket.on("errorMessage", message => {

    alert(message);

});


socket.on("pollEnded", data => {

    const voteSection =
        document.getElementById("voteSection");

    if (voteSection) {
        voteSection.classList.add("hidden");
    }

    const results =
        document.getElementById("participantResults");

    if (results) {

        results.classList.remove("hidden");

        document.getElementById("results").innerHTML =
            `<h3>Winner: ${data.winner}</h3>
             <p>Total Votes: ${data.totalVotes}</p>`;

    }

});