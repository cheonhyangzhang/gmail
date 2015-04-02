archiveEmail = function(threadid){
	gmail.threads.modify({userId:'me',id:threadid, removeLabelIds:["INBOX"]}).then(function(resp){
		console.log(resp);	
		app.main_page = 0;
		app.lastArchivedThread = app.threads[app.selectedThreadId];
		app.lastArchivedThreadId = threadid;
		document.querySelector('#emailArchived').show();
		app.threads.splice(app.selectedThreadId, 1);
		checkAlldone();
	});
}
unarchiveEmail = function(){
	console.log("unarchiveEmail");
	gmail.threads.modify({userId:'me',id:app.lastArchivedThreadId, addLabelIds:["INBOX"]}).then(function(resp){
		console.log(resp);	
		app.main_page = 0;
		app.threads.splice(app.selectedThreadId, 0, app.lastArchivedThread);
		checkAlldone();
	});
}
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
// unmoveEmailTo = function(){
// 	app.movetofolder = labelname;
// 	gmail.threads.modify({userId:'me',id:lastMovedThreadId,addLabelIds:[], removeLabelIds:[lastMovedThreadFolder]}).then(function(resp){
// 		console.log(resp);	
// 		document.querySelector('#labels_list').close();
// 		app.main_page = 0;
// 		document.querySelector('#emailMoved').show();
// 		app.threads.splice(app.selectedThreadId, 1);
// 		checkAlldone();
// 	});
// }

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