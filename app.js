DEBUG = false;


var app = document.querySelector('#app');
app.heading = 'Gmail Inbox';
app.page = 'login';

var Labels = {
  UNREAD: 'UNREAD',
  STARRED: 'STARRED'
};

var FROM_HEADER_REGEX = new RegExp(/"?(.*?)"?\s?<(.*)>/);

toggleDrawer = function(){
	drawer = document.querySelector('#drawerPanel');
	drawer.togglePanel();
}
function getValueForHeaderField(headers, field) {
  for (var i = 0, header; header = headers[i]; ++i) {
    if (header.name == field || header.name == field.toLowerCase()) {
      return header.value;
    }
  }
  return null;
}
function fixUpMessages(resp) {
  var messages = resp.result.messages;

  for (var j = 0, m; m = messages[j]; ++j) {
    var headers = m.payload.headers;

    // Example: Thu Sep 25 2014 14:43:18 GMT-0700 (PDT) -> Sept 25.
    var date = new Date(getValueForHeaderField(headers, 'Date'));
    m.date = date.toDateString().split(' ').slice(1, 3).join(' ');
    m.to = getValueForHeaderField(headers, 'To');
    m.subject = getValueForHeaderField(headers, 'Subject');

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

    m.unread = m.labelIds.indexOf(Labels.UNREAD) != -1;
    m.starred = m.labelIds.indexOf(Labels.STARRED) != -1;
  }

  return messages;
}

app.fetchMail = function(q, opt_callback) {
	console.log("Gmail.fetchMeail");
  	var gmail = gapi.client.gmail.users;

	  // Fetch only the emails in the user's inbox.
	  gmail.threads.list({userId: 'me', q: q}).then(function(resp) {
	    var threads = resp.result.threads;
	    var batch = gapi.client.newBatch();
	    threads.forEach(function(thread, i) {
	      var req = gmail.threads.get({userId: 'me', 'id': thread.id});
	      batch.add(req);
	      req.then(function(resp) {
	        thread.messages = fixUpMessages(resp).reverse();
	        //thread.archived = false;

	        // Set entire thread data at once, when it's all been processed.
	        app.job('addthreads', function() {
	          this.threads = threads;
	          opt_callback && opt_callback(threads);
	        }, 100);

	      });
	    });

	    batch.then();
	    console.log(threads);
	  });
};

app.refreshInbox = function(opt_callback) {
  var q = 'in:inbox';

  if (opt_callback) {
    app.fetchMail(q, opt_callback.bind(this));
  } else {
    app.fetchMail(q);
  }
};

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
		// app.refreshInbox();

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
			console.log("Get me in plus");
			console.log(resp);
		  var PROFILE_IMAGE_SIZE = 40;
	// 	  // var COVER_IMAGE_SIZE = 315;

		  var img = resp.result.image && resp.result.image.url.replace(/(.+)\?sz=\d\d/, "$1?sz=" + PROFILE_IMAGE_SIZE);
	// 	  // var coverImg = resp.result.cover && resp.result.cover.coverPhoto.url.replace(/\/s\d{3}-/, "/s" + COVER_IMAGE_SIZE + "-");

		  app.user = {
		    name: resp.result.displayName,
		    email: resp.result.emails[0].value,
		    profile_image: img
	// 	  //   cover: coverImg || null
		  };
		  console.log("app.user");
		  console.log(app.user);

	// 	  // app.$['navheaderstyle'].coverImg = coverImg;
	// 	  // app.$.navheader.classList.add('coverimg');

	// 	  // var users = {};

	// 	  // getAllUserProfileImages(users, null, function(users) {
	// 	  //   app.users = users;
	// 	  //   app.users[app.user.name] = app.user.profile; // signed in user.
	// 	  // });

		});//plus me

  	});//load plus

};//onSuccessLogin




