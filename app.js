// OCE BOT

var restify = require('restify');
var builder = require('botbuilder');


console.log('Starting OCE Ops...');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'cf6369fc-151c-4305-a518-d6cfe552e32f',
   appPassword: 'YQqrJizpdaso66EPiX7KmGQ'
//	appId: null,
//	appPassword: null
});

//var connector = new builder.ConsoleConnector().listen()
var bot = new builder.UniversalBot(connector);
server.post('/', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=7d7e7ac3-d7ef-472c-acbc-9b81c705958c&subscription-key=fe19cd20c4a84c829a1c8d572e198788')
//var intents = new builder.IntentDialog();
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);

intents.matches('DeployIntent', [

	function (session, args, next) {
        // Resolve and store any entities passed from LUIS.
        var action = builder.EntityRecognizer.findEntity(args.entities, 'ActionEntity');
        var env = builder.EntityRecognizer.findEntity(args.entities, 'EnvEntity');
        var release = builder.EntityRecognizer.findEntity(args.entities, 'ReleaseEntity');
		console.log(args);
		
		console.log('In w1 about to inspect.');

		if ( action != null ) { 
			session.userData.action = action.entity
		}  else {
			// Force Deploy
			session.userData.action = "deploy"
		}

		if ( release != null ) {
			console.log(release.entity);
			var result = /\d+(\s)*(\.\s\d+)?/g.exec(release.entity);
			if (result != null)
				session.userData.release = result[0];
		}

		if ( env != null )  {
			session.userData.env = env.entity
		}

		console.log('In w1 about to inspect complete.');
     	
     	next();
	},

	function (session, results, next) {
    	if (session.userData.env == null) {
			session.beginDialog('/env');
		} else {
			next();
		}
    },

	function (session, results, next) {
    	if (session.userData.release == null) {
			session.beginDialog('/application');
		} else {
			next();
		}
    },


    function (session, results, next) {
    	session.send('ok here is what I am going to do !');
    	var promptStr = session.userData.action + " Release " + session.userData.release + " on " + session.userData.env;
    	builder.Prompts.choice(session, promptStr, ["Yes","No"]);
    },

    function(session, results) {
    	if (results.response.entity == "No") {
    		session.send(":( I was so looking forward to it, will not go ahead... do try again!");
    	} else {
    		session.send("Super, I will get to it right away and keep you posted here!");
    	}
    	session.userData.action = null
		session.userData.release = null
		session.userData.env = null;		

    	session.endDialog();
    }
]);

intents.matches('StatusIntent', [

	function (session, args, next) {
        // Resolve and store any entities passed from LUIS.
        var action = builder.EntityRecognizer.findEntity(args.entities, 'ActionEntity');
        var env = builder.EntityRecognizer.findEntity(args.entities, 'EnvEntity');
        var app = builder.EntityRecognizer.findEntity(args.entities, 'AppEntity');
		
		if (env != null) {
			session.userData.env = env.entity;	
		}

		if (app != null) {
			session.userData.app = app.entity;
		}

		next();
	},

	function (session, results, next) {
    	if (session.userData.env == null) {
			session.beginDialog('/env');
		} else {
			next();
		}
    },

    function (session, results) {
    	if (session.userData.app == null)
    		session.send("Environment " + session.userData.env + " is up and running, everything healthy!");
    	else
    		session.send(session.userData.app + " on Environment " + session.userData.env + " is up and running, everything healthy!");
    	session.userData.app = null;
    	session.userData.env = null;
    	session.userData.action = null;
    	session.endDialog();
    }
]);

intents.onDefault([
    function (session, args) {
    	session.send("Hi, am OCE Ops Bot, I can deploy or provide you status on D1..D5 or T1..T6 environments!");

    	var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);

          session.send(msg);

    }
]);

bot.dialog('/env',[
	function(session) {
		var promptStr = "Which environment ?";
		builder.Prompts.choice(session, promptStr, ["Dev","Test"]);
	},

	function (session,results,next) {
		var promptStr = "Which Box ?";
		console.log(results.response.entity);
		if (String(results.response.entity).toUpperCase() == "DEV" || results.response.entity == "1") {
			builder.Prompts.choice(session, promptStr, ["D1","D2","D3","D4","D5"]);
		} else {
			builder.Prompts.choice(session, promptStr, ["T1","T2","T3","T4","T5"]);
		}
	},

	function(session,results) {
		console.log(results.response);
		session.userData.env = results.response.entity;
		session.endDialog();
	}
]);


bot.dialog('/release',[
	function(session) {
		var promptStr = "Which release would you like to " + session.userData.action + " ?";
	},

	function(session,results) {
		session.userData.release = results.response;
		session.endDialog();
	}
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);