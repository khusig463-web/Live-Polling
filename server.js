const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
    let file = req.url === "/" ? "/index.html" : req.url;

    const filePath = path.join(__dirname, "public", file);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("File not found");
            return;
        }

        let contentType = "text/html";

        if (file.endsWith(".css")) {
            contentType = "text/css";
        } else if (file.endsWith(".js")) {
            contentType = "text/javascript";
        }

        res.writeHead(200, {
            "Content-Type": contentType
        });

        res.end(data);
    });
});

const io = new Server(server);

const polls = {};

function generateRoomCode() {
    return Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
}


// ADMIN CREATES POLL
io.on("connection", (socket) => {

    socket.on("createPoll", ({ question, options }) => {

        const roomCode = generateRoomCode();

        polls[roomCode] = {
            question,
            options: options.map(option => ({
                text: option,
                votes: 0
            })),
            participants: new Set(),
            voters: new Set(),
            started: false,
            ended: false
        };

        socket.join(roomCode);

        socket.roomCode = roomCode;
        socket.isAdmin = true;

        socket.emit("pollCreated", {
            roomCode,
            question,
            options: polls[roomCode].options
        });
    });


    // PARTICIPANT JOINS
    socket.on("joinPoll", (roomCode) => {

        roomCode = roomCode.toUpperCase();

        const poll = polls[roomCode];

        if (!poll) {
            socket.emit("errorMessage", "Invalid room code");
            return;
        }

        if (poll.ended) {
            socket.emit("errorMessage", "Poll has ended");
            return;
        }

        poll.participants.add(socket.id);

        socket.join(roomCode);
        socket.roomCode = roomCode;

        io.to(roomCode).emit("participantCount", {
            count: poll.participants.size
        });

        socket.emit("waiting");
    });


    // ADMIN STARTS POLL
    socket.on("startPoll", () => {

        const roomCode = socket.roomCode;
        const poll = polls[roomCode];

        if (!poll || !socket.isAdmin) return;

        poll.started = true;

        io.to(roomCode).emit("pollStarted", {
            question: poll.question,
            options: poll.options.map(option => option.text)
        });
    });


    // PARTICIPANT VOTES
    socket.on("vote", (index) => {

        const roomCode = socket.roomCode;
        const poll = polls[roomCode];

        if (!poll || !poll.started || poll.ended) {
            return;
        }

        // Prevent double voting
        if (poll.voters.has(socket.id)) {
            socket.emit("errorMessage", "You have already voted");
            return;
        }

        if (index < 0 || index >= poll.options.length) {
            return;
        }

        poll.options[index].votes++;

        poll.voters.add(socket.id);

        socket.emit("voteSubmitted");

        io.to(roomCode).emit("resultsUpdated", {
            options: poll.options,
            totalVotes: poll.voters.size
        });
    });


    // ADMIN ENDS POLL
    socket.on("endPoll", () => {

        const roomCode = socket.roomCode;
        const poll = polls[roomCode];

        if (!poll || !socket.isAdmin) return;

        poll.ended = true;

        let winner = poll.options[0];

        poll.options.forEach(option => {
            if (option.votes > winner.votes) {
                winner = option;
            }
        });

        io.to(roomCode).emit("pollEnded", {
            options: poll.options,
            winner: winner.text,
            totalVotes: poll.voters.size
        });
    });


    socket.on("disconnect", () => {

        const roomCode = socket.roomCode;

        if (roomCode && polls[roomCode]) {

            polls[roomCode].participants.delete(socket.id);

            io.to(roomCode).emit("participantCount", {
                count: polls[roomCode].participants.size
            });
        }
    });

});


server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});