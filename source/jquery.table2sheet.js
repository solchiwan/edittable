/*
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
	
	//table2sheet(メソッド名)で指定できるようにメソッドを登録
	var methods = {
		//初期設定と基本動作の設定
		init: function(){
			//tbodyのtdそれぞれにクリックイベントを付ける
			$(this).find('tbody tr td').each(function(){
				$(this).on('click.table2sheet', function(){
					//セルが大きさを変えてしまわないために現在のサイズを測って固定
					$(this).width($(this).width());
					$(this).height($(this).height());
				    //セルの内容を一時保管
					var cellContent = $(this).html();
					//セルを空にする
					$(this).empty();
					//編集用のdivを作る
					var editDiv = $('<div />');
					//編集用divのクラスを割り当てる
					editDiv.addClass('table2sheet-edit-div');
					//このdivを編集可能に設定
					editDiv.attr('contenteditable',true);
					//セルの内容をdivの中に移す
					editDiv.html(cellContent);
					//一時的にセルの余白をなくす
					$(this).css('padding','0px');
					//セルにこのdivを入れる
					$(this).append(editDiv);
					//セルにフォーカスを当てる
					editDiv.focus();
				});
			});
		}
	};
})(jQuery);