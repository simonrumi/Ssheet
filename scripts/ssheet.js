'use strict';

(function() {

	var ssheet = angular.module('ssheet', ['ui.bootstrap']);

	/**
	* @method cellFinder A Service that provides some helper functions for dealing with the grid
	*/
	ssheet.factory('cellFinder', [function() {
		var getCurrentColumnFromSpacerCell;
		var getCurrentRowFromSpacerCell;
		
		return {
			/**
			* @method getCurrentColumnFromSpacerCell When the user clicks on a "spacer" cell
			* this returns an array with all the cells in the column to the immediate left of the spacer.
			* This is done so the user can drag the width of a column by dragging the spacer cell
			* @param {DOM element} domElement The element the user clicked on in the UI
			* @param scope A scope object (expecting the $scope from the Controller)
			* @return {Array} An array of cells from the grid oject, that represent all the cells in a particular column
			*/
			getCurrentColumnFromSpacerCell: function (domElement, scope) {
				var rowObj;
				var columnArr = [];
				
				// the id attribute of the cell to the left of the spacer cell is in the format 
				// [row number]_[column number]
				// so split on '_' and get the 2nd array value to get the column number
				var col = parseInt( domElement.prev().attr('id').split('_')[1] ); 
				
				// put all the cells in the column into the columnArr
				for (rowObj in scope.grid) {
					columnArr.push( scope.grid[rowObj].cells[col] );
				}
				
				// need to separately add the cell from the filter row
				columnArr.push( scope.filterRow[col] );
				
				return columnArr;
			},
			
			
			/**
			* @method getCurrentRowFromSpacerCell When the user clicks on a "spacer" cell
			* This returns an array with all the cells in the row the user clicked on.
			* This is done so the user can drag the height of a column by dragging the spacer cell
			* @param {DOM element} domElement The element the user clicked on in the UI
			* @param scope A scope object (expecting the $scope from the Controller)
			* @return {Array} An array of cells from the grid oject, that represent all the cells in a particular row
			*/
			getCurrentRowFromSpacerCell: function (domElement, scope) {
				var cellObj;
				
				// the id attribute of the cell to the left of the spacer cell is in the format 
				// [row number]_[column number]
				// or if we're on the filter row then it will be 
				// filt_[column number]
				// so split on '_' and get the 1st array value to get the row number
				var row = domElement.prev().attr('id').split('_')[0];
				
				if (row == 'filt') {
					alert('cannot resize filter row - need to update to make all cells filter cells');
					return [];
				} else {
					row = parseInt(row);
				}
				
				return scope.grid[row]['cells'];
			}
		
		}
	}]);



	ssheet.directive('contextMenuDialog', [ function () {
		return {
			restrict: 'EA',
			
			//priority: 10, // this should get compliled before ssResizeCells
			
			scope: {
				showFromDirective: '=showFromElement'
			},
			
			// replace means that the <context-menu-dialog> tag itself will be replaced by the template, rather than being the parent of the template's html
			// however the attributes of the <context-menu-dialog> will be added to the top level element in the template
			replace: true, 
			transclude: true, /// this means that the content in between the tags <context-menu-dialog></context-menu-dialog> will be inserted in the template where "ng-transclude" appears
			
			link: function (scope, element, attrs) {
				console.log('contextMenuDialog: link function started, element is: ' + element[0] + ', scope is ' + scope + ', attrs are ' + JSON.stringify(attrs.$attr) );
				
				scope.contextMenuStyle = {};
				
				
				// possibly might want to make this a function, called like hideModal
				//scope.positionContextMenu = function (event) {
					
					scope.contextMenuStyle.position = 'absolute';
					scope.contextMenuStyle.left = event.pageX + 'px';
					scope.contextMenuStyle.top = event.pageY + 'px';
					
					// originally was:
					// $('.cell-context-menu').css('position', 'absolute');
					// $('.cell-context-menu').css('left', event.pageX + 'px');
					// $('.cell-context-menu').css('top', event.pageY + 'px');
					
				//} end of possible function positionContextMenu
				
				scope.hideModal = function() {
					scope.showFromDirective = false;
				};
				
			},
			
			templateUrl: 'contextMenuDialog.html',
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
			* 		{cellId: '0_0', col: 0, contents: '', isVisible: true},
			* 		{cellId: '0_1', col: 1, contents: '', isVisible: true},
			* 		{cellId: '0_2', col: 2, contents: '', isVisible: true},	
			* 	]},
			* 	{row: 1, isVisible: true, cells: [
			* 		{cellId: '1_0', col: 0, contents: '', isVisible: true},
			* 		{cellId: '1_1', col: 1, contents: '', isVisible: true},
			* 		{cellId: '1_2', col: 2, contents: '', isVisible: true},
			* 	]},
			* ]
			*****/
			for (i=0; i<$scope.gridheight; i++) {
				cells = [];
				for (j=0; j<$scope.gridwidth; j++) {
					cells[j] = {'cellId' : i + '_' + j, 'col': j, 'contents' : '', 'isVisible' : true};
				}
				$scope.grid[i] = {'row' : i, 'isVisible' : true, 'cells' : cells};
			}
			
			/******
			* initialize the filter data
			* filterRow looks like 
			* [
				{ cellId: 'filt_0', filtercol' : 0, 'filterExpression' : 'this contains a string' }
				{ cellId: 'filt_1', 'filtercol' : 1, 'filterExpression' : '...that is used as a filter' }
				{ cellId: 'filt_2', 'filtercol' : 2, 'filterExpression' : '...for the other cells in the column' }
			* ]
			***/
			for (i=0; i<$scope.gridwidth; i++) {
				$scope.filterRow[i] = { 'cellId': 'filt_' + i, 'filtercol' : i, 'filterExpression' : '' };
			}
		}
		
		$scope.init();
		
		/**
		* When the user enters data in the filter row this function is called
		* It uses the currentColumnArr which is an array of all the cells (one from each row) that are in the column
		* the currentColumnArr is updated when the user first clicks in the filter by getCurrentColumnFromFilterCell (below) 
		*/
		$scope.updateFilter = function () {
			var cellIndex;
			
			for (cellIndex in $scope.currentColumnArr) {
				if ( $scope.currentColumnArr[cellIndex].contents.indexOf($scope.filterRow[this.element.filtercol].filterExpression) == -1 ) {
					$scope.grid[cellIndex].isVisible = false;
				} else {
					$scope.grid[cellIndex].isVisible = true;
				}
			}
		}
		
		/**
		* When the user first clicks in a filter cell getCurrentColumnFromFilterCell updates currentColumnArr
		* to be  an array of all the cells (one from each row) that are in the same column as the filter cell
		* updateFilter() can then repeatedly use the currentColumnArr until the user clicks in another filter column
		*/
		$scope.getCurrentColumnFromFilterCell = function () {
			var rowObj;
			
			if ($scope.currentColumnIndex != this.element.filtercol) {
				$scope.currentColumnIndex = this.element.filtercol;
				$scope.currentColumnArr = [];
				
				for (rowObj in $scope.grid) {
					$scope.currentColumnArr.push( $scope.grid[rowObj].cells[this.element.filtercol] );
				}
			}
		}
		
		
		/**** context menu hide/show stuff ********/
		$scope.showFromController = true;
		$scope.toggleModalFromController = function () {
			$scope.showFromController = !$scope.showFromController;
			console.log('toggleModalFromController: $scope.showFromController is now ' + $scope.showFromController);
		}
		
		$scope.showModalFromController = function () {
			$scope.showFromController = true;
			console.log('showModal: $scope.showFromController is now ' + $scope.showFromController);
		}
		
		
	}]);

	
	
	
	
	/**
	* @method ssResizeCells A directive that allows for dragging of a "spacer" table cell 
	* (thin cells in between the cells with actual data) in order to change the width & height of the cell to the left of the spacer
	* @param $document The Angularjs handle for the window.document object
	*/
	ssheet.directive('ssResizeCells', ['$document', 'cellFinder',  
		function ($document, cellFinder) {
		
		return { 	
		
			restrict: 'A',
			
			//priority: 1, // this should get compliled after contextMenuDialog
			
			// note that we are not creating an isolate scope here, because the user is clicking on one DOM element (a spacer cell)
			// but we want to manipulate the width of all the cells in the column to its left 
			// and drag the mouse at the level of the document, not just the element clicked on 
			// so using the scope from the controller
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
					console.log('mousedown');
					event.preventDefault();
					
					$('html').css('cursor', 'se-resize');
					
					initialX = event.pageX - xDistance;
					initialY = event.pageY - yDistance;
					initialWidth = parseInt( element.prev().css('width') );
					initialHeight = parseInt( element.prev().css('height') );
					
					colArr = cellFinder.getCurrentColumnFromSpacerCell(element, scope);
					rowArr = cellFinder.getCurrentRowFromSpacerCell(element, scope);
					
					$document.on('mousemove', mousemoveHandler);
					$document.on('mouseup', mouseupHandler);		
				});
				
				
/* QQQQ will reinstate these later
				element.on('contextmenu', function (event) {
					console.log('context menu selected and scope.$parent.$parent.showFromController is ' + scope.$parent.$parent.showFromController);
					event.preventDefault();
					event.stopPropagation();
					
					contextMenuDialog.positionContextMenu(event);

					scope.$parent.showModalFromController();
					console.log('after calling scope.$parent.showModalFromController, scope.$parent.showFromController is now ' + scope.$parent.showFromController);
				});
				 
				element.on('mouseleave', function (event) {
					scope.$parent.showFromController = false;
				});
*/				
				
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
					
					console.log('newWidth=' + newWidth + ' initialX=' +initialX + ' xDistance=' + xDistance);
					console.log('newHeight=' + newHeight + ' initialY=' +initialY + ' yDistance=' + yDistance);
						
					//adjust the width of all cells in the column
					for (cellIndex in colArr) {
						cell = colArr[cellIndex];
						cellId = '#' + cell.cellId;
						$(cellId).css('width', newWidth);
						console.log('mousemoveHandler: just set cellId ' + cellId + ' to newWidth ' + newWidth);
					}
					
					element.css('left', event.pageX + 'px');
					
					//adjust the height of all the cells in the row
					for (cellIndex in rowArr) {
						cell = rowArr[cellIndex];
						cellId = '#' + cell.cellId;
						$(cellId).css('height', newHeight);
						console.log('mousemoveHandler: just set cellId ' + cellId + ' to newHeight ' + newHeight);
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

	

})();