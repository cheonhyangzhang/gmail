DEBUG = false;


var app = document.querySelector('#app');
app.heading = 'Gmail Inbox';
app.page = 'login';
app.main_page = 0;
app.threads = [];
app.selectedemail = 0;
app.selectedThread = null;

var Labels = {
  UNREAD: 'UNREAD',
  STARRED: 'STARRED'
};
var PROFILE_IMAGE_SIZE = 30;
var labels_search = {
	'INBOX':'category:primary || label:important',
	'STARRED':'label:starred',
	'IMPORTANT':'label:important',
	'DRAFTS':'label:drafts',
	'SENT':'label:sent'
}



var FROM_HEADER_REGEX = new RegExp(/"?(.*?)"?\s?<(.*)>/);

toggleDrawer = function(){
	drawer = document.querySelector('#drawerPanel');
	drawer.togglePanel();
}

//performance could be improved
function getValueForHeaderField(headers, field) {
  for (var i = 0, header; header = headers[i]; ++i) {
    if (header.name == field || header.name == field.toLowerCase()) {
      return header.value;
    }
  }
  return null;
}

SUBJECT_MAX_LENGTH = 60;

function processMessage(resp) {
	// console.log("Process Message");
  var messages = resp.result.messages;

  for (var j = 0, m; m = messages[j]; ++j) {
    var headers = m.payload.headers;

    // Example: Thu Sep 25 2014 14:43:18 GMT-0700 (PDT) -> Sept 25.
    var date = new Date(getValueForHeaderField(headers, 'Date'));
    m.date = date.toDateString().split(' ').slice(1, 3).join(' ');
    m.to = getValueForHeaderField(headers, 'To');
    m.subject = getValueForHeaderField(headers, 'Subject');
    if (typeof(m.subject) != 'undefined' && m.subject.length > SUBJECT_MAX_LENGTH){
    	// console.log(m.substring(0, SUBJECT_MAX_LENGTH));
    	m.subject = m.subject.substring(0, SUBJECT_MAX_LENGTH) + "..."
    }
    var fromHeaders = getValueForHeaderField(headers, 'From');
    var fromHeaderMatches = fromHeaders.match(FROM_HEADER_REGEX);

    m.from = {};

    // Use name if one was found. Otherwise, use email address.
    if (fromHeaderMatches) {
      // If no a name, use email address for displayName.
      m.from.name = fromHeaderMatches[1].length ? fromHeaderMatches[1] :
                                                  fromHeaderMatches[2];
      m.from.email = fromHeaderMatches[2];
    } else {
      m.from.name = fromHeaders.split('@')[0];
      m.from.email = fromHeaders;
    }
    m.from.name = m.from.name.split('@')[0]; // Ensure email is split.

    m.from.initial = m.from.name[0]
    // m.initial = m.from.name[0]

    m.unread = m.labelIds.indexOf(Labels.UNREAD) != -1;
    m.starred = m.labelIds.indexOf(Labels.STARRED) != -1;
  }

  // console.log(messages);
  return messages;
}
var emailsToLoad = 0;
var nextPageToken = ""
loadThreads = function(threads){
	emailsToLoad --;
	if (emailsToLoad == 0){
		app.threads = threads;
		console.log("load finished");
	}	
	else{
		console.log("Not finished loading");
	}
}
app.fetchMail = function(q, opt_callback) {
	console.log("fetchMail");	
  	var gmail = gapi.client.gmail.users;
	 // Fetch only the emails in the user's inbox.
	gmail.threads.list({userId: 'me', q: q, 'maxResults':15, 'nextPageToken':nextPageToken}).then(function(resp) {
	// gmail.threads.list({userId: 'me', q: q}).then(function(resp) {
	console.log(resp);
	nextPageToken = resp.result.nextPageToken;
	console.log('nextPageToken');
	console.log(nextPageToken);
    var threads = resp.result.threads;
	console.log(threads);
    // console.log("threads");
    // console.log(threads);
    console.log("before batch");
    var batch = gapi.client.newBatch();
    console.log("before foreach");
    emailsToLoad = threads.length;
    threads.forEach(function(thread, i) {
		var req = gmail.threads.get({userId: 'me', 'id': thread.id});
		batch.add(req);
		req.then(function(resp) {
			console.log("get messages");
			console.log(resp);
			thread.messages = processMessage(resp).reverse();
			console.log("process messages done");
			loadThreads(threads);
			//thread.archived = false;
			// Set entire thread data at once, when it's all been processed.

			// app.job('addthreads', function() {
			// 	console.log("job addthreads");
			// 	this.threads = threads;
			// 	console.log(app.threads);
			// 	opt_callback && opt_callback(threads);
			// }, 100);
		});
    });

    console.log("Before batch.then");
	batch.then();
    console.log("After batch.then");
	});
};
function getAllUserProfileImages(users, nextPageToken, callback) {
  gapi.client.plus.people.list({
    userId: 'me', collection: 'visible', pageToken: nextPageToken
  }).then(function(resp) {

    users = resp.result.items.reduce(function(o, v, i) {
      o[v.displayName] = v.image.url.replace(/(.+)\?sz=\d\d/, "$1?sz=" + PROFILE_IMAGE_SIZE);
      return o;
    }, users);

    if (resp.result.nextPageToken) {
      getAllUserProfileImages(users, resp.result.nextPageToken, callback);
    } else {
      callback(users);
    }

  });
}

//refreshInbox fields
app.refreshInbox = function(opt_callback) {
	console.log("refreshInbox");
  // var q = 'in:inbox';
  var q = 'category:primary || label:important';

  if (opt_callback) {
    app.fetchMail(q, opt_callback.bind(this));
  } else {
    app.fetchMail(q);
  }
};

refreshEmails = function(label){
	var q = labels_search[label];
	app.fetchMail(q);
}
goback = function(backto){
	console.log("goback");
	app.email_subject = "asdfdsasdflasdjflkadsjf";
	app.email_body = "asdfasdfsadflksdjflkasjdflkasdjflkj";
	console.log(app.email_subject)
	console.log(app.email_body)
	app.main_page = 0;
}
base64decode = function(data, callback){
	console.log("base64decode");
	var urlto = "http://frank-util.appspot.com/basecode64/decode";
	console.log(urlto);
	console.log(data);
	$.ajax({
		type : "POST",
		data:{encoded:data, callback:"JSON_CALLBACK"},
		url:urlto,
		// jsonpCallback: "JSON_CALLBACK",
		dataType: "jsonp",
		success:function(result){
			console.log("result");	
			console.log(result);
			callback(result);
		},
		error: function(e){
			console.log("error");
			console.log(e);
		}

	});
}
viewEmail = function(index){
	app.main_page = 1;
	app.selectedThread = app.threads[index];

	app.selectedemail = index;
	console.log("viewEmail : ");
	app.back_content = "Inbox"
	// console.log(index);
	// console.log(app.threads[index]);
	var thread = app.threads[index];
	var lastest_id = thread.messages[0].id;
  	var gmail = gapi.client.gmail.users;
	 // Fetch only the emails in the user's inbox.

	gmail.messages.get({userId: 'me', id:lastest_id, format:'full'}).then(function(resp) {
		console.log("messages.get");
		console.log(resp);
		// console.log(resp.result.payload.body);
	    app.email_subject = getValueForHeaderField(resp.result.payload.headers, 'Subject');
	    app.email_body = "";
	    // var payload = resp.result.payload;
	    var payloads = [];
	    payloads.push(resp.result.payload);
	   	while(payloads.length > 0){
	   		var payload = payloads.shift();
	   		if (payload.body.size != 0){
		    	body_str = Base64.decode(payload.body.data);
		    	body_holder = document.getElementById('body_holder');
				body_holder.innerHTML = body_str;
		    }
		    else{
			    if (payload.mimeType == "multipart/alternative"){
			    	console.log("multipart/alternative");
			    	// console.log(payload);

			    	// body_str = Base64.decode(payload.parts[1].body.data);
			    	body_str = ""
		    		body_str = Base64.decode(payload.parts[1].body.data)
		    		// body_str = atob(payload.parts[1].body.data)
		    		app.email_body = body_str;
		    		body_holder = document.getElementById('body_holder');
					body_holder.innerHTML = body_str;
			    	
			    	// body_str = atob(payload.parts[1].body.data);
			    }
			    else{
			    	if (payload.mimeType == "multipart/mixed"){
			    		payloads = payloads.concat(payload.parts);
			    	}
			    	else{
			    		alert("has not supported item");
			    	}
			    }
			}
	   	}//while  
	});
}

app.onSigninSuccess = function(e, detail, sender) {
	this.isAuthenticated = true;
	// Cached data? We're already using it. Bomb out before making unnecessary requests.
	if ((app.threads && app.users) || DEBUG) {
	return;
	}
	this.gapi = e.detail.gapi;
	gapi.client.load('gmail', 'v1').then(function() {
		console.log("Loaded gmail")
		var gmail = gapi.client.gmail.users;
		app.refreshInbox();
		// gmail.labels.list({userId: 'me'}).then(function(resp) {
		//   // Don't include system labels.
		//   // console.log(resp);
		//   // var labels = resp.result.labels.filter(function(label, i) {
		//   //   label.color = app.LABEL_COLORS[
		//   //       Math.round(Math.random() * app.LABEL_COLORS.length)];
		//   //   return label.type != 'system';
		//   // });

		//   // app.labels = labels;
		//   // app.labelMap = labels.reduce(function(o, v, i) {
		//   //   o[v.id] = v;
		//   //   return o;
		//   // }, {});

		// });
	});

	gapi.client.load('plus', 'v1').then(function() {

	// 	// Get user's profile pic, cover image, email, and name.
		gapi.client.plus.people.get({userId: 'me'}).then(function(resp) {
			// console.log("Get me in plus");
			// console.log(resp);
		  
	// 	  // var COVER_IMAGE_SIZE = 315;

		  var img = resp.result.image && resp.result.image.url.replace(/(.+)\?sz=\d\d/, "$1?sz=" + PROFILE_IMAGE_SIZE);
	// 	  // var coverImg = resp.result.cover && resp.result.cover.coverPhoto.url.replace(/\/s\d{3}-/, "/s" + COVER_IMAGE_SIZE + "-");

		  app.user = {
		    name: resp.result.displayName,
		    email: resp.result.emails[0].value,
		    profile_image: img
	// 	  //   cover: coverImg || null
		  };
		  // console.log("app.user");
		  // console.log(app.user);

	// 	  // app.$['navheaderstyle'].coverImg = coverImg;
	// 	  // app.$.navheader.classList.add('coverimg');

		  var users = {};

		  getAllUserProfileImages(users, null, function(users) {
		    app.users = users;
		    app.users[app.user.name] = app.user.profile; // signed in user.
		  });

		});//plus me

  	});//load plus

};//onSuccessLogin


app.datalist =[
	{'name':'Fuck', 'historyId':'2213'},
	{'name':'up', 'historyId':'34235234'}
]

