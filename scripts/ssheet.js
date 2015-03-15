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
			* 		{col: 0, contents: '', isVisible: true},
			* 		{col: 1, contents: '', isVisible: true},
			* 		{col: 2, contents: '', isVisible: true},	
			* 	]},
			* 	{row: 0, isVisible: true, cells: [
			* 		{col: 0, contents: '', isVisible: true},
			* 		{col: 1, contents: '', isVisible: true},
			* 		{col: 2, contents: '', isVisible: true},
			* 	]},
			* ]
			*****/
			for (i=0; i<$scope.gridheight; i++) {
				cells = [];
				for (j=0; j<$scope.gridwidth; j++) {
					cells[j] = {'col': j, 'contents' : '', 'isVisible' : true};
				}
				$scope.grid[i] = {'row' : i, 'isVisible' : true, 'cells' : cells};
			}
			
			/******
			* initialize the filter data
			***/
			for (i=0; i<$scope.gridwidth; i++) {
				$scope.filterRow[i] = { 'filtercol' : i, 'filterExpression' : '' };
			}
		}
		
		$scope.init();
		
		/**
		* When the user enters data in the filter row this function is called
		* It uses the currentColumnArr which is an array of all the cells (one from each row) that are in the column
		* the currentColumnArr is updated when the user first clicks in the filter by getCurrentColumn (below) 
		*/
		$scope.updateFilter = function () {
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
		
	}]);

	ssheet.directive('ssDragColWidth', ['$document', function($document) {
		
		// got this from the "Creating a Directive that Adds Event Listeners" section of https://docs.angularjs.org/guide/directive
		return { 
			
			link: function ($scope, element, attrs) {
				var initialX = 0;
				var initialY = 0;
				var mouseX = 0;
				var mouseY = 0;
				
				element.on('mousedown', function(event) {
					event.preventDefault();
					initialX = event.pageX - mouseX;
					initialY = event.pageY - mouseY;
					$document.on('mousemove', mousemoveHandler);	
					$document.on('mouseup', mouseupHandler);		
				});
				
				function mousemoveHandler(event) {
					// console.log('mousemoveHandler: event.pageX=' + event.pageX);
					mouseX = event.pageX - initialX;
					mouseY = event.pageY - initialY;
					element.css('position', 'absolute');
					element.css('left', event.pageX + 'px');
				}
				
				function mouseupHandler (event){
					console.log('mouseup caught by mouseupHandler');
					
					//set the new width of the column, but don't go smaller than the minimum width
					var newWidth = event.pageX - initialX;
					if (newWidth > $scope.minWidth) {
						console.log('element.prev() = ' + element.prev());
						element.prev().css('width', newWidth + 'px');
					} else {
						element.prev().css('width', $scope.minWidth + 'px');
					}
					element.css('position', 'static');
					
					//remove the event handlers now the mouse drag is over
					$document.off('mousemove', mousemoveHandler);
					$document.off('mouseup', mouseupHandler);
				}
				
				// these to be deleted
				element.bind('mouseenter', function() {
					console.log('mouseenter ' + element.html());
				});
				
				element.bind('mouseleave', function() {
					console.log('mouseleave' + element.html());
				});
			}
		}
		
		
	}]);

})();