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

	function getEvenlySplitOptions(items){
		var allItems = [];

		for (var i=0;i<items.length;i++){
			allItems.push({
				n: items[i].LineId + ' - ' + items[i].Description,
				v: items[i].LineId
			})
		}

		if (allItems.length > 0){
			allItems.push({
				n: 'All Items',
				v: -1
			});
		}

		return allItems;
	}

	$scope.advancedSplitOptions = [
		{ n: 'Evenly Split', v: 1, action: function(){ $scope.splitEvenly();} },
		{ n: 'Split by Maximum Total', v: 2, action: function(){ $scope.splitByMax(); } },
		{ n: 'Split by Items', v: 3, action: function(){ $scope.splitByItems(); } }
	];

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
		},
		{
			Description: 'Banana',
			Quantity: {value: 1000},
			remainQuantity: 1000,
			UnitPrice: 10.0,
			LineId: 3
		}
	];

	$scope.evenSplitOptions = getEvenlySplitOptions($scope.originItems)

	$scope.splitInvoices = [];

	$scope.splitByItems = function() {
		$scope.doneSplit();
		$scope.resetSplit();

		for (var i=0;i<$scope.originItems.length;i++){
			var item = $scope.originItems[i];
			$scope.newSplitInvoice().items.push({
				LineId: item.LineId,
				UnitPrice: item.UnitPrice,
				Quantity: {value: item.Quantity.value},
				Description: item.Description
			})

			item.remainQuantity = 0;
		}
	}

	$scope.adv_invoice_max = 10000;
	$scope.splitByMax = function() {
		$scope.doneSplit();
		$scope.resetSplit();

		var max = $scope.adv_invoice_max, hasRemaining = false;

		for (var i=0;i<$scope.originItems.length;i++){
			var item = $scope.originItems[i],
				maxQuantity = parseInt(max / item.UnitPrice),
				splits = parseInt(item.Quantity.value / maxQuantity);

			item.remainQuantity = item.Quantity.value - splits * maxQuantity;

			if (item.remainQuantity > 0){
				hasRemaining = true;
			}

			for (var j=0; j < splits; j++){
				$scope.newSplitInvoice().items.push({
					LineId: item.LineId,
					UnitPrice: item.UnitPrice,
					Quantity: {value: maxQuantity},
					Description: item.Description
				})
			}
		}

		if (hasRemaining){
			var sInv = $scope.newSplitInvoice(),
				totalAvailable = max;

			for (var i=0;i<$scope.originItems.length;i++){
				var item = $scope.originItems[i];

				if (item.remainQuantity == 0) {
					continue;
				}

				
				var	quantityToSplit = Math.min(item.remainQuantity, parseInt(totalAvailable / item.UnitPrice, 10));
				
				// If the current split invoice cannot contain any items
				if (quantityToSplit == 0){
					// Create new split invoice and and recalculate
					sInv = $scope.newSplitInvoice();
					totalAvailable = max;
					quantityToSplit = Math.min(item.remainQuantity, parseInt(totalAvailable / item.UnitPrice, 10));
				}

				totalAvailable = totalAvailable - quantityToSplit * item.UnitPrice;
				
				sInv.items.push({
					LineId: item.LineId,
					UnitPrice: item.UnitPrice,
					Quantity: {value: quantityToSplit},
					Description: item.Description
				});

				item.remainQuantity -= quantityToSplit;

				if (item.remainQuantity > 0){
					i--; //still proceed with current item
				}
			}
		}
	}

	$scope.adv_invoice_pcs = 10;
	$scope.adv_invoice_item = $scope.evenSplitOptions[0];
	$scope.splitEvenly = function() {
		$scope.doneSplit();
		$scope.resetSplit();
		
		var itemId = $scope.adv_invoice_item.v,
			pcs = parseInt($scope.adv_invoice_pcs, 10),
			splitItem = function(item){
				var quantity = parseInt(item.Quantity.value / pcs),
					newQuantity, lastQuantity = item.Quantity.value - quantity * pcs;
				for (var i = 0; i < pcs; i++){
					if (lastQuantity > 0){
						newQuantity = quantity + 1;
						lastQuantity--;
					}else{
						newQuantity = quantity;
					}
					$scope.splitInvoices[i].items.push({
						LineId: item.LineId,
						UnitPrice: item.UnitPrice,
						Quantity: {value: newQuantity},
						Description: item.Description
					});
				}
			};

		

		for (var i=0;i<pcs;i++){
			$scope.newSplitInvoice();
		}

		if (itemId !== -1){
			splitItem(findItem(itemId));
		}else {
			for (var i=0;i<$scope.originItems.length;i++){
				splitItem($scope.originItems[i]);
			}
		}

		$scope.originItems.map(function(itm){
			if (itemId === -1 || itm.LineId == itemId){
				itm.remainQuantity = 0;
			}
		});
	};

	$scope.doneSplit = function(){
		if ($scope.isSplitting){
			$scope.isSplitting = $scope.selectedItem.selected = false;
			$scope.selectedItem = null;
		}
	};

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
	};

	$scope.resetSplit = function() {
		$scope.splitInvoices = [];

		$scope.originItems.map(function(item){
			item.remainQuantity = item.Quantity.value;
			return item;
		});
	};

	$scope.newSplitInvoice = function(){
		$scope.splitInvoices.push({ id: sInvIdSeed++, items: [] });

		return $scope.splitInvoices[$scope.splitInvoices.length - 1];
	};

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
	};

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
	};

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

	$scope.getItemRemaining = function(itemId, sInvId){
		var item = findItem(itemId),
			sInv = item && findSplitInvoice(sInvId),
			sInvItem = sInv && findItem(itemId, sInv.items);

		return item.remainQuantity + sInvItem.Quantity.value;
	}

	$scope.getInvoiceTotal = function(invoice){
		if (invoice.items.length > 1){
			return invoice.items.reduce(function(it1, it2){
				return it1.Quantity.value * it1.UnitPrice + it2.Quantity.value * it2.UnitPrice;
			});
		}else if (invoice.items.length == 1){
			return invoice.items[0].Quantity.value * invoice.items[0].UnitPrice;
		}else { 
			return 0;
		}
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