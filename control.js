
let users = {};
let info_users = [];
let pool = [];
let _uid = 0;
let _uid_free = 0;

function generateUniqueId() {
	if (_uid_free){
		if (_uid >= pool.length-1) _uid = 0;
		for (;_uid<=pool.length; _uid++){
			if (!pool[_uid]){
				return _uid;
			}
		}
	}
	return _uid++;
}

function login(username, password, uid, ws) {
	if (users[username]){
		// Invalid password
		if (users[username].password != password){
			ws.send('{"type":"login", "error":2}');
			return false;
		}
		// User is already connected
		if (users[username].ws){
			ws.send('{"type":"login", "error":1}');
			return false;
		}
	}
	if (!users[username]){
		users[username] = {
			"password": password,
			"info": info_users.length,
			"pool": [],
		};
		info_users.push({
			"username": username,
			"online": false,
		});
	}
	users[username].session_uid = uid;
	users[username].ws = ws;
	pool[uid] = {
		"username": username,
		"ws": ws,
	};
	info_users[users[username].info].online = true;
	// User is disconnected
	ws.send('{"type":"login", "error":0}');
	return true;
}

function disconnect(username) {
	if (users[username].ws){
		pool[users[username].session_uid] = null;
		users[username].session_uid = -1;
		users[username].ws = null;
		info_users[users[username].info].online = false;
		_uid_free++;
	}
}

function sendMessage(from_username, to_username, message) {
	if (users[to_username].ws){
		let date = new Date();
		users[to_username].ws.send(JSON.stringify({"type":"message", "hr":date.getHours(), "mn":date.getMinutes(), "sc":date.getSeconds(), "from":from_username, "msg":message}));
	}
}

function sendAlert(from_username, to_username, info) {
	if (users[to_username].ws){
		let date = new Date();
		users[to_username].ws.send(JSON.stringify({"type":"alert", "hr":date.getHours(), "mn":date.getMinutes(), "sc":date.getSeconds(), "from":from_username, "info":info}));
	}
}

function alertUserLogin(from_username) {
	let list = listUsers();
	for (let i=0; i<list.length; i++){
		sendAlert(from_username, list[i].username, "login");
	}
}

function alertUserDisconnection(from_username) {
	let list = listUsers();
	for (let i=0; i<list.length; i++){
		sendAlert(from_username, list[i].username, "logoff");
	}
}

function listUsers(){
	return info_users;
}

function sendUsersList(to_username, list){
	if (users[to_username].ws){
		users[to_username].ws.send(JSON.stringify({"type":"refresh_users", "list": info_users}));
	}
}

function sendPong(to_username) {
	if (users[to_username].ws){
		users[to_username].ws.send(JSON.stringify({"type":"pong"}));
	}
}

function checkUsers() {
	for (let i=0; i<pool.length; i++){
		if (pool[i]){
			pool[i].ws.send(JSON.stringify({"type":"ping"}));
		}
	}
}

module.exports = {
	generateUniqueId,
	login,
	disconnect,
	sendMessage,
	sendAlert,
	alertUserLogin,
	alertUserDisconnection,
	listUsers,
	sendUsersList,
	sendPong,
	checkUsers
};
