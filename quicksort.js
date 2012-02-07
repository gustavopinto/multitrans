// QuickSearch script for JabRef HTML export 
// Version: 3.0
//
// Copyright (c) 2006-2008, Mark Schenk
// Copyright (c) 2009, Holger Jeromin <jeromin(at)plt.rwth-aachen.de>, Chair of Process Control Engineering, Aachen University of Technology
//
// This software is distributed under a Creative Commons Attribution 3.0 License
// http://creativecommons.org/licenses/by/3.0/

// Some features:
// + optionally searches Abstracts and Reviews
// + allows RegExp searches
//   e.g. to search for entries between 1980 and 1989, type:  198[0-9]
//   e.g. for any entry ending with 'symmetry', type:  symmetry$
//   e.g. for all reftypes that are books: ^book$, or ^article$
//   e.g. for entries by either John or Doe, type john|doe
// + easy toggling of Abstract/Review/BibTeX

// Features from Holger Jeromin
// + incremental search in each column (input or dropdownbox)
// + global search can search with multiple search words in the row
//   global search of special regexp related to a cell is not possible anymore: ^2009$
//   but this is possible in the local searches
// + use of innerText/textContent for less function overhead

// Search settings
var searchAbstract = true;
var searchReview = true;

if (window.addEventListener) {
	window.addEventListener("load",initSearch,false); }
else if (window.attachEvent) {
	window.attachEvent("onload", initSearch); }

function initSearch() {

	// basic object detection
	if(!document.getElementById || !document.getElementsByTagName) { return; }
	if (!document.getElementById('qstable')||!document.getElementById('qs')) { return; }

	// find QS table and appropriate rows
	searchTable = document.getElementById('qstable');
	var allRows = searchTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

	// split all rows into entryRows and infoRows (e.g. abstract, review, bibtex)
	entryRows = new Array();
	infoRows = new Array(); absRows = new Array(); revRows = new Array();

	for (var i=0, k=0, j=0; i<allRows.length;i++) {
		if (allRows[i].className.match(/entry/)) {
			entryRows[j++] = allRows[i];
		} else {
			infoRows[k++] = allRows[i];
			// check for abstract/review
			if (allRows[i].className.match(/abstract/)) {
				absRows.push(allRows[i]);
			} else if (allRows[i].className.match(/review/)) {
				revRows.push(allRows[i]);
			}
		}
	}

	//number of entries and rows
	numRows = allRows.length;
	numEntries = entryRows.length;
	numInfo = infoRows.length;
	numAbs = absRows.length;
	numRev = revRows.length;

	//find the query field
	qsfield = document.getElementById('qsfield');

	//find statistics location
	stats = document.getElementById('stat');
	setStatistics(-1);

	// creates the appropriate search settings
	createQSettingsDialog();

	// shows the searchfield
	document.getElementById('qs').style.display = 'block';
	qsfield.onkeyup = testEvent;
	qsfield.onchange = testEvent;
}

function quickSearch(tInput){

	var localSearchArray = new Array();
	var globalSearchText = null;
	var globalSearch = new Array();
	// only search for valid RegExp
	//this input is in the global field and the user has typed something in
	if (qsfield == tInput && tInput.value != ""){
		//clear all other search fields
		for(var i=0; i<tableheaders.length; i++) {
			if (tableheaders[i].lastChild.nodeName == "INPUT"){
				tableheaders[i].lastChild.value = "";
			}else if (tableheaders[i].lastChild.nodeName == "SELECT"){
				tableheaders[i].lastChild.selectedIndex = 0;
			}
			tableheaders[i].lastChild.className = '';
		}
		try {
			globalSearchText = qsfield.value.split(" ");
			for (var i = 0; i < globalSearchText.length; i++){
				if (globalSearchText[i]){
					globalSearch[i] = new RegExp(globalSearchText[i],"i");
				}
			}
		}catch(err) {
			tInput.className = 'invalidsearch';
			if (window.console != null){
				window.console.error("Search Error: %s", err);
			}
			return;
		}
	//this input is a local search => clear the global search
	}else if (tInput.value != ""){
		qsfield.value = "";
	}
	closeAllInfo();
	qsfield.className = '';
	for(var i=0; i<tableheaders.length; i++) {
		if (tableheaders[i].lastChild.value != ""){
			try {
				if(searchSubString[i] == true){
					localSearchArray[i] = new RegExp(tableheaders[i].lastChild.value,"i")
				}else{
					localSearchArray[i] = new RegExp("^"+tableheaders[i].lastChild.value+"$","i")
				}
			}catch(err) {
				tableheaders[i].lastChild.className = 'invalidsearch';
				if (window.console != null){
					window.console.error("Search Error: %s", err);
				}
				return;
			}
		}
		tableheaders[i].lastChild.className = '';
	}
	
	// count number of hits
	var hits = 0;
	//initialise variable
	var t;
	var inCells;
	var numCols;
	
	// start looping through all entry rows
	for (var i = 0; cRow = entryRows[i]; i++){
		var found = false; 
		
		if (globalSearch.length == 0 && localSearchArray.length == 0){ 
			//no search selected
			found=true;
		}else if (globalSearch.length != 0){
			t = undefined != cRow.innerText?cRow.innerText:cRow.textContent;
			for (var k = 0; k < globalSearch.length; k++){
				if (t.search(globalSearch[k]) == -1){ 
					found=false;
					break;
				}else{
					found=true;
				}
			}
		}else{
			inCells = cRow.getElementsByTagName('td');
			numCols = inCells.length;
			for (var j=0; j<numCols; j++) {
				if (undefined != localSearchArray[j]){
					cCell = inCells[j];
					t = undefined != cCell.innerText?cCell.innerText:cCell.textContent;
					if (t.search(localSearchArray[j]) == -1){
						found=false;
						break;
					}else{
						found=true;
					}
				}
			}
		}
		// look for further hits in Abstract and Review
		if(!found) {
			var articleid = cRow.id;
			if(searchAbstract && (abs = document.getElementById('abs_'+articleid))) {
				for (var k = 0; k < globalSearch.length; k++){
					if ((undefined != abs.innerText?abs.innerText:abs.textContent).search(globalSearch[k]) == -1){ 
						found=false;
						break;
					}else{
						found=true;
					}
				}
			}
			if(searchReview && (rev = document.getElementById('rev_'+articleid))) {
				for (var k = 0; k < globalSearch.length; k++){
					if ((undefined != rev.innerText?rev.innerText:rev.textContent).search(globalSearch[k]) == -1){ 
						found=false;
						break;
					}else{
						found=true;
					}
				}
			}
			articleid = null;
		}
		
		if(found) {
			cRow.className = 'entry show';
			hits++;
		} else {
			cRow.className = 'entry noshow';
		}
	}
	
	// update statistics
	setStatistics(hits)
}

function toggleInfo(articleid,info) {
	var entry = document.getElementById(articleid);
	var abs = document.getElementById('abs_'+articleid);
	var rev = document.getElementById('rev_'+articleid);
	var bib = document.getElementById('bib_'+articleid);
	
	// Get the abstracts/reviews/bibtext in the right location
	// in unsorted tables this is always the case, but in sorted tables it is necessary. 
	// Start moving in reverse order, so we get: entry, abstract,review,bibtex
	if (searchTable.className.indexOf('sortable') != -1) {
		if(bib) { entry.parentNode.insertBefore(bib,entry.nextSibling); }
		if(rev) { entry.parentNode.insertBefore(rev,entry.nextSibling); }
		if(abs) { entry.parentNode.insertBefore(abs,entry.nextSibling); }
	}

	if (abs && info == 'abstract') {
		if(abs.className.indexOf('abstract') != -1) {
		abs.className.indexOf('noshow') == -1?abs.className = 'abstract noshow':abs.className = 'abstract';
		}
	} else if (rev && info == 'review') {
		if(rev.className.indexOf('review') != -1) {
		rev.className.indexOf('noshow') == -1?rev.className = 'review noshow':rev.className = 'review';
		}
	} else if (bib && info == 'bibtex') {
		if(bib.className.indexOf('bibtex') != -1) {
		bib.className.indexOf('noshow') == -1?bib.className = 'bibtex noshow':bib.className = 'bibtex';
		}		
	} else { 
		return;
	}

	// check if one or the other is available
	var revshow = false;
	var absshow = false;
	var bibshow = false;
	(abs && abs.className.indexOf('noshow') == -1)? absshow = true: absshow = false;
	(rev && rev.className.indexOf('noshow') == -1)? revshow = true: revshow = false;	
	(bib && bib.className == 'bibtex')? bibshow = true: bibshow = false;
	
	// highlight original entry
	if(entry) {
		if (revshow || absshow || bibshow) {
		entry.className = 'entry highlight show';
		} else {
		entry.className = 'entry show';
		}		
	}
	
	// When there's a combination of abstract/review/bibtex showing, need to add class for correct styling
	if(absshow) {
		(revshow||bibshow)?abs.className = 'abstract nextshow':abs.className = 'abstract';
	} 
	if (revshow) {
		bibshow?rev.className = 'review nextshow': rev.className = 'review';
	}
	
}

function setStatistics (hits) {
	if(hits < 0) { hits=numEntries; }
	if(stats) { stats.firstChild.data = hits + '/' + numEntries}
}


function showAll(){
	// first close all abstracts, reviews, etc.
	closeAllInfo();

	for (var i = 0; i < numEntries; i++){
		entryRows[i].className = 'entry show'; 
	}
}

function closeAllInfo(){
	for (var i=0; i < numInfo; i++){
		if (infoRows[i].className.indexOf('noshow') ==-1) {
			infoRows[i].className = infoRows[i].className + ' noshow';
		}
	}
}

function testEvent(e){
	if (!e) var e = window.event;
	quickSearch(this);
}

function clearQS() {
	qsfield.value = '';
	for(var i=0; i<tableheaders.length; i++) {
		if (tableheaders[i].lastChild.nodeName == "INPUT"){
			tableheaders[i].lastChild.value = "";
		}else if (tableheaders[i].lastChild.nodeName == "SELECT"){
			tableheaders[i].lastChild.selectedIndex = 0;
		}
		//get rid of error color
		tableheaders[i].lastChild.className = '';
	}
	quickSearch(qsfield);
}

function redoQS(){
	showAll();
	quickSearch(qsfield);
}

// Create Search Settings
function toggleQSettingsDialog() {

	var qssettings = document.getElementById('qssettings');
	
	if(qssettings.className.indexOf('active')==-1) {
		qssettings.className = 'active';

		if(absCheckBox && searchAbstract == true) { absCheckBox.checked = 'checked'; }
		if(revCheckBox && searchReview == true) { revCheckBox.checked = 'checked'; }

	} else {
		qssettings.className= '';
	}
}

function createQSettingsDialog(){
	var qssettingslist = document.getElementById('qssettings').getElementsByTagName('ul')[0];
	
	if(numAbs!=0) {
		var x = document.createElement('input');
		x.id = "searchAbs";
		x.type = "checkbox";
		x.onclick = toggleQSetting;
		var y = qssettingslist.appendChild(document.createElement('li')).appendChild(document.createElement('label'));
		y.appendChild(x);
		y.appendChild(document.createTextNode('search abstracts'));		
	}
	if(numRev!=0) {
		var x = document.createElement('input');
		x.id = "searchRev";
		x.type = "checkbox";		
		x.onclick = toggleQSetting;
		var y = qssettingslist.appendChild(document.createElement('li')).appendChild(document.createElement('label'));		
		y.appendChild(x);		
		y.appendChild(document.createTextNode('search reviews'));
	}
		
	// global variables
	absCheckBox = document.getElementById('searchAbs');
	revCheckBox = document.getElementById('searchRev');
	
	// show search settings
	if(absCheckBox||revCheckBox) {
		document.getElementById('qssettings').style.display = 'block';
	}
}

function toggleQSetting() {
	if(this.id=='searchAbs') { searchAbstract = !searchAbstract; }
	if(this.id=='searchRev') { searchReview = !searchReview; }
	redoQS()
}
-->
</script>
<script type="text/javascript">
<!--
// Automagically create a dropdown box for column heades marked with the 'dropd' class
// Mostly useful for year / BibTeX-type fields

if (window.addEventListener) {
window.addEventListener("load",populateSelect,false) }
else if (window.attachEvent) {
window.attachEvent("onload",populateSelect); }

function populateSelect() {
// find the column with the dropdowns
var searchTable = document.getElementById('qstable');
tableheaders = searchTable.getElementsByTagName('thead')[0].getElementsByTagName('th');
var allRows = searchTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
//initialise variables
var interactionelement;
var brelement;
var selectlist;
var colsinrow;
var entryContent;
var usedentries;
searchSubString = new Array(tableheaders.length);

for(var i=0; i<tableheaders.length; i++) {
if(tableheaders[i].className=="input") {
	interactionelement = document.createElement('input');
	interactionelement.type = "text";
	interactionelement.size = 10;
	interactionelement.autocomplete = "off";
	interactionelement.onkeyup = testEvent;
	interactionelement.onchange = testEvent;
	searchSubString[i] = true;
}else if(tableheaders[i].className=="dropd") {
	selectlist = new Array();
	for(var k=0; k<allRows.length; k++) {
		colsinrow = allRows[k].getElementsByTagName('td');
		if(colsinrow.length >= i) {
			entryContent = undefined != colsinrow[i].innerText?colsinrow[i].innerText:colsinrow[i].textContent;
			//avoid empty entrys
			if ("" != entryContent && undefined != entryContent){
				selectlist.push(entryContent);
			}
		}
	}
	// sort the entry array
	selectlist.sort();
	
	//clear duplicate entrys
	usedentries = new Array();
	usedentries.push(selectlist[0]);
	for(j=1; j<selectlist.length;j++) {
		if(selectlist[j]!= selectlist[j-1]) {
			usedentries.push(selectlist[j]);
		}
	}
	//create select Element
	interactionelement = document.createElement('select');
	//create descriptive first Element
	interactionelement.appendChild(document.createElement('option'));
	interactionelement.lastChild.appendChild(document.createTextNode('- all -'));
	interactionelement.lastChild.value = "";
	//create all Elements
	for(k=0; k<usedentries.length; k++) {
		interactionelement.appendChild(document.createElement('option'));
		interactionelement.lastChild.value = usedentries[k];
		interactionelement.lastChild.appendChild(document.createTextNode(usedentries[k]));
	}
	interactionelement.onchange = testEvent;
	searchSubString[i] = false;
}
//prevent clicking in the element start sorting the table
interactionelement.onclick = cancelBubble;
brelement = document.createElement('br');
tableheaders[i].appendChild(brelement);
tableheaders[i].appendChild(interactionelement);
}
}

function cancelBubble(e){
if (!e) var e = window.event;
e.cancelBubble = true;
if (e.stopPropagation) e.stopPropagation();	
}
function resetFilter(){
var typeselect = document.getElementById('reftypeselect');
typeselect.selectedIndex = 0;
}