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
			* @param {String} cellIdStr The id of the cell in the format spacer_[row]_[column]
			* @param {Object} grid The JSON object representing the grid
			* @return {Array} an array of cells in the column
			*/
			getCurrentColumnForCellFromId: function (cellIdStr, grid) {
				var rowObj;
				var columnArr = [];
				var col = this.getColumnFromCellId( cellIdStr ); 
				
				// put all the cells in the column into the columnArr
				for (rowObj in grid) {
					columnArr.push( grid[rowObj].cells[col] );
				}
				
				return columnArr;
			},
			
			/**
			* @method getCurrentRowForCellFromId When the user clicks on a "spacer" cell
			* This returns an array with all the cells in the row the user clicked on.
			* @param {String} cellIdStr The id of the cell in the format spacer_[row]_[column]
			* @param {Object} grid The JSON object representing the grid
			* @return {Array} an array of cells in the row
			*/
			getCurrentRowForCellFromId: function (cellIdStr, grid) {
				var row = this.getRowFromCellId( cellIdStr );
				return grid[row]['cells'];
			},
			
			/**
			* @method getCurrentCellFromId Return the single cell in the grid that is represented by the cellIdStr
			* @param {String} cellIdStr The id of the cell in the format spacer_[row]_[column]
			* @param {Object} grid The JSON object representing the grid
			* @return {Object} the cell indicated byt the cellIdStr
			*/
			getCurrentCellFromId: function (cellIdStr, grid) {
				var col = this.getColumnFromCellId( cellIdStr );
				var row = this.getRowFromCellId( cellIdStr );
				return grid[row].cells[col];
			},
			
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
			
			
			
			/**
			* The user is toggling whether the current cell to be a column filter.
			* If column filtering is turned on, that means cells in the same row, 
			* which do not contain the text matching the current cell,
			* will have their whole column made invisible
			*/
			toggleCellColumnFilter: function (cellIdStr, grid) {
				var i;
				var j;
				var allFilters = [];
				var cellShouldBeHidden;
				var currentColArr = [];
				
				var rowArr = cellFinder.getCurrentRowForCellFromId( cellIdStr, grid );
				var currentRow = cellFinder.getRowFromCellId( cellIdStr );
				var currentColumn = cellFinder.getColumnFromCellId( cellIdStr );
				
				//toggle the column filter value 
				grid[currentRow].cells[currentColumn].isColumnFilter = !grid[currentRow].cells[currentColumn].isColumnFilter;
				
				// loop thru all the cells in the current row to find the current set of filters
				for (i=0; i<rowArr.length; i++) {
					if ( rowArr[i].isColumnFilter ) {
						allFilters.push( rowArr[i].contents );
					}
				}
				
				// Any cell that does not contain the text in all of the filter cells should be hidden
				for (i=0; i<rowArr.length; i++) {	
					cellShouldBeHidden = false;
					j=0;
					while( !cellShouldBeHidden && j<allFilters.length ) {
						if ( rowArr[i].contents.indexOf(allFilters[j]) == -1 ) {
							cellShouldBeHidden = true;
						}
						j++;
					}
					
					// if a cell is to be hidden, then its whole column should be hidden
					// and vice-versa if it is not
					currentColArr = cellFinder.getCurrentColumnForCellFromId( rowArr[i].cellId, grid );
					
					for (j=0; j<currentColArr.length; j++) {
						currentColArr[j].isVisible = !cellShouldBeHidden;
					}
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
			* 		{cellId: '0_0', col: 0, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},
			* 		{cellId: '0_1', col: 1, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},
			* 		{cellId: '0_2', col: 2, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},	
			* 	]},
			* 	{row: 1, isVisible: true, cells: [
			* 		{cellId: '1_0', col: 0, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},
			* 		{cellId: '1_1', col: 1, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},
			* 		{cellId: '1_2', col: 2, contents: '', isVisible: true, isRowFilter: false, isColumnFilter: false},
			* 	]},
			* ]
			*****/
			for (i=0; i<$scope.gridheight; i++) {
				cells = [];
				for (j=0; j<$scope.gridwidth; j++) {
					cells[j] = {'cellId' : i + '_' + j, 'col': j, 'contents' : '', 'isVisible' : true, 'isRowFilter' : false, 'isColumnFilter' : false};
				}
				$scope.grid[i] = {'row' : i, 'isVisible' : true, 'cells' : cells};
			}
		}
		
		$scope.init();
		
		/**** tool menu hide/show stuff ********/
		$scope.showToolMenu = false;
		// $scope.toggleToolMenuInCtrl = function () {
		// 	$scope.showToolMenu = !$scope.showToolMenu;
		// 	console.log('toggleToolMenuInCtrl: $scope.showToolMenu is now ' + $scope.showToolMenu);
		// }
		
		$scope.showToolMenuInCtrl = function () {
			$scope.showToolMenu = true;
			console.log('showToolMenuInCtrl: $scope.showToolMenu is now ' + $scope.showToolMenu);
			
			//some cool animation of the dialog when it appears
			TweenLite.from('#ss-cell-tool-menu', 1.5, {ease: Back.easeOut.config(1), scaleX:0, scaleY:0});
		}
		
		//when the user clicks on the orange cell-tools button this will be updated with the id of the cellTools button
		$scope.idOfCurrentElement = '';
		// ...and this will be given the value of the current data cell that the cell-tools button is associated with
		$scope.currentCell = {};
		
		$scope.$on('UpdateIdOfCurrentCell', function (emittedObj) {
			console.log('caught event UpdateIdOfCurrentCell...id is ' + emittedObj.targetScope.idOfCurrentElement);
			$scope.idOfCurrentElement = emittedObj.targetScope.idOfCurrentElement;
			$scope.currentCell = emittedObj.targetScope.cell;
		});
		
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

	/**
	* @class CellToolsController This is a Controller used by the Directive ssCellToolsBtn
	*/
	ssheet.controller('CellToolsController', ['cellFinder', '$scope', function (cellFinder, $scope) {
		
		$scope.onCellToolsClick = function ($event) {
			console.log('onCellToolsClick: $event.pageX is ' + $event.pageX + ', $event.pageY is ' + $event.pageY);
			
			$scope.cell = cellFinder.getCurrentCellFromId( $scope.idOfCurrentElement, $scope.gridInCellToolsDirective );
			
			//send the id of the current cell to the GridController
			$scope.$emit('UpdateIdOfCurrentCell'); 
			
			
			///// QQQQ all this stuff below is to do with the display of the cellToolsDialog itself
			/// would prefer to put it in there...somehow...
			 
			// position the cell menu next to the where the user clicked
			$('#ss-cell-tool-menu').css('top', $event.pageY);
			$('#ss-cell-tool-menu').css('left', $event.pageX + 10); ////BAAADD having magic nubmer in here. also bad having id ss-cell-tool-menu
			
			
			// If the current cell is a row or column filter, display those menu items accordingly		
			if ($scope.cell.isRowFilter) {
				$('#row-filter').addClass('ss-cell-tools-menu-item-activated');
			} else {
				$('#row-filter').removeClass('ss-cell-tools-menu-item-activated');
			}
			
			if ($scope.cell.isColumnFilter) {
				$('#column-filter').addClass('ss-cell-tools-menu-item-activated');
			} else {
				$('#column-filter').removeClass('ss-cell-tools-menu-item-activated');
			}
			
			////QQQ stuff above is to do with display of the CellToolsDialog...should go somewhere else
			
			
			// make the tool menu visible
			$scope.showToolMenuInDirective();
			
		}
	}]);

	/**
	* @class ssCellToolsBtn The Cell Tools menu comes up when clicking on the top, orange dot next to every cell in the grid 
	*/ 
	ssheet.directive('ssCellToolsBtn', [ function () {  
			
		return {
			
			restrict: 'E',
			replace: true,
			templateUrl: 'cellTools.html',
			
			scope: {
				// this makes the element's id attribute available here in the directive
				idOfCurrentElement: '@id',				
				gridInCellToolsDirective: '=gridInCellToolsElement',
				showToolMenuInDirective: '&showToolMenuInElement',
			},
			
			controller: 'CellToolsController',
		}
	}]);




	ssheet.directive('cellToolsDialog', ['filterByCellData', function (filterByCellData) {
		return {
			restrict: 'EA',
			
			scope: {
				showInDirective: '=showInElement',
			},
			
			// replace means that the <context-menu-dialog> tag itself will be replaced by the template, rather than being the parent of the template's html
			// however the attributes of the <context-menu-dialog> will be added to the top level element in the template
			replace: true, 
			transclude: true, /// this means that the content in between the tags <context-menu-dialog></context-menu-dialog> will be inserted in the template where "ng-transclude" appears
			
			link: function (scope, element, attrs, ssCellToolsBtnCtrl) {
				
				scope.hideToolMenu = function() {
					scope.showInDirective = false;
				};
				
				/**
				* @method updateCellToolsBtnActivatedState If any of the filters are turned on, then display the cellToolsBtn as activated
				*/
				scope.updateCellToolsBtnActivatedState = function () {
					if (scope.$parent.currentCell.isColumnFilter || scope.$parent.currentCell.isRowFilter) {
						$('#' + scope.$parent.idOfCurrentElement).addClass('ss-cell-tools-btn-activated');
					} else {
						$('#' + scope.$parent.idOfCurrentElement).removeClass('ss-cell-tools-btn-activated');
					}
				}
				
				scope.onColumnFilterClick = function () {
					console.log('onColumnFilterClick: scope.$parent.idOfCurrentElement=' + scope.$parent.idOfCurrentElement);
					
					// filter out columns in the grid according to the contents of this cell
					scope.$parent.grid = filterByCellData.toggleCellColumnFilter( scope.$parent.idOfCurrentElement, scope.$parent.grid );
					
					// display the cellToolsBtn for this cell as activated
					scope.updateCellToolsBtnActivatedState();
					
					// hide the cell tools menu
					scope.showInDirective = false;
				};
				
				scope.onRowFilterClick = function () {
					console.log('onRowFilterClick: scope.$parent.idOfCurrentElement=' + scope.$parent.idOfCurrentElement);
					
					// filter out rows in the grid according to the contents of this cell
					scope.$parent.grid = filterByCellData.toggleCellRowFilter( scope.$parent.idOfCurrentElement, scope.$parent.grid );
					
					// display the cellToolsBtn for this cell as activated
					scope.updateCellToolsBtnActivatedState();
					
					// hide the cell tools menu
					scope.showInDirective = false;
				};
				
			},
			
			templateUrl: 'cellToolsDialog.html',
		}
	}]);
	

})();