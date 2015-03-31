'use strict';

(function() {

	var ssheet = angular.module('ssheet', []);

	/**
	* @method cellFinder A Service that provides some helper functions for dealing with the grid
	*/
	ssheet.factory('cellFinder', [function() {
		var getDataCellIdFromSpacerCell;
		var getRowFromCellId;
		var getColumnFromCellId;
		var getCurrentColumnForCell;
		var getCurrentColumnForCellFromId;
		var getCurrentRowForCell;
		var getCurrentRowForCellFromId;
		
		return {
			
			/*
			* @method a spacer cell has an id in the format spacer_[row]_[column]
			* this method returns the id in the format that the data cell has, namely [row]_[column]
			* @param spacerCellElement The DOM element that is the spacer cell
			* @return {String} the id in the format that the data cells use
			*/
			getDataCellIdFromSpacerCell: function (spacerCellElement) {
				// the spacer cell has an id like this
				// spacer_[row]_[column]
				// whereas a data cell has an id like this
				// [row]_[column]
				// ...so remove the 'spacer_' part to get the data cell's id
				var spacerCellIdArr = spacerCellElement.attr('id').split('_');
				return spacerCellIdArr[1] + '_' + spacerCellIdArr[2];
			},
			
			/**
			* @method getRowFromCellId Given a cell id string, in the format either spacer_[row]_[column], or [row]_[column],
			* return the row as an int
			* @return {int} row number
			*/
			getRowFromCellId: function (cellIdStr) {
				var cellInfoArr = cellIdStr.split('_');
				
				if (cellInfoArr.length == 3) {
					//in this case we expect the cellIdStr to be in the format spacer_[row]_[column]
					// so the row is the 2nd array element
					return parseInt( cellInfoArr[1] );
					
				} else if (cellInfoArr.length == 2) {
					// in this case we expect the cellIdStr to be in the format [row]_[column]
					// so the row is the 1st array element
					return parseInt( cellInfoArr[0] );
					
				} else {
					throw 'Error: the cell id string ' + cellIdStr + ' was not in one of the expected formats';
				}
			},
			
			/**
			* @method getColumnFromCellId Given a cell id string, in the format either spacer_[row]_[column], or [row]_[column],
			* return the column as an int
			* @return {int} column number
			*/
			getColumnFromCellId: function (cellIdStr) {
				var cellInfoArr = cellIdStr.split('_');
				
				if (cellInfoArr.length == 3) {
					//in this case we expect the cellIdStr to be in the format spacer_[row]_[column]
					// so the column is the 3rd array element
					return parseInt( cellInfoArr[2] );
					
				} else if (cellInfoArr.length == 2) {
					// in this case we expect the cellIdStr to be in the format [row]_[column]
					// so the column is the 2nd array element
					return parseInt( cellInfoArr[1] );
					
				} else {
					throw 'Error: the cell id string ' + cellIdStr + ' was not in one of the expected formats';
				}
			},		
			
			/**
			* @method getCurrentColumnForCellFromId When the user clicks on a "spacer" cell
			* this returns an array with all the cells in the column to the immediate left of the spacer.
			* This is done so the user can drag the width of a column by dragging the spacer cell
			* @param {String} cellIdStr The id of the cell in the format spacer_[row]_[column]
			* @param {Object} grid The JSON object representing the grid
			*/
			getCurrentColumnForCellFromId: function (cellIdStr, grid) {
				var rowObj;
				var columnArr = [];

				// the id attribute of the spacer cell is in the format 
				// spacer_[row number]_[column number]
				// so split on '_' and get the 3rd array value to get the column number
				var col = parseInt( cellIdStr.split('_')[2] ); 
				
				// put all the cells in the column into the columnArr
				for (rowObj in grid) {
					columnArr.push( grid[rowObj].cells[col] );
				}
				
				return columnArr;
			},
			
			/**
			* @method getCurrentRowForCellFromId When the user clicks on a "spacer" cell
			* This returns an array with all the cells in the row the user clicked on.
			* This is done so the user can drag the height of a column by dragging the spacer cell
			* @param {String} cellIdStr The id of the cell in the format spacer_[row]_[column]
			* @param {Object} grid The JSON object representing the grid
			*/
			getCurrentRowForCellFromId: function (cellIdStr, grid) {
				// the id attribute of the spacer cell the format 
				// spacer_[row number]_[column number]
				// so split on '_' and get the 2nd array value to get the row number
				var row = parseInt( cellIdStr.split('_')[1] );
				return grid[row]['cells'];
			}
			
		}
	}]);


	ssheet.factory('filterByCellData', ['cellFinder', function (cellFinder) {
		var toggleCellRowFilter;
		
		return {
			
			/**
			* The user is toggling whether the current cell to be a row filter.
			* If row filtering is turned on, that means cells in the current column, 
			* which do not contain the text matching the current cell,
			* will have their whole row made invisible
			*/
			toggleCellRowFilter: function (cellIdStr, grid) {
				var i;
				var j;
				var allFilters = [];
				var cellShouldBeHidden;
				
				var colArr = cellFinder.getCurrentColumnForCellFromId( cellIdStr, grid );
				var currentRow = cellFinder.getRowFromCellId( cellIdStr );
				var currentColumn = cellFinder.getColumnFromCellId( cellIdStr );
				var currentCellData = grid[currentRow].cells[currentColumn].contents;
				
				//toggle the row filter value 
				grid[currentRow].cells[currentColumn].isRowFilter = !grid[currentRow].cells[currentColumn].isRowFilter;
				
				
				// loop thru all the cells in the current column to find the current set of filters
				for (i=0; i<colArr.length; i++) {
					if ( colArr[i].isRowFilter ) {
						allFilters.push( colArr[i].contents );
					}
				}
				
				// Any cell that does not contain the text in all of the filter cells should be hidden
				for (i=0; i<colArr.length; i++) {	
					cellShouldBeHidden = false;
					j=0;
					while( !cellShouldBeHidden && j<allFilters.length ) {
						if ( colArr[i].contents.indexOf(allFilters[j]) == -1 ) {
							cellShouldBeHidden = true;
						}
						j++;
					}
					grid[i].isVisible = !cellShouldBeHidden;
				}
				return grid;
			},
		}
	}]);

	

	ssheet.controller('GridController', ['$scope', function ($scope) {
		$scope.gridwidth = 8;
		$scope.gridheight = 8;
		$scope.grid = [];
		$scope.filterRow = [];
		$scope.currentColumnArr = [];
		$scope.currentColumnIndex = -1;
		
		// global setting for minimum height and width of cells - need this in some kind of config file
		$scope.minWidth = 20;
		$scope.minHeight = 12;
		
		$scope.init = function () {
			var i;
			var j;
			var cells;
			
			/******
			* initialize the grid by creating empty cells the size of the gridwidth and gridheight
			* the grid object looks like this sort of thing
			* [
			* 	{row: 0, isVisible: true, cells: [
			* 		{cellId: '0_0', col: 0, contents: '', isVisible: true, isRowFilter: false},
			* 		{cellId: '0_1', col: 1, contents: '', isVisible: true, isRowFilter: false},
			* 		{cellId: '0_2', col: 2, contents: '', isVisible: true, isRowFilter: false},	
			* 	]},
			* 	{row: 1, isVisible: true, cells: [
			* 		{cellId: '1_0', col: 0, contents: '', isVisible: true, isRowFilter: false},
			* 		{cellId: '1_1', col: 1, contents: '', isVisible: true, isRowFilter: false},
			* 		{cellId: '1_2', col: 2, contents: '', isVisible: true, isRowFilter: false},
			* 	]},
			* ]
			*****/
			for (i=0; i<$scope.gridheight; i++) {
				cells = [];
				for (j=0; j<$scope.gridwidth; j++) {
					cells[j] = {'cellId' : i + '_' + j, 'col': j, 'contents' : '', 'isVisible' : true, 'isRowFilter' : false};
				}
				$scope.grid[i] = {'row' : i, 'isVisible' : true, 'cells' : cells};
			}
		}
		
		$scope.init();
		
		
		
		/**** tool menu hide/show stuff ********/
		$scope.showToolMenu = false;
		$scope.toggleToolMenuInCtrl = function () {
			$scope.showToolMenu = !$scope.showToolMenu;
			console.log('toggleToolMenuInCtrl: $scope.showToolMenu is now ' + $scope.showToolMenu);
		}
		
		$scope.showToolMenuInCtrl = function () {
			
			$scope.showToolMenu = true;
			console.log('showToolMenuInCtrl: $scope.showToolMenu is now ' + $scope.showToolMenu);
		}
		
	}]);

	
	
	/**
	* @method ssCellDrag A directive that allows for:
	* - dragging of a "spacer" table cell, (thin cells in between the cells with actual data) in order to 
	* change the width & height of the cell to the left of the spacer;
	* - showing the context menu when right-clicking on the spacer
	* @param $document The Angularjs handle for the window.document object
	* @param {Function} cellFinder a helper service that finds cells in the grid
	*/
	ssheet.directive('ssCellDrag', ['$document', 'cellFinder',  
		function ($document, cellFinder) {
		
		return {
			
			restrict: 'E',
			replace: true,
			//transclude: true,
			templateUrl: 'cellDrag.html',
			
			scope: {
				minWidth: '=minWidthInElement',
				minHeight: '=minHeightInElement',
				grid: '=gridInElement',
				filterRow: '=filterRowInElement'
			},
			
			
			link: function (scope, element, attrs) {
				var initialX = 0;
				var initialWidth = 0;
				var initialY = 0;
				var initialHeight = 0;
				var xDistance = 0;
				var yDistance = 0;
				
				var rowArr = [];
				var colArr = [];
				
				element.on('mousedown', function (event) {
					var cellId;
					
					console.log('mousedown');
					
					event.preventDefault();
					
					$('html').css('cursor', 'se-resize');
					
					initialX = event.pageX - xDistance;
					initialY = event.pageY - yDistance;
					
					cellId = '#' + cellFinder.getDataCellIdFromSpacerCell(element);
					initialWidth = parseInt( $(cellId).css('width') );
					initialHeight = parseInt( $(cellId).css('height') );
					
					colArr = cellFinder.getCurrentColumnForCellFromId( element.attr('id'), scope.grid );
					rowArr = cellFinder.getCurrentRowForCellFromId( element.attr('id'), scope.grid );
					
					$document.on('mousemove', mousemoveHandler);
					$document.on('mouseup', mouseupHandler);		
				});
				
			
				
				function mousemoveHandler(event) {
					var cellIndex;
					var cell;
					var cellId;
					var newWidth;
					var newHeight;
					
					xDistance = event.pageX - initialX;
					yDistance = event.pageY - initialY;
					
					//set the new width of the column immediately to the left, but don't go smaller than the minimum width
					newWidth = initialWidth + xDistance;
					if (newWidth < scope.minWidth) {
						newWidth = scope.minWidth;
					}
					
					newHeight = initialHeight + yDistance;
					if (newHeight < scope.minHeight) {
						newHeight = scope.minHeight;
					}
					
					// console.log('newWidth=' + newWidth + ' initialX=' +initialX + ' xDistance=' + xDistance);
					// console.log('newHeight=' + newHeight + ' initialY=' +initialY + ' yDistance=' + yDistance);
						
					//adjust the width of all cells in the column
					for (cellIndex in colArr) {
						cell = colArr[cellIndex];
						cellId = '#' + cell.cellId;
						$(cellId).css('width', newWidth);
						//console.log('mousemoveHandler: just set cellId ' + cellId + ' to newWidth ' + newWidth);
					}
					
					//adjust the height of all the cells in the row
					for (cellIndex in rowArr) {
						cell = rowArr[cellIndex];
						cellId = '#' + cell.cellId;
						$(cellId).css('height', newHeight);
						// console.log('mousemoveHandler: just set cellId ' + cellId + ' to newHeight ' + newHeight);
					} 
				};
				
				// reset everything once the mouse-drag is over
				function mouseupHandler (event){
					console.log('mouseup caught by mouseupHandler');
					
					//remove the event handlers now the mouse drag is over
					$document.off('mousemove', mousemoveHandler);
					$document.off('mouseup', mouseupHandler);
					
					//reset all the function-wide variables
					initialX = 0;
					initialWidth = 0;
					initialY = 0;
					initialHeight = 0;
					xDistance = 0;
					yDistance = 0;
					
					$('html').css('cursor', 'auto');
					element.css('position', 'static');
				};

			}
		}
		
	}]);

	
	ssheet.controller('CellToolsController', ['filterByCellData', '$scope', function (filterByCellData, $scope) {
		$scope.onCellToolsClick = function ($event) {
			console.log('onCellToolsClick: idOfCurrentElement=' + $scope.idOfCurrentElement);
			console.log('...and $event.pageX is ' + $event.pageX + ', $event.pageY is ' + $event.pageY);
			
			$('#ss-cell-context-menu').css('top', $event.pageY);
			$('#ss-cell-context-menu').css('left', $event.pageX + 10); ////BAAADD having magic nubmer in here. also bad having id ss-cell-context-menu


			// make the tool menu visible
			$scope.showToolMenuInDirective();
			
			// toggle filtering rows, based on the data in this cell (this will be moved to somehwere else eventually)
			$scope.gridInCellToolsDirective = filterByCellData.toggleCellRowFilter( $scope.idOfCurrentElement, $scope.gridInCellToolsDirective );
		}
	}]);

	 
	ssheet.directive('ssCellTools', [ function () {  
			
		return {
			
			restrict: 'E',
			replace: true,
			//transclude: true,
			templateUrl: 'cellTools.html',
			
			scope: {
				idOfCurrentElement: '@id', //makes the element's id attribute available here in the directive
				gridInCellToolsDirective: '=gridInCellToolsElement',
				showToolMenuInDirective: '&showToolMenuInElement',
			},
			
			controller: 'CellToolsController',
		}
	}]);




	ssheet.directive('contextMenuDialog', [ function () {
		return {
			restrict: 'EA',
			
			scope: {
				showInDirective: '=showInElement',
			},
			
			// replace means that the <context-menu-dialog> tag itself will be replaced by the template, rather than being the parent of the template's html
			// however the attributes of the <context-menu-dialog> will be added to the top level element in the template
			replace: true, 
			transclude: true, /// this means that the content in between the tags <context-menu-dialog></context-menu-dialog> will be inserted in the template where "ng-transclude" appears
			
			link: function (scope, element, attrs) {
				
				scope.hideToolMenu = function() {
					scope.showInDirective = false;
				};
				
			},
			
			templateUrl: 'contextMenuDialog.html',
		}
	}]);
	

})();