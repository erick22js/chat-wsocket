const readline = require('readline');
const process = require('process');
const WebSocket = require('ws');

const con = require("./control.js");

// Enable raw mode on stdin
process.stdin.setRawMode(true);
//console.clear();
console.log("==============================================================");
console.log("Starting Server...\n");

// Create a WebSocket server instance on a specific port
const wss = new WebSocket.Server({ port: 8080 });

// Event listener for new connections
wss.on('connection', function connection(ws) {
	let uid = -1;
	let username = '';//let username = ws._protocol;
	let logged = false;
	
	// Event listener for messages received from the client
	ws.on('message', function incoming(data) {
		data = JSON.parse(data);
		console.log('Received message from client "'+uid+'":', data.msg);
		
		// Cannot procceed to return a response if user is not logged and is not logging
		if (!logged && data.type!='login') {
			ws.close();
			return;
		}
		switch (data.type){
			case 'login': {
					uid = con.generateUniqueId();
					username = data.username;
					
					if (!con.login(username, data.password, uid, ws)) {
						ws.close();
					}
					else {
						console.log('Client "'+uid+'" connected');
						console.log('Username: '+username);
						logged = true;
						let list = con.listUsers();
						for (let i=0; i<list.length; i++){
							con.sendUsersList(list[i].username, list);
						}
						con.alertUserLogin(username);
					}
				}
				break;
			case 'message': {
					console.log("The user '"+username+"' is sending to '"+data.to+"' the message '"+data.msg+"'.");
					con.sendMessage(username, data.to, data.msg);
					con.sendUsersList(data.to, con.listUsers());
				}
				break;
			case 'refresh_users': {
					con.sendUsersList(username, con.listUsers());
				}
				break;
			case 'ping': {
					cons.sendPong(username);
				}
				break;
		}
	});

	// Event listener for when a client closes the connection
	ws.on('close', function close() {
		if (logged){
			console.log('Client "'+uid+'" disconnected');
			con.disconnect(username);
			con.alertUserDisconnection(username);
		}
	});

	// Event listener for errors
	ws.on('error', function error(err) {
		console.error('WebSocket error with client "'+uid+'":', err);
	});
});

console.log('WebSocket server started on port 8080');


/*
	Program Abortion by Key press
*/

// Listen for keypress events
process.stdin.on('keypress', (str, key) => {
	if (key.name === 'escape'){
		console.log("Closing Server...");
		process.exit(0);
	}
});

// Start emitting keypress events
readline.emitKeypressEvents(process.stdin);
