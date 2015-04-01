DEBUG = false;
function nowSearchTerm(){
	var today_time = new Date();
	var tomorrow_time = new Date();
	var dd = today_time.getDate();
	var mm = today_time.getMonth()+1; //January is 0!
	var yyyy = today_time.getFullYear();

	var today = yyyy +'/' + mm + '/' + dd;	
	tomorrow_time.setDate(today_time.getDate() + 1);
	dd = tomorrow_time.getDate();
	mm = tomorrow_time.getMonth()+1; //January is 0!
	yyyy = tomorrow_time.getFullYear();
	var tommorow = yyyy +'/' + mm + '/' + dd;	
	var q = 'after:'+today+" "+"before:"+ tommorow+" !is:chats in:inbox";
	console.log(q);
	return q;
}


function labelCompare(a,b) {
  if (a.name < b.name)
     return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}

var app = document.querySelector('#app');
app.labels_opened = true;
app.alldone = false;
app.heading = 'Today';
app.loading = false;
app.page = 'login';
app.main_page = 0;
app.threads = [];
app.selectedemail = 0;
app.selectedThread = null;
app.selectedThreadId = null;
app.lastTrashedThread = null;
app.lastTrashedThreadId = null;
app.movetofolder = null;
// app.list_q = "category:primary || label:important";
app.list_q = nowSearchTerm();
app.labels = [];
var gmail = null;
var Labels = {
  UNREAD: 'UNREAD',
  STARRED: 'STARRED'
};
var PROFILE_IMAGE_SIZE = 30;
var labels_search = {
	// 'INBOX':'category:primary || label:important !is:chats',
	'INBOX':'label:inbox !is:chats',
	'STARRED':'label:starred !is:chats',
	'IMPORTANT':'label:important !is:chats',
	'DRAFTS':'label:drafts !is:chats',
	'SENT':'label:sent !is:chats'
}



var FROM_HEADER_REGEX = new RegExp(/"?(.*?)"?\s?<(.*)>/);
moveEmailTo = function(threadid, labelid, labelname ){
	console.log("moveEmailTo");
	app.movetofolder = labelname;
	console.log(labelid);
	gmail.threads.modify({userId:'me',id:threadid,addLabelIds:[labelid], removeLabelIds:["INBOX"]}).then(function(resp){
		console.log(resp);	
		document.querySelector('#labels_list').close();
		app.main_page = 0;
		document.querySelector('#emailMoved').show();
		app.threads.splice(app.selectedThreadId, 1);
		checkAlldone();
	});
}
app.showLabels = function(e){
	// document.querySelector('#labels_list').open();
	e.target.dropdown = document.querySelector('#labels_list');
	e.target.dropdown.relatedTarget = e.target;
	e.target.dropdown.open();
}
toggleDrawer = function(){
	drawer = document.querySelector('#drawerPanel');
	drawer.togglePanel();
}

trashEmail = function(id){
	console.log("trashEmail");
	console.log(id);
	gmail.threads.trash({userId:'me', id:id}).then(function(resp){
		console.log("email trashed");
		console.log(resp);
		// lastTrashedThread = $.extend({}, app.threads[app.selectedThreadId]);
		lastTrashedThread = app.threads[app.selectedThreadId];
		lastTrashedThreadId = id;
		app.threads.splice(app.selectedThreadId, 1);
		document.querySelector('#emailTrashed').show();
		app.main_page = 0;
		checkAlldone();
	});
}
untrashEmail = function(){
	console.log("untrashEmail");
	gmail.threads.untrash({userId:'me', id:lastTrashedThreadId}).then(function(resp){
		console.log("email trashed");
		console.log(resp);

		app.threads.splice(app.selectedThreadId,0,lastTrashedThread)
		lastTrashedThreadId = null;
		lastTrashedThread = null;
		checkAlldone();
	});
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
  var messages = resp.result.messages;
  for (var j = 0, m; m = messages[j]; ++j) {
    var headers = m.payload.headers;
    //Example: Thu Sep 25 2014 14:43:18 GMT-0700 (PDT) -> Sept 25.
    var date = new Date(getValueForHeaderField(headers, 'Date'));
    m.date = date.toDateString().split(' ').slice(1, 3).join(' ');
    m.to = getValueForHeaderField(headers, 'To');
    m.subject = getValueForHeaderField(headers, 'Subject');
    // if (typeof(m.subject) != 'undefined' && m.subject.length > SUBJECT_MAX_LENGTH){
    	// console.log("Defined");
    // 	m.subject = m.subject.substring(0, SUBJECT_MAX_LENGTH) + "..."
    // }
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
    m.initial = m.from.name[0]

    // m.unread = m.labelIds.indexOf(Labels.UNREAD) != -1;
    // m.starred = m.labelIds.indexOf(Labels.STARRED) != -1;
  }

  return messages;
}

checkAlldone = function(){
	if (typeof(app.threads) == "undefined" || app.threads.length == 0){
		app.alldone = true;	
	}
	else{
		app.alldone = false;
	}
}
var emailsToLoad = 0;
var nextPageToken = ""
loadThreads = function(threads){
	emailsToLoad --;
	if (emailsToLoad == 0){
		app.threads = app.threads.concat(threads);
		app.loading = false;
		console.log(threads);
	}	
}
app.fetchMail = function(q, opt_callback) {
			app.alldone = false;
	console.log("fetchMail");	
	 // Fetch only the emails in the user's inbox.
	gmail.threads.list({userId: 'me', q: q, 'maxResults':10, pageToken:nextPageToken}).then(function(resp) {
		console.log(resp);
		if (!resp.result.threads){
			app.loading = false;
			app.alldone = true;
			return;
		}
	nextPageToken = resp.result.nextPageToken;
    var threads = resp.result.threads;
    var batch = gapi.client.newBatch();
    emailsToLoad = threads.length;
    threads.forEach(function(thread, i) {
		var req = gmail.threads.get({userId: 'me', 'id': thread.id});
		batch.add(req);
		req.then(function(resp) {
			thread.messages = processMessage(resp).reverse();
			loadThreads(threads);
		});
    });

	batch.then();
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
app.refreshInbox = function(e) {
	app.main_page = 0;
	console.log("refreshInbox");
	app.loading = true;
  	// var q = 'in:inbox';
  	app.threads = [];
  	nextPageToken = "";
  	var q = app.list_q;
  	app.fetchMail(q);
};
refreshInboxWithLabel = function(label){
	console.log("refreshInboxWithLabel");
	app.heading = label;
	if (label == "NOW"){
		console.log("Now");
		app.list_q = nowSearchTerm();
		console.log(app.list_q);
	}
	else{
		app.list_q = labels_search[label];
	}

	app.refreshInbox();
}
app.loadMoreEmails = function(e){
	console.log("loadMoreEmails");
	console.log(nextPageToken);
	if (typeof(nextPageToken) === 'undefined' || nextPageToken == ""){
		console.log("No more");
	}
	else{
	  	var q = app.list_q;
	  	app.fetchMail(q);
	}
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
	app.selectedThreadId = index;

	app.selectedemail = index;
	console.log("viewEmail : ");
	app.back_content = "Inbox"
	// console.log(index);
	// console.log(app.threads[index]);
	var thread = app.threads[index];
	var lastest_id = thread.messages[0].id;
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
		    	body_str.replace(/<a href="/g, '<a target="_blank" href="');
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
			    	body_str = body_str.replace(/<a href="/g, '<a target="_blank" href="');
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
		gmail = gapi.client.gmail.users;
		gmail.labels.list({userId:'me'}).then(function(resp){
			console.log("list labels");
			console.log(resp);

			app.labels = resp.result.labels.sort(labelCompare);
		});


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

