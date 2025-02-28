const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let players = new Set();
let votes = {};
let dilemman = [
    {
        text: "År 2100 är AI-övervakning allestädes närvarande. Ska vi förbjuda den, reglera den eller acceptera den?",
        book: "1984 - George Orwell",
        choices: ["Förbjud AI-övervakning", "Låt människor övervaka AI", "Ge AI full kontroll"]
    },
    {
        text: "Forskare har skapat artificiella människor. Ska de ges rättigheter eller kontrolleras strikt?",
        book: "Frankenstein - Mary Shelley",
        choices: ["Stoppa all forskning", "Ge dem rättigheter", "Begränsa dem under strikt kontroll"]
    }
];
let currentDilemmaIndex = 0;

server.on('connection', ws => {
    const playerId = Math.floor(Math.random() * 1000000);
    players.add(playerId);
    
    ws.send(JSON.stringify({ type: "playerCount", count: players.size }));
    
    if (players.size === 1) {
        sendNewDilemma();
    }
    
    ws.on('message', message => {
        const data = JSON.parse(message);
        if (data.type === "vote") {
            votes[data.choice] = (votes[data.choice] || 0) + 1;
            if (votes[data.choice] >= players.size) {
                const winningChoice = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
                broadcast({ type: "result", winningChoice });
                setTimeout(sendNewDilemma, 3000);
            }
        }
    });

    ws.on('close', () => {
        players.delete(playerId);
        broadcast({ type: "playerCount", count: players.size });
    });
});

function sendNewDilemma() {
    if (currentDilemmaIndex >= dilemman.length) {
        broadcast({ type: "gameOver", message: "Spelet är slut!" });
        return;
    }
    votes = {};
    broadcast({ type: "newDilemma", dilemma: dilemman[currentDilemmaIndex] });
    currentDilemmaIndex++;
}

function broadcast(data) {
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

console.log("WebSocket-server körs på Render.");
