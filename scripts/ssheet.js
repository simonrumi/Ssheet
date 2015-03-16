'use strict';

(function() {

	var ssheet = angular.module('ssheet', []);

	ssheet.controller('GridController', ['$scope', function ($scope) {
		$scope.gridwidth = 8;
		$scope.gridheight = 8;
		$scope.grid = [];
		$scope.filterRow = [];
		$scope.currentColumnArr = [];
		$scope.currentColumnIndex = -1;
		$scope.minWidth = 20;
		
		
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
		* the currentColumnArr is updated when the user first clicks in the filter by getCurrentColumn (below) 
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
		* When the user first clicks in a filter cell getCurrentColumn updates  currentColumnArr
		* to be  an array of all the cells (one from each row) that are in the same column as the filter cell
		*/
		$scope.getCurrentColumn = function () {
			var rowObj;
			
			if ($scope.currentColumnIndex != this.element.filtercol) {
				$scope.currentColumnIndex = this.element.filtercol;
				$scope.currentColumnArr = [];
				
				//alert('getCurrentColumn: currentColumnIndex=' + $scope.currentColumnIndex);
				
				for (rowObj in $scope.grid) {
					$scope.currentColumnArr.push( $scope.grid[rowObj].cells[this.element.filtercol] );
				}
			}
		}
		
		/**
		* @method getCurrentColumnFromSpacerCell When the user clicks on a "spacer" cell 
		* this populates the currentColumnArr with all the cells in the column to the immediate left of the spacer
		* this is done so the user can drag the width of a column by dragging the spacer cell
		* @param {DOM element} domElement The element the user clicked on in the UI
		*/
		$scope.getCurrentColumnFromSpacerCell = function (domElement) {
			var rowObj;
			
			// the id attribute of the cell is in the format [row number]_[column number], so split on '_' and get the 2nd array value
			var col = parseInt( domElement.prev().attr('id').split('_')[1] ); 
			
			// clear the currentColArr so we can populate it with the cells in the column we're in now
			$scope.currentColumnArr = [];
			
			// put all the cells in the column into the global currentColumnArr
			for (rowObj in $scope.grid) {
				$scope.currentColumnArr.push( $scope.grid[rowObj].cells[col] );
			}
			
			// need to separately add the cell from the filter row
			$scope.currentColumnArr.push( $scope.filterRow[col] );
		}
		
	}]);

	
	/**
	* @method ssDragColWidth A directive that allows for dragging of a "spacer" table cell 
	* (thin cells in between the cells with actual data) in order to change the width of the cell to the left of the spacer
	* @param $document The Angularjs handle for the window.document object
	*/
	ssheet.directive('ssDragColWidth', ['$document', function($document) {
		
		// see "Creating a Directive that Adds Event Listeners" section of https://docs.angularjs.org/guide/directive
		return { 	
		
			restrict: 'A',
			
			// note that we are not creating an isolate scope here, because the user is clicking on one DOM element (a spacer cell)
			// but we want to manipulate the width of all the cells in the column to its left, so using the $scope from the controller
			// we can get access to all the DOM elements we need
					
			link: function ($scope, element, attrs) {
				var initialX = 0;
				var initialWidth;
				var initialY = 0;
				var xDistance = 0;
				var yDistance = 0;
				
				element.on('mousedown', function(event) {
					console.log('mousedown');
					event.preventDefault();
					
					$('html').css('cursor', 'col-resize');
					
					initialX = event.pageX - xDistance;
					initialY = event.pageY - yDistance;
					initialWidth = parseInt( element.prev().css('width') );
					
					$scope.getCurrentColumnFromSpacerCell(element);
					
					$document.on('mousemove', mousemoveHandler);
					$document.on('mouseup', mouseupHandler);		
				});
				
				
				function mousemoveHandler(event) {
					var cellIndex;
					var cell;
					var cellId;
					
					console.log('mousemoveHandler: event.pageX=' + event.pageX);
					xDistance = event.pageX - initialX;
					yDistance = event.pageY - initialY;
					
					//set the new width of the column immediately to the left, but don't go smaller than the minimum width
					var newWidth = initialWidth + xDistance;
					if (newWidth < $scope.minWidth) {
						newWidth = $scope.minWidth;
					}
					console.log('newWidth=' + newWidth + ' initialX=' +initialX + ' xDistance=' + xDistance);
						
					//adjust the width of all cells in the column
					for (cellIndex in $scope.currentColumnArr) {
						cell = $scope.currentColumnArr[cellIndex];
						cellId = '#' + cell.cellId;
						$(cellId).css('width', newWidth);
						console.log('mousemoveHandler: just set cellId ' + cellId + ' to newWidth ' + newWidth);
					}
					
					element.css('left', event.pageX + 'px');
				};
				
				// reset everything once the mouse-drag is over
				function mouseupHandler (event){
					console.log('mouseup caught by mouseupHandler');
					
					//remove the event handlers now the mouse drag is over
					$document.off('mousemove', mousemoveHandler);
					$document.off('mouseup', mouseupHandler);
					
					$('html').css('cursor', 'auto');
					element.css('position', 'static');
				};

			}
		}
		
		
	}]);

})();