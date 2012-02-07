
// Sort Table Script
// Version: 1.1
//
// Copyright (c) 2006-2008, Mark Schenk
// Copyright (c) 2009, Holger Jeromin <jeromin(at)plt.rwth-aachen.de>, Chair of Process Control Engineering, Aachen University of Technology

// Features from Holger Jeromin
// + use of innerText/textContent for less function overhead
// + search optimisation (only search in cell.firstchild) deactivated, firefox is fast enough with the use of textContent

// This software is distributed under a Creative Commons Attribution 3.0 License
// http://creativecommons.org/licenses/by/3.0/

// Sorting of columns with a lot of text can be slow, so some speed optimizations can be enabled,
// using the following variable
var SORT_SPEED_OPT = false;
// the optimization has one limitation on the functionality: when sorting search
// results, the expanded info, e.g. bibtex/review, is collapsed. In the non-optimized
// version they remain visible.

if (window.addEventListener) {
	window.addEventListener("load",initSortTable,false) }
else if (window.attachEvent) {
	window.attachEvent("onload", initSortTable); }

function initSortTable() {
	var alltables = document.getElementsByTagName('table');
	for(i=0;i<alltables.length;i++) {
		var currentTable = alltables[i];
		if(currentTable.className.indexOf('sortable') !=-1) {
			var thead = currentTable.getElementsByTagName('thead')[0];
			thead.title = 'Click on any column header to sort';
			for (var i=0;cell = thead.getElementsByTagName('th')[i];i++) {
				cell.onclick = function () { resortTable(this); };
				// make it possible to have a default sort column
				if(cell.className.indexOf('sort')!=-1) {
					resortTable(cell)
				}
			}
		}
	}
}

var SORT_COLUMN_INDEX;

function resortTable(td) {
	var column = td.cellIndex;
	var table = getParent(td,'TABLE');

	var allRows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
	var newRows = new Array();

	for (var i=0, k=0; i<allRows.length;i++) {

		var rowclass = allRows[i].className;

		if (rowclass.indexOf('entry') != -1) {
			newRows[k++] = allRows[i];
		}
		
		if (SORT_SPEED_OPT) {
			// remove highlight class
			allRows[i].className = rowclass.replace(/highlight/,'');
			// close information
			if(rowclass.indexOf('entry') == -1 && rowclass.indexOf('noshow') == -1) { allRows[i].className = rowclass + ' noshow';}
		}
	}

	// If other sort functions are deemed necessary (e.g. for
	// dates and currencies) they can be added.
	var sortfn = ts_sort_caseinsensitive;
	SORT_COLUMN_INDEX = column;
	newRows.sort(sortfn);

	// create a container for showing sort arrow
	var arrow =  td.getElementsByTagName('span')[0];
	if (!arrow) { var arrow = td.insertBefore(document.createElement('span'), td.childNodes[1]);}
	
	if (td.className) {
		if (td.className.indexOf('sort_asc') !=-1) {
			td.className = td.className.replace(/_asc/,"_des");
			newRows.reverse();
			arrow.innerHTML = ' &uarr;';
		} else if (td.className.indexOf('sort_des') !=-1) {
			td.className = td.className.replace(/_des/,"_asc");
			arrow.innerHTML = ' &darr;';
		} else { 
			td.className += ' sort_asc'; 
			arrow.innerHTML = ' &darr;';
		}
	} else {
		td.className += 'sort_asc';
		arrow.innerHTML = ' &darr;';
	}
	
	// Remove the classnames and up/down arrows for the other headers
	var ths = table.getElementsByTagName('thead')[0].getElementsByTagName('th');
	for (var i=0; i<ths.length; i++) {
		if(ths[i]!=td && ths[i].className.indexOf('sort_')!=-1) {
		// argh, moronic JabRef thinks (backslash)w is an output field!!
		//ths[i].className = ths[i].className.replace(/sort_(backslash)w{3}/,"");
		ths[i].className = ths[i].className.replace(/sort_asc/,"");
		ths[i].className = ths[i].className.replace(/sort_des/,"");

		// remove span
		var arrow =  ths[i].getElementsByTagName('span')[0];
		if (arrow) { ths[i].removeChild(arrow); }
		}
	}

	// We appendChild rows that already exist to the tbody, so it moves them rather than creating new ones
	for (i=0;i<newRows.length;i++) { 
		table.getElementsByTagName('tbody')[0].appendChild(newRows[i]);

		if(!SORT_SPEED_OPT){
		// moving additional information, e.g. bibtex/abstract to right locations
		// this allows to sort, even with abstract/review/etc. still open
		var articleid = newRows[i].id;

		var entry = document.getElementById(articleid);
		var abs = document.getElementById('abs_'+articleid);
		var rev = document.getElementById('rev_'+articleid);
		var bib = document.getElementById('bib_'+articleid);		
	
		var tbody = table.getElementsByTagName('tbody')[0];
		// mind the order of adding the entries
		if(abs) { tbody.appendChild(abs); }
		if(rev) { tbody.appendChild(rev); }
		if(bib) { tbody.appendChild(bib); }
		}
	}
}


function ts_sort_caseinsensitive(a,b) {
	aa = (undefined != a.cells[SORT_COLUMN_INDEX].innerText?a.cells[SORT_COLUMN_INDEX].innerText:a.cells[SORT_COLUMN_INDEX].textContent).toLowerCase();
	bb = (undefined != b.cells[SORT_COLUMN_INDEX].innerText?b.cells[SORT_COLUMN_INDEX].innerText:b.cells[SORT_COLUMN_INDEX].textContent).toLowerCase();
	if (aa==bb) return 0;
	if (aa<bb) return -1;
	return 1;
}

function ts_sort_default(a,b) {
	aa = (undefined != a.cells[SORT_COLUMN_INDEX].innerText?a.cells[SORT_COLUMN_INDEX].innerText:a.cells[SORT_COLUMN_INDEX].textContent);
	bb = (undefined != b.cells[SORT_COLUMN_INDEX].innerText?b.cells[SORT_COLUMN_INDEX].innerText:b.cells[SORT_COLUMN_INDEX].textContent);
	if (aa==bb) return 0;
	if (aa<bb) return -1;
	return 1;
}

function getParent(el, pTagName) {
	if (el == null) { 
		return null;
	} else if (el.nodeType == 1 && el.tagName.toLowerCase() == pTagName.toLowerCase()) {
		return el;
	} else {
		return getParent(el.parentNode, pTagName);
	}
}

