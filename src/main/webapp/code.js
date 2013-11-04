function splitCtrl($scope){
	var sInvIdSeed = 10001;

	function findItem(itemId, items){
		items = items || $scope.originItems;

		return items.filter(function(item){
			return item.LineId === itemId;
		})[0];
	}

	function findSplitInvoice(sInvId){
		return $scope.splitInvoices.filter(function(sInv){
			return sInv.id === sInvId;
		})[0];
	}

	$scope.originItems = [
		{
			Description: 'Apple',
			Quantity: {value: 500},
			remainQuantity: 500,
			UnitPrice: 2.0,
			LineId: 1	
		},
		{
			Description: 'Orange',
			Quantity: {value: 100},
			remainQuantity: 100,
			UnitPrice: 5.0,
			LineId: 2
		}
	];

	$scope.splitInvoices = [];

	$scope.doneSplit = function(){
		$scope.isSplitting = $scope.selectedItem.selected = false;
		$scope.selectedItem = null;
	}

	$scope.selectItemToSplit = function(item){
		if ($scope.isSplitting && item.selected){
			$scope.doneSplit();
		} else if (!$scope.isSplitting && !item.selected){
			// start splitting action
			$scope.isSplitting = item.selected = true;
			$scope.selectedItem = item;
		} else {
			// do nothing
		}
	}

	$scope.resetSplit = function() {
		$scope.splitInvoices = [];

		$scope.originItems.map(function(item){
			item.remainQuantity = item.Quantity.value;
			return item;
		});
	}

	$scope.newSplitInvoice = function(){
		$scope.splitInvoices.push({ id: sInvIdSeed++, items: [] });
	}

	$scope.deleteSplitInvoice = function(sInvId){
		var i = 0, sInvs = $scope.splitInvoices, len = sInvs.length, idx, sInv, sInvItems, item ;

		for ( ; i < len; i++ ){
			if (sInvs[i].id === sInvId){
				idx = i;
				break;
			}
		}

		if (idx !== undefined){
			sInv = sInvs[idx];
			sInvItems = sInv.items;

			// add back splitted items
			for ( i = 0, len = sInvItems.length; i < len; i++) {
				item = findItem(sInvItems[i].LineId);
				item.remainQuantity += sInvItems[i].Quantity.value;
			}

			sInvs.splice(idx, 1);
		}
	}

	$scope.addItemToSplitInvoice = function(itemId, sInvId){
		if ($scope.isSplitting) {
			var item = findItem(itemId),
				sInv = findSplitInvoice(sInvId);

			if (sInv && item && !findItem(item.LineId, sInv.items)){
				sInv.items.push({
					LineId: item.LineId,
					UnitPrice: item.UnitPrice,
					Quantity: {value: 0},
					Description: item.Description
				});
			}

			$scope.doneSplit();
		}
	}

	$scope.splitItem = function(itemId, sInvId, oldQuantity){
		var originItem = findItem(itemId),
			sInv = originItem && findSplitInvoice(sInvId),
			sInvItem = sInv && findItem(itemId, sInv.items),
			newQuantity = parseInt(sInvItem.Quantity.value, 10),
			oldQuantity = parseInt(oldQuantity, 10),
			deltaQuantity;
		
		if (newQuantity >= 0){
			deltaQuantity = newQuantity - oldQuantity;

			if ( deltaQuantity <= originItem.remainQuantity){
				originItem.remainQuantity -= deltaQuantity;
				// newQuantity unchanged
			}else {
				newQuantity = oldQuantity;
			}	
		}else {
			newQuantity = oldQuantity;
		}

		sInvItem.Quantity.value = newQuantity;
	}

	$scope.chinaSplit = function(itemId){

	}

	$scope.getItemRemaining = function(itemId, sInvId){
		var item = findItem(itemId),
			sInv = item && findSplitInvoice(sInvId),
			sInvItem = sInv && findItem(itemId, sInv.items);

		return item.remainQuantity + sInvItem.Quantity.value;
	}

	$scope.save = function(){
		$scope.splitInvoices = $scope.splitInvoices.filter(function(inv){
			return inv.items.filter(function(item){
				return item.Quantity.value > 0;
			}).length > 0;
		});

		var lastInvoice, lastItems;
		lastItems = $scope.originItems.filter(function(item){
			return item.remainQuantity > 0;
		}).map(function(item){
			return {
				LineId: item.LineId,
				Description: item.Description,
				Quantity: {value: item.remainQuantity},
				UnitPrice: item.UnitPrice
			};
		});

		if (lastItems.length > 0) {
			lastInvoice = {
				items: lastItems,
				id: sInvIdSeed++
			};

			$scope.originItems.forEach(function(item){
				item.remainQuantity = 0;
			})
			$scope.splitInvoices.push(lastInvoice);
		}

		
	}

}