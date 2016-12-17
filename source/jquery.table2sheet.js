/**
 * name: jquery.table2sheet.js
 * auter: solchiwan
 * lisence: MIT
 */

//jqueryプラグインとしての設定
;(function($){
	//プラグイン名称と呼び出し時の操作設定
	$.fn.table2sheet = function(params){
		//メソッド名がパラメーターで来たときはメソッドを実行
		if (methods[params]){
			return methods[params].apply(this, Array.prototype.slice.call(arguments,1));
		}
		//パラメーターがオブジェクトだったり、なかったりしたら基本動作のinitメソッドを行う
		else if (typeof(params) === 'object' || !params){
			return methods.init.apply(this, arguments);
		}
	};
	
	//このプラグインが保持する設定(初期値)
	var settings = {
		//theadを編集可能にするか
		isTheadEditable: false,
		//tfootを編集可能にするか
		isTfootEditable: false,
		//thタグを編集可能にするか
		isThTagEditable: false,
		//編集禁止タグにするクラス名
		classOfUnedit: 'noedit-cell',
		//ツールバーの表示設定
		toolbarPosition: 'top',
		//設置するツールバーのツール
		toolbarElements: ['bold','italic','underline']
	};
	
	//このプラグインのプロパティ
	var properties = {
		//このプラグインが扱っているテーブル
		targetTable: null,
		//セルの状態
		cellMatrix: null,
		//テーブルの行数
		rows: 0
	};
	
	//このプラグインの定数
	var def = {
		//プラグインが追加するもの全体をラップするクラス
		root: 'table2sheet-root',
		//テーブルをラップするdivのクラス
		wrapper: 'table2sheet-table-wrapper',
		//セルの行IDを保持するdata名
		rowId: 'table2sheet-row-id',
		//セルの列IDを保持するdata名
		colId: 'table2sheet-col-id',
		//ツールバーのクラス
		toolbar: 'table2sheet-toolBar',
		//編集用divのクラス
		editDiv: 'table2sheet-edit-div'
	};
	
	//table2sheet(メソッド名)で指定できるようにメソッドを登録
	var methods = {
		//初期設定と基本動作の設定
		init: function(params){
			//パラメーターが渡されたときは設定のマージ
			margeSettings(params);
			//対象テーブルに編集可能の処理を施す
			setEditableTable(this);
		},
		//プロパティの取得
		proparty: function(params){
			if (!params){
				return null;
			}
			params = params.replace(' ','');
			var paramArray = params.split(',');
			var retObj = {};
			for(var i = 0; i < paramArray.length; i++){
				if (properties[paramArray[i]]){
					retObj[paramArray[i]] = properties[paramArray[i]];
				}
			}
			return retObj;
		},
		//ツールバーを返す
		toolBar: function(params) {
			if (!params) {
				return $('.' + def.toolbar);
			} else {
				return addToolbar(params);
			}
		}
	};
	
	//設定のマージ
	var margeSettings = function(params){
		//パラメーターの存在有無
		if (params) {
			//settingsとマージ
			settings = $.extend(settings, params);
		}
	};
	
	//対象テーブルに編集可能の処理を施す
	var setEditableTable = function(targetObj) {
		//プロパティのセット
		properties.targetTable = targetObj;
		
		//テーブルをラップする
		$(targetObj).wrap($('<div />').addClass(def.wrapper));
		$('.' + def.wrapper).wrap($('<div />').addClass(def.root));
		
		//ツールバーのセットアップ
		setupToolbar();
		
		//セルの状態一時保存の配列
		properties.cellMatrix = [];
		//行数リセット
		properties.rows = 0;
		
		//theadの処理
		$(targetObj).find('thead tr').each(setEditableRow);
		
		//tbodyの処理
		if ($(targetObj).find('tbody')[0]){
			$(targetObj).find('tbody tr').each(setEditableRow);
		} else {
			$(targetObj).find(':not(thead,tfoot) tr').each(setEditableRow);
		}
		
		//tfootの処理
		$(targetObj).find('tfoot tr').each(setEditableRow);
	};
	
	//一行分のセルにIDを付与し、編集可能セルなら編集可能にするイベントを付ける
	var setEditableRow = function (){
		if (!properties.cellMatrix[properties.rows]){
			properties.cellMatrix[properties.rows] = [];
		}
		var colCount = 0;
		$(this).find('th,td').each(function(){
			$(this).data(def.rowId, properties.rows);
			while(typeof(properties.cellMatrix[properties.rows][colCount]) != 'undefined'){
				colCount++;
			}
			$(this).data(def.colId, colCount);
			
			var targetRowStart = properties.rows;
			var targetRowEnd = properties.rows + 1;
			if ($(this).attr('rowspan')){
				targetRowEnd += parseInt($(this).attr('rowspan'));
			}
			var targetColStart = colCount;
			var targetColEnd = colCount + 1;
			if ($(this).attr('colspan')){
				targetColEnd += parseInt($(this).attr('colspan'));
			}
			
			for (var row = targetRowStart; row < targetRowEnd; row++){
				if (!properties.cellMatrix[row]){
					properties.cellMatrix[row] = [];
				}
				for (var col = targetColStart; col < targetColEnd; col++){
					properties.cellMatrix[row][col] = [properties.rows,colCount];
				}
			}
			colCount++;
			
			if (
				(!settings.isTheadEditable && $(this).parents('thead')[0]) ||
				(!settings.isTfootEditable && $(this).parents('tfoot')[0]) ||
				($(this).hasClass(settings.classOfUnedit))
			){
				return true;
			}
			
			setEditableCell(this);
		});
		properties.rows++;
	};
	
	//指定したセルにクリックイベントを付けて編集可能にする
	var setEditableCell = function(targetObj){
		$(targetObj).on('click.table2sheet', function(){
			//すでに編集divがあるときは動作させない
			if (!$(this).find('.' + def.editDiv)[0]){
				//セルが大きさを変えてしまわないために現在のサイズを測って固定
				$(this).width($(this).width());
				$(this).height($(this).height());
				//セルの内容を一時保管
				var cellContent = $(this).html();
				//選択範囲を取得
				var selection = window.getSelection();
				var selectStart = -1;
				var selectEnd = -1;
				if (selection.rangeCount > 0){
					var range = selection.getRangeAt(0);
					if (!range.collapsed && range.startContainer === range.endContainer){
						selectStart = range.startOffset;
						selectEnd = range.endOffset;
					}
				}
				
				//セルを空にする
				$(this).empty();
				//編集用のdivを作る
				var editDiv = $('<div />');
				//編集用divのクラスを割り当てる
				editDiv.addClass(def.editDiv);
				//このdivを編集可能に設定
				editDiv.attr('contenteditable',true);
				//セルの内容をdivの中に移す
				editDiv.html(cellContent);
				//セルにこのdivを入れる
				$(this).append(editDiv);
				//セルにフォーカスを当てる
				editDiv.focus();
				
				//範囲選択されていたら編集DIVのないにそれを再現
				if (selectStart > -1 && selectEnd > -1){
					var divRange = document.createRange();
					//divRange.selectNode(editDiv.get(0));
					divRange.setStart(editDiv.get(0).childNodes[0], selectStart);
					divRange.setEnd(editDiv.get(0).childNodes[0], selectEnd);
					selection.removeAllRanges();
					selection.addRange(divRange);
				}
				
				//フォーカスが外れたときの処理を追加
				$(".table2sheet-edit-div").on('blur.table2sheet', function(){
					//編集用divの内容保管
					var cellContent = $(this).html();
					//編集用divのイベント除去
					$(this).off('.table2sheet');
					//セルに書き戻す
					$(this).parent().html(cellContent);
				});
			}
		});
	};
	
	//デフォルトのツールバーのセットアップ
	var setupToolbar = function(){
		if (settings.toolbarPosition != 'none'){
			var toolbar = $('<div />').addClass(def.toolbar);
			//ツールバーの設置
			if (settings.toolbarPosition == 'top'){
				$('.' + def.root).prepend(toolbar);
			} else if (settings.toolbarPosition == 'bottom'){
				$('.' + def.root).append(toolbar);
			}

			//ツールの追加
			for (var i = 0; i < settings.toolbarElements.length; i++){
				switch (settings.toolbarElements[i]){
					case 'bold':
						addToolbar({
							id: 'boldButton',
							parts: $('<button />').text('B'),
							class: 'table2sheet-boldButton',
							event: 'mousedown',
							task: boldButtonTask
						});
						break;
					case 'italic':
						addToolbar({
							id: 'italicButton',
							parts: $('<button />').text('I'),
							class: 'table2sheet-italicButton',
							event: 'mousedown',
							task: italicButtonTask
						});
						break;
					case 'underline':
						addToolbar({
							id: 'underlineButton',
							parts: $('<button />').text('U'),
							class: 'table2sheet-underlineButton',
							event: 'mousedown',
							task: underlineButtonTask
						});
						break;
				}
			}
		}
	};
	
	//ツールバーに追加機能
	var addToolbar = function(params){
		//追加するDOMオブジェクト
		var tool = null;
		if (params.parts){
			if (params.parts instanceof HTMLElement){
				tool = $(params.parts);
			} else if (typeof params.parts[0] != 'undefined' && params.parts[0] instanceof HTMLElement) {
				tool = params.parts;
			}
			
			if (params.id){
				var buttonId = 'table2sheet-' + params.id;
				tool.attr('id', buttonId);
			} else {
				tool = null;
			}
		}
		
		if (tool != null){
			$('.' + def.toolbar).append(tool);
			if (params.class){
				tool.addClass(params.class);
			}
			if (params.event && params.task) {
				tool.on(params.event + '.' + tool.attr('id'), function(e){params.task.apply(tool, e)});
			}
		}
	};

	//選択した文字を太字に
	var boldButtonTask = function(e){
		if ($('.' + def.editDiv)[0]){
			document.execCommand('bold');
		}
	};
	
	//選択した文字を斜体に
	var italicButtonTask = function(){
		if ($('.' + def.editDiv)[0]){
			document.execCommand('italic');
		}
	}
	
	//選択した文字に下線を引く
	var underlineButtonTask = function(){
		if ($('.' + def.editDiv)[0]){
			document.execCommand('underline');
		}
	}
})(jQuery);