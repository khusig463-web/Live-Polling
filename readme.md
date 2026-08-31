# Live Polling / Quiz Application

A real-time polling application where an Admin can create a poll and Participants can join using a unique room code and vote in real time.

## Features

### Admin Flow

- Create a poll with a question and 2–6 answer options.
- Generate a unique room code.
- View the live number of participants.
- Start the voting session.
- View live voting results.
- End the poll.
- Display the winning option.

### Participant Flow

- Join a poll using a room code.
- Wait for the host to start voting.
- Receive the voting screen automatically when the poll starts.
- Vote for one option.
- Receive immediate vote confirmation.
- Prevent duplicate voting.
- View live results without refreshing the page.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Real-Time Communication:** Socket.IO
- **Data Storage:** In-memory JavaScript objects

## Project Structure

```text
LivePollingQuiz/
│
├── server.js
├── package.json
│
└── public/
    ├── index.html
    ├── participant.html
    ├── style.css
    └── script.js
```
## Approach

The application follows a client-server architecture using Node.js and Socket.IO.

1. The admin creates a poll by entering a question and 2–6 answer options.
2. The server generates a unique room code and stores the poll details in memory.
3. Participants join the poll using the room code.
4. Socket.IO places the admin and participants into the corresponding room.
5. Participants receive a server-pushed waiting state until the admin starts voting.
6. When voting starts, the server broadcasts the question and options to all participants in the room.
7. When a participant submits a vote, the server validates the request and updates the vote count.
8. The updated results are broadcast to all connected clients in real time using Socket.IO.
9. The admin and participants can see the updated results without refreshing the page.
10. When the admin ends the poll, voting is stopped and the option with the highest votes is displayed as the winner.
