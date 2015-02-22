var ssheet = angular.module('ssheet', []);

/**
* Row class 
* 
*/

ssheet.controller('GridController', ['$scope', function ($scope) {
	$scope.gridwidth = 8;
	$scope.gridheight = 8;
	$scope.grid = [];
	$scope.filter = [];
	$scope.currentColumnArr = [];
	$scope.currentColumnIndex = -1;
	
	
	$scope.init = function () {
		var i;
		var j;
		var cells;
		
		/******
		* initialize the grid by creating empty cells the size of the gridwidth and gridheight
		* the grid object looks like this sort of thing
		* [
		* 	{row: 1, cells: [
		* 		{col: 1, contents: '', isVisible: true},
		* 		{col: 2, contents: '', isVisible: true},
		* 		{col: 3, contents: '', isVisible: true},	
		* 	]},
		* 	{row: 2, cells: [
		* 		{col: 1, contents: '', isVisible: true},
		* 		{col: 2, contents: '', isVisible: true},
		* 		{col: 3, contents: '', isVisible: true},
		* 	]},
		* ]
		*****/
		for (i=0; i<$scope.gridheight; i++) {
			cells = [];
			for (j=0; j<$scope.gridwidth; j++) {
				cells[j] = {'col': j, 'contents' : '', 'isVisible' : true};
			}
			$scope.grid[i] = {'row' : i, 'cells' : cells};
		}
		
		/******
		* initialize the filter data
		***/
		for (i=0; i<$scope.gridwidth; i++) {
			$scope.filter[i] = { 'filtercol' : i, 'filterExpression' : '' };
		}
	}
	
	$scope.init();
	
	$scope.updateFilter = function () {
		alert('filter changed, column is ' + this.element.filtercol);
		
		for (cell in $scope.currentColumnArr) {
			
			//$scope.currentColumnArr[cell].contents = 'filtered!'
			
			if ( $scope.currentColumnArr[cell].contents.indexOf($scope.filter[this.element.filtercol].filterExpression) == -1 ) {
				$scope.currentColumnArr[cell].isVisible = false;
			} else {
				$scope.currentColumnArr[cell].isVisible = true;
			}
		}
		
	}
	
	/**
	* 
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
