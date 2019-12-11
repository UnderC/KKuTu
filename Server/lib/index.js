const Spawn = require("child_process").spawn;
const JLog = require("./sub/jjlog");
const SETTINGS = require("./sub/global")
let webServer, gameServers;

class ChildProcess{
	constructor(id, cmd, ...argv){
		this.process = Spawn(cmd, argv);
		this.process.stdout.on('data', msg => {
			console.log(String(msg));
		});
		this.process.stderr.on('data', msg => {
			console.error(`${id}: ${String(msg)}`);
		});
		this.process.on('close', code => {
			this.process.removeAllListeners();
			JLog.error(`${id}: CLOSED WITH CODE ${code}`);
			this.process = null;
		});
	}
	kill(sig){
		if(this.process) this.process.kill(sig || 'SIGINT');
	}
}

function startServer(){
	stopServer();
	webServer = new ChildProcess('W', "node", `${__dirname}/Web/cluster.js`, SETTINGS['web-num-cpu']);
	gameServers = [];
	
	for(let i=0; i<SETTINGS['game-num-inst']; i++){
		gameServers.push(new ChildProcess('G', "node", `${__dirname}/Game/cluster.js`, i, SETTINGS['game-num-cpu']));
	}
}

function stopServer(){
	if(webServer) webServer.kill();
	if(gameServers) gameServers.forEach(v => v.kill());
}

startServer()