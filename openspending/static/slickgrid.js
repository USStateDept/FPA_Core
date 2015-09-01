

;(function($){$.fn.drag=function(str,arg,opts){ var type=typeof str=="string"?str:"",fn=$.isFunction(str)?str:$.isFunction(arg)?arg:null; if(type.indexOf("drag")!==0)
type="drag"+type; opts=(str==fn?arg:opts)||{}; return fn?this.bind(type,opts,fn):this.trigger(type);};var $event=$.event,$special=$event.special,drag=$special.drag={ defaults:{which:1, distance:0, not:':input', handle:null, relative:false,drop:true, click:false
}, datakey:"dragdata", noBubble:true, add:function(obj){ var data=$.data(this,drag.datakey), opts=obj.data||{}; data.related+=1;
 $.each(drag.defaults,function(key,def){if(opts[key]!==undefined)
data[key]=opts[key];});}, remove:function(){$.data(this,drag.datakey).related-=1;}, setup:function(){ if($.data(this,drag.datakey))
return;  var data=$.extend({related:0},drag.defaults); $.data(this,drag.datakey,data); $event.add(this,"touchstart mousedown",drag.init,data);if(this.attachEvent)
this.attachEvent("ondragstart",drag.dontstart);}, teardown:function(){var data=$.data(this,drag.datakey)||{}; if(data.related)
return;  $.removeData(this,drag.datakey); $event.remove(this,"touchstart mousedown",drag.init); drag.textselect(true);if(this.detachEvent)
this.detachEvent("ondragstart",drag.dontstart);}, init:function(event){ if(drag.touched)
return;  var dd=event.data,results; if(event.which!=0&&dd.which>0&&event.which!=dd.which)
return;  if($(event.target).is(dd.not))
return;  if(dd.handle&&!$(event.target).closest(dd.handle,event.currentTarget).length)
return;drag.touched=event.type=='touchstart'?this:null;dd.propagates=1;dd.mousedown=this;dd.interactions=[drag.interaction(this,dd)];dd.target=event.target;dd.pageX=event.pageX;dd.pageY=event.pageY;dd.dragging=null;results=drag.hijack(event,"draginit",dd); if(!dd.propagates)
return;  results=drag.flatten(results); if(results&&results.length){dd.interactions=[];$.each(results,function(){dd.interactions.push(drag.interaction(this,dd));});} 
dd.propagates=dd.interactions.length; if(dd.drop!==false&&$special.drop)
$special.drop.handler(event,dd); drag.textselect(false);if(drag.touched)
$event.add(drag.touched,"touchmove touchend",drag.handler,dd);else
$event.add(document,"mousemove mouseup",drag.handler,dd); if(!drag.touched||dd.live)
return false;}, interaction:function(elem,dd){var offset=$(elem)[dd.relative?"position":"offset"]()||{top:0,left:0};return{drag:elem,callback:new drag.callback(),droppable:[],offset:offset};}, handler:function(event){ var dd=event.data; switch(event.type){ case!dd.dragging&&'touchmove':event.preventDefault();case!dd.dragging&&'mousemove': if(Math.pow(event.pageX-dd.pageX,2)+Math.pow(event.pageY-dd.pageY,2)<Math.pow(dd.distance,2))
break; event.target=dd.target;drag.hijack(event,"dragstart",dd);if(dd.propagates) 
dd.dragging=true;
 case'touchmove':event.preventDefault();case'mousemove':if(dd.dragging){drag.hijack(event,"drag",dd);if(dd.propagates){ if(dd.drop!==false&&$special.drop)
$special.drop.handler(event,dd);break;}
event.type="mouseup";} 
case'touchend':case'mouseup':default:if(drag.touched)
$event.remove(drag.touched,"touchmove touchend",drag.handler); else
$event.remove(document,"mousemove mouseup",drag.handler); if(dd.dragging){if(dd.drop!==false&&$special.drop)
$special.drop.handler(event,dd);drag.hijack(event,"dragend",dd);}
drag.textselect(true);
if(dd.click===false&&dd.dragging)
$.data(dd.mousedown,"suppress.click",new Date().getTime()+5);dd.dragging=drag.touched=false; break;}}, hijack:function(event,type,dd,x,elem){ if(!dd)
return;  var orig={event:event.originalEvent,type:event.type},mode=type.indexOf("drop")?"drag":"drop", result,i=x||0,ia,$elems,callback,len=!isNaN(x)?x:dd.interactions.length; event.type=type; event.originalEvent=null; dd.results=[]; do if(ia=dd.interactions[i]){ if(type!=="dragend"&&ia.cancelled)
continue; callback=drag.properties(event,dd,ia); ia.results=[]; $(elem||ia[mode]||dd.droppable).each(function(p,subject){ callback.target=subject; event.isPropagationStopped=function(){return false;}; result=subject?$event.dispatch.call(subject,event,callback):null; if(result===false){if(mode=="drag"){ia.cancelled=true;dd.propagates-=1;}
if(type=="drop"){ia[mode][p]=null;}} 
else if(type=="dropinit")
ia.droppable.push(drag.element(result)||subject); if(type=="dragstart")
ia.proxy=$(drag.element(result)||ia.drag)[0]; ia.results.push(result); delete event.result; if(type!=="dropinit")
return result;}); dd.results[i]=drag.flatten(ia.results); if(type=="dropinit")
ia.droppable=drag.flatten(ia.droppable); if(type=="dragstart"&&!ia.cancelled)
callback.update();}
while(++i<len) 
event.type=orig.type;event.originalEvent=orig.event; return drag.flatten(dd.results);},properties:function(event,dd,ia){var obj=ia.callback; obj.drag=ia.drag;obj.proxy=ia.proxy||ia.drag; obj.startX=dd.pageX;obj.startY=dd.pageY; obj.deltaX=event.pageX-dd.pageX;obj.deltaY=event.pageY-dd.pageY; obj.originalX=ia.offset.left;obj.originalY=ia.offset.top; obj.offsetX=obj.originalX+obj.deltaX;obj.offsetY=obj.originalY+obj.deltaY; obj.drop=drag.flatten((ia.drop||[]).slice());obj.available=drag.flatten((ia.droppable||[]).slice());return obj;},  element:function(arg){if(arg&&(arg.jquery||arg.nodeType==1))
return arg;}, flatten:function(arr){return $.map(arr,function(member){return member&&member.jquery?$.makeArray(member):member&&member.length?drag.flatten(member):member;});},textselect:function(bool){$(document)[bool?"unbind":"bind"]("selectstart",drag.dontstart).css("MozUserSelect",bool?"":"none");document.unselectable=bool?"off":"on";}, dontstart:function(){return false;}, callback:function(){}};drag.callback.prototype={update:function(){if($special.drop&&this.available.length)
$.each(this.available,function(i){$special.drop.locate(this,i);});}};var $dispatch=$event.dispatch;$event.dispatch=function(event){if($.data(this,"suppress."+event.type)-new Date().getTime()>0){$.removeData(this,"suppress."+event.type);return;}
return $dispatch.apply(this,arguments);};var touchHooks=$event.fixHooks.touchstart=$event.fixHooks.touchmove=$event.fixHooks.touchend=$event.fixHooks.touchcancel={props:"clientX clientY pageX pageY screenX screenY".split(" "),filter:function(event,orig){if(orig){var touched=(orig.touches&&orig.touches[0])||(orig.changedTouches&&orig.changedTouches[0])||null; if(touched)
$.each(touchHooks.props,function(i,prop){event[prop]=touched[prop];});}
return event;}};$special.draginit=$special.dragstart=$special.dragend=drag;})(jQuery);(function($){ $.extend(true,window,{"Slick":{"Event":Event,"EventData":EventData,"EventHandler":EventHandler,"Range":Range,"NonDataRow":NonDataItem,"Group":Group,"GroupTotals":GroupTotals,"EditorLock":EditorLock,"GlobalEditorLock":new EditorLock()}});function EventData(){var isPropagationStopped=false;var isImmediatePropagationStopped=false;this.stopPropagation=function(){isPropagationStopped=true;};this.isPropagationStopped=function(){return isPropagationStopped;};this.stopImmediatePropagation=function(){isImmediatePropagationStopped=true;};this.isImmediatePropagationStopped=function(){return isImmediatePropagationStopped;}}
function Event(){var handlers=[];this.subscribe=function(fn){handlers.push(fn);};this.unsubscribe=function(fn){for(var i=handlers.length-1;i>=0;i--){if(handlers[i]===fn){handlers.splice(i,1);}}};this.notify=function(args,e,scope){e=e||new EventData();scope=scope||this;var returnValue;for(var i=0;i<handlers.length&&!(e.isPropagationStopped()||e.isImmediatePropagationStopped());i++){returnValue=handlers[i].call(scope,e,args);}
return returnValue;};}
function EventHandler(){var handlers=[];this.subscribe=function(event,handler){handlers.push({event:event,handler:handler});event.subscribe(handler);return this;};this.unsubscribe=function(event,handler){var i=handlers.length;while(i--){if(handlers[i].event===event&&handlers[i].handler===handler){handlers.splice(i,1);event.unsubscribe(handler);return;}}
return this;};this.unsubscribeAll=function(){var i=handlers.length;while(i--){handlers[i].event.unsubscribe(handlers[i].handler);}
handlers=[];return this;}}
function Range(fromRow,fromCell,toRow,toCell){if(toRow===undefined&&toCell===undefined){toRow=fromRow;toCell=fromCell;}
this.fromRow=Math.min(fromRow,toRow);this.fromCell=Math.min(fromCell,toCell);this.toRow=Math.max(fromRow,toRow);this.toCell=Math.max(fromCell,toCell);this.isSingleRow=function(){return this.fromRow==this.toRow;};this.isSingleCell=function(){return this.fromRow==this.toRow&&this.fromCell==this.toCell;};this.contains=function(row,cell){return row>=this.fromRow&&row<=this.toRow&&cell>=this.fromCell&&cell<=this.toCell;};this.toString=function(){if(this.isSingleCell()){return"("+this.fromRow+":"+this.fromCell+")";}
else{return"("+this.fromRow+":"+this.fromCell+" - "+this.toRow+":"+this.toCell+")";}}}
function NonDataItem(){this.__nonDataRow=true;}
function Group(){this.__group=true;this.level=0;this.count=0;this.value=null;this.title=null;this.collapsed=false;this.totals=null;this.rows=[];this.groups=null;this.groupingKey=null;}
Group.prototype=new NonDataItem();Group.prototype.equals=function(group){return this.value===group.value&&this.count===group.count&&this.collapsed===group.collapsed;};function GroupTotals(){this.__groupTotals=true;this.group=null;}
GroupTotals.prototype=new NonDataItem();function EditorLock(){var activeEditController=null;this.isActive=function(editController){return(editController?activeEditController===editController:activeEditController!==null);};this.activate=function(editController){if(editController===activeEditController){return;}
if(activeEditController!==null){throw"SlickGrid.EditorLock.activate: an editController is still active, can't activate another editController";}
if(!editController.commitCurrentEdit){throw"SlickGrid.EditorLock.activate: editController must implement .commitCurrentEdit()";}
if(!editController.cancelCurrentEdit){throw"SlickGrid.EditorLock.activate: editController must implement .cancelCurrentEdit()";}
activeEditController=editController;};this.deactivate=function(editController){if(activeEditController!==editController){throw"SlickGrid.EditorLock.deactivate: specified editController is not the currently active one";}
activeEditController=null;};this.commitCurrentEdit=function(){return(activeEditController?activeEditController.commitCurrentEdit():true);};this.cancelCurrentEdit=function cancelCurrentEdit(){return(activeEditController?activeEditController.cancelCurrentEdit():true);};}})(jQuery);if(typeof jQuery==="undefined"){throw"SlickGrid requires jquery module to be loaded";}
if(!jQuery.fn.drag){throw"SlickGrid requires jquery.event.drag module to be loaded";}
if(typeof Slick==="undefined"){throw"slick.core.js not loaded";}
(function($){ $.extend(true,window,{Slick:{Grid:SlickGrid}}); var scrollbarDimensions;var maxSupportedCssHeight;
function SlickGrid(container,data,columns,options){ var defaults={explicitInitialization:false,rowHeight:25,defaultColumnWidth:80,enableAddRow:false,leaveSpaceForNewRows:false,editable:false,autoEdit:true,enableCellNavigation:true,enableColumnReorder:true,asyncEditorLoading:false,asyncEditorLoadDelay:100,forceFitColumns:false,enableAsyncPostRender:false,asyncPostRenderDelay:50,autoHeight:false,editorLock:Slick.GlobalEditorLock,showHeaderRow:false,headerRowHeight:25,showTopPanel:false,topPanelHeight:25,formatterFactory:null,editorFactory:null,cellFlashingCssClass:"flashing",selectedCellCssClass:"selected",multiSelect:true,enableTextSelectionOnCells:false,dataItemColumnValueExtractor:null,fullWidthRows:false,multiColumnSort:false,defaultFormatter:defaultFormatter,forceSyncScrolling:false};var columnDefaults={name:"",resizable:true,sortable:false,minWidth:30,rerenderOnResize:false,headerCssClass:null,defaultSortAsc:true,focusable:true,selectable:true}; var th; var h; var ph; var n; var cj; var page=0; var offset=0; var vScrollDir=1; var initialized=false;var $container;var uid="slickgrid_"+Math.round(1000000*Math.random());var self=this;var $focusSink,$focusSink2;var $headerScroller;var $headers;var $headerRow,$headerRowScroller,$headerRowSpacer;var $topPanelScroller;var $topPanel;var $viewport;var $canvas;var $style;var $boundAncestors;var stylesheet,columnCssRulesL,columnCssRulesR;var viewportH,viewportW;var canvasWidth;var viewportHasHScroll,viewportHasVScroll;var headerColumnWidthDiff=0,headerColumnHeightDiff=0, cellWidthDiff=0,cellHeightDiff=0;var absoluteColumnMinWidth;var numberOfRows=0;var tabbingDirection=1;var activePosX;var activeRow,activeCell;var activeCellNode=null;var currentEditor=null;var serializedEditorValue;var editController;var rowsCache={};var renderedRows=0;var numVisibleRows;var prevScrollTop=0;var scrollTop=0;var lastRenderedScrollTop=0;var lastRenderedScrollLeft=0;var prevScrollLeft=0;var scrollLeft=0;var selectionModel;var selectedRows=[];var plugins=[];var cellCssClasses={};var columnsById={};var sortColumns=[];var columnPosLeft=[];var columnPosRight=[]; var h_editorLoader=null;var h_render=null;var h_postrender=null;var postProcessedRows={};var postProcessToRow=null;var postProcessFromRow=null; var counter_rows_rendered=0;var counter_rows_removed=0; function init(){$container=$(container);if($container.length<1){throw new Error("SlickGrid requires a valid container, "+container+" does not exist in the DOM.");} 
maxSupportedCssHeight=maxSupportedCssHeight||getMaxSupportedCssHeight();scrollbarDimensions=scrollbarDimensions||measureScrollbar();options=$.extend({},defaults,options);validateAndEnforceOptions();columnDefaults.width=options.defaultColumnWidth;columnsById={};for(var i=0;i<columns.length;i++){var m=columns[i]=$.extend({},columnDefaults,columns[i]);columnsById[m.id]=i;if(m.minWidth&&m.width<m.minWidth){m.width=m.minWidth;}
if(m.maxWidth&&m.width>m.maxWidth){m.width=m.maxWidth;}} 
if(options.enableColumnReorder&&!$.fn.sortable){throw new Error("SlickGrid's 'enableColumnReorder = true' option requires jquery-ui.sortable module to be loaded");}
editController={"commitCurrentEdit":commitCurrentEdit,"cancelCurrentEdit":cancelCurrentEdit};$container.empty().css("overflow","hidden").css("outline",0).addClass(uid).addClass("ui-widget"); if(!/relative|absolute|fixed/.test($container.css("position"))){$container.css("position","relative");}
$focusSink=$("<div tabIndex='0' hideFocus style='position:fixed;width:0;height:0;top:0;left:0;outline:0;'></div>").appendTo($container);$headerScroller=$("<div class='slick-header ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$headers=$("<div class='slick-header-columns' style='left:-1000px' />").appendTo($headerScroller);$headers.width(getHeadersWidth());$headerRowScroller=$("<div class='slick-headerrow ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$headerRow=$("<div class='slick-headerrow-columns' />").appendTo($headerRowScroller);$headerRowSpacer=$("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>").css("width",getCanvasWidth()+scrollbarDimensions.width+"px").appendTo($headerRowScroller);$topPanelScroller=$("<div class='slick-top-panel-scroller ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$topPanel=$("<div class='slick-top-panel' style='width:10000px' />").appendTo($topPanelScroller);if(!options.showTopPanel){$topPanelScroller.hide();}
if(!options.showHeaderRow){$headerRowScroller.hide();}
$viewport=$("<div class='slick-viewport' style='width:100%;overflow:auto;outline:0;position:relative;;'>").appendTo($container);$viewport.css("overflow-y",options.autoHeight?"hidden":"auto");$canvas=$("<div class='grid-canvas' />").appendTo($viewport);$focusSink2=$focusSink.clone().appendTo($container);if(!options.explicitInitialization){finishInitialization();}}
function finishInitialization(){if(!initialized){initialized=true;viewportW=parseFloat($.css($container[0],"width",true)); 
measureCellPaddingAndBorder();



 disableSelection($headers);if(!options.enableTextSelectionOnCells){
$viewport.bind("selectstart.ui",function(event){return $(event.target).is("input,textarea");});}
updateColumnCaches();createColumnHeaders();setupColumnSort();createCssRules();resizeCanvas();bindAncestorScrollEvents();$container.bind("resize.slickgrid",resizeCanvas);$viewport.bind("scroll",handleScroll);$headerScroller.bind("contextmenu",handleHeaderContextMenu).bind("click",handleHeaderClick).delegate(".slick-header-column","mouseenter",handleHeaderMouseEnter).delegate(".slick-header-column","mouseleave",handleHeaderMouseLeave);$headerRowScroller.bind("scroll",handleHeaderRowScroll);$focusSink.add($focusSink2).bind("keydown",handleKeyDown);$canvas.bind("keydown",handleKeyDown).bind("click",handleClick).bind("dblclick",handleDblClick).bind("contextmenu",handleContextMenu).bind("draginit",handleDragInit).bind("dragstart",{distance:3},handleDragStart).bind("drag",handleDrag).bind("dragend",handleDragEnd).delegate(".slick-cell","mouseenter",handleMouseEnter).delegate(".slick-cell","mouseleave",handleMouseLeave);}}
function registerPlugin(plugin){plugins.unshift(plugin);plugin.init(self);}
function unregisterPlugin(plugin){for(var i=plugins.length;i>=0;i--){if(plugins[i]===plugin){if(plugins[i].destroy){plugins[i].destroy();}
plugins.splice(i,1);break;}}}
function setSelectionModel(model){if(selectionModel){selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);if(selectionModel.destroy){selectionModel.destroy();}}
selectionModel=model;if(selectionModel){selectionModel.init(self);selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);}}
function getSelectionModel(){return selectionModel;}
function getCanvasNode(){return $canvas[0];}
function measureScrollbar(){var $c=$("<div style='position:absolute; top:-10000px; left:-10000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body");var dim={width:$c.width()-$c[0].clientWidth,height:$c.height()-$c[0].clientHeight};$c.remove();return dim;}
function getHeadersWidth(){var headersWidth=0;for(var i=0,ii=columns.length;i<ii;i++){var width=columns[i].width;headersWidth+=width;}
headersWidth+=scrollbarDimensions.width;return Math.max(headersWidth,viewportW)+1000;}
function getCanvasWidth(){var availableWidth=viewportHasVScroll?viewportW-scrollbarDimensions.width:viewportW;var rowWidth=0;var i=columns.length;while(i--){rowWidth+=columns[i].width;}
return options.fullWidthRows?Math.max(rowWidth,availableWidth):rowWidth;}
function updateCanvasWidth(forceColumnWidthsUpdate){var oldCanvasWidth=canvasWidth;canvasWidth=getCanvasWidth();if(canvasWidth!=oldCanvasWidth){$canvas.width(canvasWidth);$headerRow.width(canvasWidth);$headers.width(getHeadersWidth());viewportHasHScroll=(canvasWidth>viewportW-scrollbarDimensions.width);}
$headerRowSpacer.width(canvasWidth+(viewportHasVScroll?scrollbarDimensions.width:0));if(canvasWidth!=oldCanvasWidth||forceColumnWidthsUpdate){applyColumnWidths();}}
function disableSelection($target){if($target&&$target.jquery){$target.attr("unselectable","on").css("MozUserSelect","none").bind("selectstart.ui",function(){return false;});}}
function getMaxSupportedCssHeight(){var supportedHeight=1000000; var testUpTo=navigator.userAgent.toLowerCase().match(/firefox/)?6000000:1000000000;var div=$("<div style='display:none' />").appendTo(document.body);while(true){var test=supportedHeight*2;div.css("height",test);if(test>testUpTo||div.height()!==test){break;}else{supportedHeight=test;}}
div.remove();return supportedHeight;}
function bindAncestorScrollEvents(){var elem=$canvas[0];while((elem=elem.parentNode)!=document.body&&elem!=null){ if(elem==$viewport[0]||elem.scrollWidth!=elem.clientWidth||elem.scrollHeight!=elem.clientHeight){var $elem=$(elem);if(!$boundAncestors){$boundAncestors=$elem;}else{$boundAncestors=$boundAncestors.add($elem);}
$elem.bind("scroll."+uid,handleActiveCellPositionChange);}}}
function unbindAncestorScrollEvents(){if(!$boundAncestors){return;}
$boundAncestors.unbind("scroll."+uid);$boundAncestors=null;}
function updateColumnHeader(columnId,title,toolTip){if(!initialized){return;}
var idx=getColumnIndex(columnId);if(idx==null){return;}
var columnDef=columns[idx];var $header=$headers.children().eq(idx);if($header){if(title!==undefined){columns[idx].name=title;}
if(toolTip!==undefined){columns[idx].toolTip=toolTip;}
trigger(self.onBeforeHeaderCellDestroy,{"node":$header[0],"column":columnDef});$header.attr("title",toolTip||"").children().eq(0).html(title);trigger(self.onHeaderCellRendered,{"node":$header[0],"column":columnDef});}}
function getHeaderRow(){return $headerRow[0];}
function getHeaderRowColumn(columnId){var idx=getColumnIndex(columnId);var $header=$headerRow.children().eq(idx);return $header&&$header[0];}
function createColumnHeaders(){function onMouseEnter(){$(this).addClass("ui-state-hover");}
function onMouseLeave(){$(this).removeClass("ui-state-hover");}
$headers.find(".slick-header-column").each(function(){var columnDef=$(this).data("column");if(columnDef){trigger(self.onBeforeHeaderCellDestroy,{"node":this,"column":columnDef});}});$headers.empty();$headers.width(getHeadersWidth());$headerRow.find(".slick-headerrow-column").each(function(){var columnDef=$(this).data("column");if(columnDef){trigger(self.onBeforeHeaderRowCellDestroy,{"node":this,"column":columnDef});}});$headerRow.empty();for(var i=0;i<columns.length;i++){var m=columns[i];var header=$("<div class='ui-state-default slick-header-column' />").html("<span class='slick-column-name'>"+m.name+"</span>").width(m.width-headerColumnWidthDiff).attr("id",""+uid+m.id).attr("title",m.toolTip||"").data("column",m).addClass(m.headerCssClass||"").appendTo($headers);if(options.enableColumnReorder||m.sortable){header.on('mouseenter',onMouseEnter).on('mouseleave',onMouseLeave);}
if(m.sortable){header.addClass("slick-header-sortable");header.append("<span class='slick-sort-indicator' />");}
trigger(self.onHeaderCellRendered,{"node":header[0],"column":m});if(options.showHeaderRow){var headerRowCell=$("<div class='ui-state-default slick-headerrow-column l"+i+" r"+i+"'></div>").data("column",m).appendTo($headerRow);trigger(self.onHeaderRowCellRendered,{"node":headerRowCell[0],"column":m});}}
setSortColumns(sortColumns);setupColumnResize();if(options.enableColumnReorder){setupColumnReorder();}}
function setupColumnSort(){$headers.click(function(e){e.metaKey=e.metaKey||e.ctrlKey;if($(e.target).hasClass("slick-resizable-handle")){return;}
var $col=$(e.target).closest(".slick-header-column");if(!$col.length){return;}
var column=$col.data("column");if(column.sortable){if(!getEditorLock().commitCurrentEdit()){return;}
var sortOpts=null;var i=0;for(;i<sortColumns.length;i++){if(sortColumns[i].columnId==column.id){sortOpts=sortColumns[i];sortOpts.sortAsc=!sortOpts.sortAsc;break;}}
if(e.metaKey&&options.multiColumnSort){if(sortOpts){sortColumns.splice(i,1);}}
else{if((!e.shiftKey&&!e.metaKey)||!options.multiColumnSort){sortColumns=[];}
if(!sortOpts){sortOpts={columnId:column.id,sortAsc:column.defaultSortAsc};sortColumns.push(sortOpts);}else if(sortColumns.length==0){sortColumns.push(sortOpts);}}
setSortColumns(sortColumns);if(!options.multiColumnSort){trigger(self.onSort,{multiColumnSort:false,sortCol:column,sortAsc:sortOpts.sortAsc},e);}else{trigger(self.onSort,{multiColumnSort:true,sortCols:$.map(sortColumns,function(col){return{sortCol:columns[getColumnIndex(col.columnId)],sortAsc:col.sortAsc};})},e);}}});}
function setupColumnReorder(){$headers.filter(":ui-sortable").sortable("destroy");$headers.sortable({containment:"parent",distance:3,axis:"x",cursor:"default",tolerance:"intersection",helper:"clone",placeholder:"slick-sortable-placeholder ui-state-default slick-header-column",forcePlaceholderSize:true,start:function(e,ui){$(ui.helper).addClass("slick-header-column-active");},beforeStop:function(e,ui){$(ui.helper).removeClass("slick-header-column-active");},stop:function(e){if(!getEditorLock().commitCurrentEdit()){$(this).sortable("cancel");return;}
var reorderedIds=$headers.sortable("toArray");var reorderedColumns=[];for(var i=0;i<reorderedIds.length;i++){reorderedColumns.push(columns[getColumnIndex(reorderedIds[i].replace(uid,""))]);}
setColumns(reorderedColumns);trigger(self.onColumnsReordered,{});e.stopPropagation();setupColumnResize();}});}
function setupColumnResize(){var $col,j,c,pageX,columnElements,minPageX,maxPageX,firstResizable,lastResizable;columnElements=$headers.children();columnElements.find(".slick-resizable-handle").remove();columnElements.each(function(i,e){if(columns[i].resizable){if(firstResizable===undefined){firstResizable=i;}
lastResizable=i;}});if(firstResizable===undefined){return;}
columnElements.each(function(i,e){if(i<firstResizable||(options.forceFitColumns&&i>=lastResizable)){return;}
$col=$(e);$("<div class='slick-resizable-handle' />").appendTo(e).bind("dragstart",function(e,dd){if(!getEditorLock().commitCurrentEdit()){return false;}
pageX=e.pageX;$(this).parent().addClass("slick-header-column-active");var shrinkLeewayOnRight=null,stretchLeewayOnRight=null; columnElements.each(function(i,e){columns[i].previousWidth=$(e).outerWidth();});if(options.forceFitColumns){shrinkLeewayOnRight=0;stretchLeewayOnRight=0; for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){if(stretchLeewayOnRight!==null){if(c.maxWidth){stretchLeewayOnRight+=c.maxWidth-c.previousWidth;}else{stretchLeewayOnRight=null;}}
shrinkLeewayOnRight+=c.previousWidth-Math.max(c.minWidth||0,absoluteColumnMinWidth);}}}
var shrinkLeewayOnLeft=0,stretchLeewayOnLeft=0;for(j=0;j<=i;j++){ c=columns[j];if(c.resizable){if(stretchLeewayOnLeft!==null){if(c.maxWidth){stretchLeewayOnLeft+=c.maxWidth-c.previousWidth;}else{stretchLeewayOnLeft=null;}}
shrinkLeewayOnLeft+=c.previousWidth-Math.max(c.minWidth||0,absoluteColumnMinWidth);}}
if(shrinkLeewayOnRight===null){shrinkLeewayOnRight=100000;}
if(shrinkLeewayOnLeft===null){shrinkLeewayOnLeft=100000;}
if(stretchLeewayOnRight===null){stretchLeewayOnRight=100000;}
if(stretchLeewayOnLeft===null){stretchLeewayOnLeft=100000;}
maxPageX=pageX+Math.min(shrinkLeewayOnRight,stretchLeewayOnLeft);minPageX=pageX-Math.min(shrinkLeewayOnLeft,stretchLeewayOnRight);}).bind("drag",function(e,dd){var actualMinWidth,d=Math.min(maxPageX,Math.max(minPageX,e.pageX))-pageX,x;if(d<0){ x=d;for(j=i;j>=0;j--){c=columns[j];if(c.resizable){actualMinWidth=Math.max(c.minWidth||0,absoluteColumnMinWidth);if(x&&c.previousWidth+x<actualMinWidth){x+=c.previousWidth-actualMinWidth;c.width=actualMinWidth;}else{c.width=c.previousWidth+x;x=0;}}}
if(options.forceFitColumns){x=-d;for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){if(x&&c.maxWidth&&(c.maxWidth-c.previousWidth<x)){x-=c.maxWidth-c.previousWidth;c.width=c.maxWidth;}else{c.width=c.previousWidth+x;x=0;}}}}}else{ x=d;for(j=i;j>=0;j--){c=columns[j];if(c.resizable){if(x&&c.maxWidth&&(c.maxWidth-c.previousWidth<x)){x-=c.maxWidth-c.previousWidth;c.width=c.maxWidth;}else{c.width=c.previousWidth+x;x=0;}}}
if(options.forceFitColumns){x=-d;for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){actualMinWidth=Math.max(c.minWidth||0,absoluteColumnMinWidth);if(x&&c.previousWidth+x<actualMinWidth){x+=c.previousWidth-actualMinWidth;c.width=actualMinWidth;}else{c.width=c.previousWidth+x;x=0;}}}}}
applyColumnHeaderWidths();if(options.syncColumnCellResize){applyColumnWidths();}}).bind("dragend",function(e,dd){var newWidth;$(this).parent().removeClass("slick-header-column-active");for(j=0;j<columnElements.length;j++){c=columns[j];newWidth=$(columnElements[j]).outerWidth();if(c.previousWidth!==newWidth&&c.rerenderOnResize){invalidateAllRows();}}
updateCanvasWidth(true);render();trigger(self.onColumnsResized,{});});});}
function getVBoxDelta($el){var p=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"];var delta=0;$.each(p,function(n,val){delta+=parseFloat($el.css(val))||0;});return delta;}
function measureCellPaddingAndBorder(){var el;var h=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"];var v=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"];el=$("<div class='ui-state-default slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);headerColumnWidthDiff=headerColumnHeightDiff=0;$.each(h,function(n,val){headerColumnWidthDiff+=parseFloat(el.css(val))||0;});$.each(v,function(n,val){headerColumnHeightDiff+=parseFloat(el.css(val))||0;});el.remove();var r=$("<div class='slick-row' />").appendTo($canvas);el=$("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);cellWidthDiff=cellHeightDiff=0;$.each(h,function(n,val){cellWidthDiff+=parseFloat(el.css(val))||0;});$.each(v,function(n,val){cellHeightDiff+=parseFloat(el.css(val))||0;});r.remove();absoluteColumnMinWidth=Math.max(headerColumnWidthDiff,cellWidthDiff);}
function createCssRules(){$style=$("<style type='text/css' rel='stylesheet' />").appendTo($("head"));var rowHeight=(options.rowHeight-cellHeightDiff);var rules=["."+uid+" .slick-header-column { left: 1000px; }","."+uid+" .slick-top-panel { height:"+options.topPanelHeight+"px; }","."+uid+" .slick-headerrow-columns { height:"+options.headerRowHeight+"px; }","."+uid+" .slick-cell { height:"+rowHeight+"px; }","."+uid+" .slick-row { height:"+options.rowHeight+"px; }"];for(var i=0;i<columns.length;i++){rules.push("."+uid+" .l"+i+" { }");rules.push("."+uid+" .r"+i+" { }");}
if($style[0].styleSheet){ $style[0].styleSheet.cssText=rules.join(" ");}else{$style[0].appendChild(document.createTextNode(rules.join(" ")));}}
function getColumnCssRules(idx){if(!stylesheet){var sheets=document.styleSheets;for(var i=0;i<sheets.length;i++){if((sheets[i].ownerNode||sheets[i].owningElement)==$style[0]){stylesheet=sheets[i];break;}}
if(!stylesheet){throw new Error("Cannot find stylesheet.");} 
columnCssRulesL=[];columnCssRulesR=[];var cssRules=(stylesheet.cssRules||stylesheet.rules);var matches,columnIdx;for(var i=0;i<cssRules.length;i++){var selector=cssRules[i].selectorText;if(matches=/\.l\d+/.exec(selector)){columnIdx=parseInt(matches[0].substr(2,matches[0].length-2),10);columnCssRulesL[columnIdx]=cssRules[i];}else if(matches=/\.r\d+/.exec(selector)){columnIdx=parseInt(matches[0].substr(2,matches[0].length-2),10);columnCssRulesR[columnIdx]=cssRules[i];}}}
return{"left":columnCssRulesL[idx],"right":columnCssRulesR[idx]};}
function removeCssRules(){$style.remove();stylesheet=null;}
function destroy(){getEditorLock().cancelCurrentEdit();trigger(self.onBeforeDestroy,{});var i=plugins.length;while(i--){unregisterPlugin(plugins[i]);}
if(options.enableColumnReorder){$headers.filter(":ui-sortable").sortable("destroy");}
unbindAncestorScrollEvents();$container.unbind(".slickgrid");removeCssRules();$canvas.unbind("draginit dragstart dragend drag");$container.empty().removeClass(uid);} 
function trigger(evt,args,e){e=e||new Slick.EventData();args=args||{};args.grid=self;return evt.notify(args,e,self);}
function getEditorLock(){return options.editorLock;}
function getEditController(){return editController;}
function getColumnIndex(id){return columnsById[id];}
function autosizeColumns(){var i,c,widths=[],shrinkLeeway=0,total=0,prevTotal,availWidth=viewportHasVScroll?viewportW-scrollbarDimensions.width:viewportW;for(i=0;i<columns.length;i++){c=columns[i];widths.push(c.width);total+=c.width;if(c.resizable){shrinkLeeway+=c.width-Math.max(c.minWidth,absoluteColumnMinWidth);}} 
prevTotal=total;while(total>availWidth&&shrinkLeeway){var shrinkProportion=(total-availWidth)/shrinkLeeway;for(i=0;i<columns.length&&total>availWidth;i++){c=columns[i];var width=widths[i];if(!c.resizable||width<=c.minWidth||width<=absoluteColumnMinWidth){continue;}
var absMinWidth=Math.max(c.minWidth,absoluteColumnMinWidth);var shrinkSize=Math.floor(shrinkProportion*(width-absMinWidth))||1;shrinkSize=Math.min(shrinkSize,width-absMinWidth);total-=shrinkSize;shrinkLeeway-=shrinkSize;widths[i]-=shrinkSize;}
if(prevTotal==total){ break;}
prevTotal=total;} 
prevTotal=total;while(total<availWidth){var growProportion=availWidth/total;for(i=0;i<columns.length&&total<availWidth;i++){c=columns[i];if(!c.resizable||c.maxWidth<=c.width){continue;}
var growSize=Math.min(Math.floor(growProportion*c.width)-c.width,(c.maxWidth-c.width)||1000000)||1;total+=growSize;widths[i]+=growSize;}
if(prevTotal==total){ break;}
prevTotal=total;}
var reRender=false;for(i=0;i<columns.length;i++){if(columns[i].rerenderOnResize&&columns[i].width!=widths[i]){reRender=true;}
columns[i].width=widths[i];}
applyColumnHeaderWidths();updateCanvasWidth(true);if(reRender){invalidateAllRows();render();}}
function applyColumnHeaderWidths(){if(!initialized){return;}
var h;for(var i=0,headers=$headers.children(),ii=headers.length;i<ii;i++){h=$(headers[i]);if(h.width()!==columns[i].width-headerColumnWidthDiff){h.width(columns[i].width-headerColumnWidthDiff);}}
updateColumnCaches();}
function applyColumnWidths(){var x=0,w,rule;for(var i=0;i<columns.length;i++){w=columns[i].width;rule=getColumnCssRules(i);rule.left.style.left=x+"px";rule.right.style.right=(canvasWidth-x-w)+"px";x+=columns[i].width;}}
function setSortColumn(columnId,ascending){setSortColumns([{columnId:columnId,sortAsc:ascending}]);}
function setSortColumns(cols){sortColumns=cols;var headerColumnEls=$headers.children();headerColumnEls.removeClass("slick-header-column-sorted").find(".slick-sort-indicator").removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");$.each(sortColumns,function(i,col){if(col.sortAsc==null){col.sortAsc=true;}
var columnIndex=getColumnIndex(col.columnId);if(columnIndex!=null){headerColumnEls.eq(columnIndex).addClass("slick-header-column-sorted").find(".slick-sort-indicator").addClass(col.sortAsc?"slick-sort-indicator-asc":"slick-sort-indicator-desc");}});}
function getSortColumns(){return sortColumns;}
function handleSelectedRangesChanged(e,ranges){selectedRows=[];var hash={};for(var i=0;i<ranges.length;i++){for(var j=ranges[i].fromRow;j<=ranges[i].toRow;j++){if(!hash[j]){ selectedRows.push(j);hash[j]={};}
for(var k=ranges[i].fromCell;k<=ranges[i].toCell;k++){if(canCellBeSelected(j,k)){hash[j][columns[k].id]=options.selectedCellCssClass;}}}}
setCellCssStyles(options.selectedCellCssClass,hash);trigger(self.onSelectedRowsChanged,{rows:getSelectedRows()},e);}
function getColumns(){return columns;}
function updateColumnCaches(){columnPosLeft=[];columnPosRight=[];var x=0;for(var i=0,ii=columns.length;i<ii;i++){columnPosLeft[i]=x;columnPosRight[i]=x+columns[i].width;x+=columns[i].width;}}
function setColumns(columnDefinitions){columns=columnDefinitions;columnsById={};for(var i=0;i<columns.length;i++){var m=columns[i]=$.extend({},columnDefaults,columns[i]);columnsById[m.id]=i;if(m.minWidth&&m.width<m.minWidth){m.width=m.minWidth;}
if(m.maxWidth&&m.width>m.maxWidth){m.width=m.maxWidth;}}
updateColumnCaches();if(initialized){invalidateAllRows();createColumnHeaders();removeCssRules();createCssRules();resizeCanvas();applyColumnWidths();handleScroll();}}
function getOptions(){return options;}
function setOptions(args){if(!getEditorLock().commitCurrentEdit()){return;}
makeActiveCellNormal();if(options.enableAddRow!==args.enableAddRow){invalidateRow(getDataLength());}
options=$.extend(options,args);validateAndEnforceOptions();$viewport.css("overflow-y",options.autoHeight?"hidden":"auto");render();}
function validateAndEnforceOptions(){if(options.autoHeight){options.leaveSpaceForNewRows=false;}}
function setData(newData,scrollToTop){data=newData;invalidateAllRows();updateRowCount();if(scrollToTop){scrollTo(0);}}
function getData(){return data;}
function getDataLength(){if(data.getLength){return data.getLength();}else{return data.length;}}
function getDataItem(i){if(data.getItem){return data.getItem(i);}else{return data[i];}}
function getTopPanel(){return $topPanel[0];}
function setTopPanelVisibility(visible){if(options.showTopPanel!=visible){options.showTopPanel=visible;if(visible){$topPanelScroller.slideDown("fast",resizeCanvas);}else{$topPanelScroller.slideUp("fast",resizeCanvas);}}}
function setHeaderRowVisibility(visible){if(options.showHeaderRow!=visible){options.showHeaderRow=visible;if(visible){$headerRowScroller.slideDown("fast",resizeCanvas);}else{$headerRowScroller.slideUp("fast",resizeCanvas);}}}
function getContainerNode(){return $container.get(0);} 
function getRowTop(row){return options.rowHeight*row-offset;}
function getRowFromPosition(y){return Math.floor((y+offset)/options.rowHeight);}
function scrollTo(y){y=Math.max(y,0);y=Math.min(y,th-viewportH+(viewportHasHScroll?scrollbarDimensions.height:0));var oldOffset=offset;page=Math.min(n-1,Math.floor(y/ph));offset=Math.round(page*cj);var newScrollTop=y-offset;if(offset!=oldOffset){var range=getVisibleRange(newScrollTop);cleanupRows(range);updateRowPositions();}
if(prevScrollTop!=newScrollTop){vScrollDir=(prevScrollTop+oldOffset<newScrollTop+offset)?1:-1;$viewport[0].scrollTop=(lastRenderedScrollTop=scrollTop=prevScrollTop=newScrollTop);trigger(self.onViewportChanged,{});}}
function defaultFormatter(row,cell,value,columnDef,dataContext){if(value==null){return"";}else{return(value+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}}
function getFormatter(row,column){var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row); var columnOverrides=rowMetadata&&rowMetadata.columns&&(rowMetadata.columns[column.id]||rowMetadata.columns[getColumnIndex(column.id)]);return(columnOverrides&&columnOverrides.formatter)||(rowMetadata&&rowMetadata.formatter)||column.formatter||(options.formatterFactory&&options.formatterFactory.getFormatter(column))||options.defaultFormatter;}
function getEditor(row,cell){var column=columns[cell];var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);var columnMetadata=rowMetadata&&rowMetadata.columns;if(columnMetadata&&columnMetadata[column.id]&&columnMetadata[column.id].editor!==undefined){return columnMetadata[column.id].editor;}
if(columnMetadata&&columnMetadata[cell]&&columnMetadata[cell].editor!==undefined){return columnMetadata[cell].editor;}
return column.editor||(options.editorFactory&&options.editorFactory.getEditor(column));}
function getDataItemValueForColumn(item,columnDef){if(options.dataItemColumnValueExtractor){return options.dataItemColumnValueExtractor(item,columnDef);}
return item[columnDef.field];}
function appendRowHtml(stringArray,row,range,dataLength){var d=getDataItem(row);var dataLoading=row<dataLength&&!d;var rowCss="slick-row"+
(dataLoading?" loading":"")+
(row===activeRow?" active":"")+
(row%2==1?" odd":" even");var metadata=data.getItemMetadata&&data.getItemMetadata(row);if(metadata&&metadata.cssClasses){rowCss+=" "+metadata.cssClasses;}
stringArray.push("<div class='ui-widget-content "+rowCss+"' style='top:"+getRowTop(row)+"px'>");var colspan,m;for(var i=0,ii=columns.length;i<ii;i++){m=columns[i];colspan=1;if(metadata&&metadata.columns){var columnData=metadata.columns[m.id]||metadata.columns[i];colspan=(columnData&&columnData.colspan)||1;if(colspan==="*"){colspan=ii-i;}}
if(columnPosRight[Math.min(ii-1,i+colspan-1)]>range.leftPx){if(columnPosLeft[i]>range.rightPx){break;}
appendCellHtml(stringArray,row,i,colspan,d);}
if(colspan>1){i+=(colspan-1);}}
stringArray.push("</div>");}
function appendCellHtml(stringArray,row,cell,colspan,item){var m=columns[cell];var cellCss="slick-cell l"+cell+" r"+Math.min(columns.length-1,cell+colspan-1)+
(m.cssClass?" "+m.cssClass:"");if(row===activeRow&&cell===activeCell){cellCss+=(" active");} 
for(var key in cellCssClasses){if(cellCssClasses[key][row]&&cellCssClasses[key][row][m.id]){cellCss+=(" "+cellCssClasses[key][row][m.id]);}}
stringArray.push("<div class='"+cellCss+"'>");if(item){var value=getDataItemValueForColumn(item,m);stringArray.push(getFormatter(row,m)(row,cell,value,m,item));}
stringArray.push("</div>");rowsCache[row].cellRenderQueue.push(cell);rowsCache[row].cellColSpans[cell]=colspan;}
function cleanupRows(rangeToKeep){for(var i in rowsCache){if(((i=parseInt(i,10))!==activeRow)&&(i<rangeToKeep.top||i>rangeToKeep.bottom)){removeRowFromCache(i);}}}
function invalidate(){updateRowCount();invalidateAllRows();render();}
function invalidateAllRows(){if(currentEditor){makeActiveCellNormal();}
for(var row in rowsCache){removeRowFromCache(row);}}
function removeRowFromCache(row){var cacheEntry=rowsCache[row];if(!cacheEntry){return;}
$canvas[0].removeChild(cacheEntry.rowNode);delete rowsCache[row];delete postProcessedRows[row];renderedRows--;counter_rows_removed++;}
function invalidateRows(rows){var i,rl;if(!rows||!rows.length){return;}
vScrollDir=0;for(i=0,rl=rows.length;i<rl;i++){if(currentEditor&&activeRow===rows[i]){makeActiveCellNormal();}
if(rowsCache[rows[i]]){removeRowFromCache(rows[i]);}}}
function invalidateRow(row){invalidateRows([row]);}
function updateCell(row,cell){var cellNode=getCellNode(row,cell);if(!cellNode){return;}
var m=columns[cell],d=getDataItem(row);if(currentEditor&&activeRow===row&&activeCell===cell){currentEditor.loadValue(d);}else{cellNode.innerHTML=d?getFormatter(row,m)(row,cell,getDataItemValueForColumn(d,m),m,d):"";invalidatePostProcessingResults(row);}}
function updateRow(row){var cacheEntry=rowsCache[row];if(!cacheEntry){return;}
ensureCellNodesInRowsCache(row);var d=getDataItem(row);for(var columnIdx in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)){continue;}
columnIdx=columnIdx|0;var m=columns[columnIdx],node=cacheEntry.cellNodesByColumnIdx[columnIdx];if(row===activeRow&&columnIdx===activeCell&&currentEditor){currentEditor.loadValue(d);}else if(d){node.innerHTML=getFormatter(row,m)(row,columnIdx,getDataItemValueForColumn(d,m),m,d);}else{node.innerHTML="";}}
invalidatePostProcessingResults(row);}
function getViewportHeight(){return parseFloat($.css($container[0],"height",true))-
parseFloat($.css($container[0],"paddingTop",true))-
parseFloat($.css($container[0],"paddingBottom",true))-
parseFloat($.css($headerScroller[0],"height"))-getVBoxDelta($headerScroller)-
(options.showTopPanel?options.topPanelHeight+getVBoxDelta($topPanelScroller):0)-
(options.showHeaderRow?options.headerRowHeight+getVBoxDelta($headerRowScroller):0);}
function resizeCanvas(){if(!initialized){return;}
if(options.autoHeight){viewportH=options.rowHeight*(getDataLength()+(options.enableAddRow?1:0));}else{viewportH=getViewportHeight();}
numVisibleRows=Math.ceil(viewportH/options.rowHeight);viewportW=parseFloat($.css($container[0],"width",true));if(!options.autoHeight){$viewport.height(viewportH);}
if(options.forceFitColumns){autosizeColumns();}
updateRowCount();handleScroll();render();}
function updateRowCount(){var dataLength=getDataLength();if(!initialized){return;}
numberOfRows=dataLength+
(options.enableAddRow?1:0)+
(options.leaveSpaceForNewRows?numVisibleRows-1:0);var oldViewportHasVScroll=viewportHasVScroll; viewportHasVScroll=!options.autoHeight&&(numberOfRows*options.rowHeight>viewportH);
 var l=options.enableAddRow?dataLength:dataLength-1;for(var i in rowsCache){if(i>=l){removeRowFromCache(i);}}
if(activeCellNode&&activeRow>l){resetActiveCell();}
var oldH=h;th=Math.max(options.rowHeight*numberOfRows,viewportH-scrollbarDimensions.height);if(th<maxSupportedCssHeight){ h=ph=th;n=1;cj=0;}else{ h=maxSupportedCssHeight;ph=h/100;n=Math.floor(th/ph);cj=(th-h)/(n-1);}
if(h!==oldH){$canvas.css("height",h);scrollTop=$viewport[0].scrollTop;}
var oldScrollTopInRange=(scrollTop+offset<=th-viewportH);if(th==0||scrollTop==0){page=offset=0;}else if(oldScrollTopInRange){ scrollTo(scrollTop+offset);}else{ scrollTo(th-viewportH);}
if(h!=oldH&&options.autoHeight){resizeCanvas();}
if(options.forceFitColumns&&oldViewportHasVScroll!=viewportHasVScroll){autosizeColumns();}
updateCanvasWidth(false);}
function getVisibleRange(viewportTop,viewportLeft){if(viewportTop==null){viewportTop=scrollTop;}
if(viewportLeft==null){viewportLeft=scrollLeft;}
return{top:getRowFromPosition(viewportTop),bottom:getRowFromPosition(viewportTop+viewportH)+1,leftPx:viewportLeft,rightPx:viewportLeft+viewportW};}
function getRenderedRange(viewportTop,viewportLeft){var range=getVisibleRange(viewportTop,viewportLeft);var buffer=Math.round(viewportH/options.rowHeight);var minBuffer=3;if(vScrollDir==-1){range.top-=buffer;range.bottom+=minBuffer;}else if(vScrollDir==1){range.top-=minBuffer;range.bottom+=buffer;}else{range.top-=minBuffer;range.bottom+=minBuffer;}
range.top=Math.max(0,range.top);range.bottom=Math.min(options.enableAddRow?getDataLength():getDataLength()-1,range.bottom);range.leftPx-=viewportW;range.rightPx+=viewportW;range.leftPx=Math.max(0,range.leftPx);range.rightPx=Math.min(canvasWidth,range.rightPx);return range;}
function ensureCellNodesInRowsCache(row){var cacheEntry=rowsCache[row];if(cacheEntry){if(cacheEntry.cellRenderQueue.length){var lastChild=cacheEntry.rowNode.lastChild;while(cacheEntry.cellRenderQueue.length){var columnIdx=cacheEntry.cellRenderQueue.pop();cacheEntry.cellNodesByColumnIdx[columnIdx]=lastChild;lastChild=lastChild.previousSibling;}}}}
function cleanUpCells(range,row){var totalCellsRemoved=0;var cacheEntry=rowsCache[row];var cellsToRemove=[];for(var i in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)){continue;}
i=i|0;var colspan=cacheEntry.cellColSpans[i];if(columnPosLeft[i]>range.rightPx||columnPosRight[Math.min(columns.length-1,i+colspan-1)]<range.leftPx){if(!(row==activeRow&&i==activeCell)){cellsToRemove.push(i);}}}
var cellToRemove;while((cellToRemove=cellsToRemove.pop())!=null){cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);delete cacheEntry.cellColSpans[cellToRemove];delete cacheEntry.cellNodesByColumnIdx[cellToRemove];if(postProcessedRows[row]){delete postProcessedRows[row][cellToRemove];}
totalCellsRemoved++;}}
function cleanUpAndRenderCells(range){var cacheEntry;var stringArray=[];var processedRows=[];var cellsAdded;var totalCellsAdded=0;var colspan;for(var row=range.top,btm=range.bottom;row<=btm;row++){cacheEntry=rowsCache[row];if(!cacheEntry){continue;} 
ensureCellNodesInRowsCache(row);cleanUpCells(range,row);cellsAdded=0;var metadata=data.getItemMetadata&&data.getItemMetadata(row);metadata=metadata&&metadata.columns;var d=getDataItem(row);for(var i=0,ii=columns.length;i<ii;i++){if(columnPosLeft[i]>range.rightPx){break;}
if((colspan=cacheEntry.cellColSpans[i])!=null){i+=(colspan>1?colspan-1:0);continue;}
colspan=1;if(metadata){var columnData=metadata[columns[i].id]||metadata[i];colspan=(columnData&&columnData.colspan)||1;if(colspan==="*"){colspan=ii-i;}}
if(columnPosRight[Math.min(ii-1,i+colspan-1)]>range.leftPx){appendCellHtml(stringArray,row,i,colspan,d);cellsAdded++;}
i+=(colspan>1?colspan-1:0);}
if(cellsAdded){totalCellsAdded+=cellsAdded;processedRows.push(row);}}
if(!stringArray.length){return;}
var x=document.createElement("div");x.innerHTML=stringArray.join("");var processedRow;var node;while((processedRow=processedRows.pop())!=null){cacheEntry=rowsCache[processedRow];var columnIdx;while((columnIdx=cacheEntry.cellRenderQueue.pop())!=null){node=x.lastChild;cacheEntry.rowNode.appendChild(node);cacheEntry.cellNodesByColumnIdx[columnIdx]=node;}}}
function renderRows(range){var parentNode=$canvas[0],stringArray=[],rows=[],needToReselectCell=false,dataLength=getDataLength();for(var i=range.top,ii=range.bottom;i<=ii;i++){if(rowsCache[i]){continue;}
renderedRows++;rows.push(i);
rowsCache[i]={"rowNode":null,"cellColSpans":[],"cellNodesByColumnIdx":[],

"cellRenderQueue":[]};appendRowHtml(stringArray,i,range,dataLength);if(activeCellNode&&activeRow===i){needToReselectCell=true;}
counter_rows_rendered++;}
if(!rows.length){return;}
var x=document.createElement("div");x.innerHTML=stringArray.join("");for(var i=0,ii=rows.length;i<ii;i++){rowsCache[rows[i]].rowNode=parentNode.appendChild(x.firstChild);}
if(needToReselectCell){activeCellNode=getCellNode(activeRow,activeCell);}}
function startPostProcessing(){if(!options.enableAsyncPostRender){return;}
clearTimeout(h_postrender);h_postrender=setTimeout(asyncPostProcessRows,options.asyncPostRenderDelay);}
function invalidatePostProcessingResults(row){delete postProcessedRows[row];postProcessFromRow=Math.min(postProcessFromRow,row);postProcessToRow=Math.max(postProcessToRow,row);startPostProcessing();}
function updateRowPositions(){for(var row in rowsCache){rowsCache[row].rowNode.style.top=getRowTop(row)+"px";}}
function render(){if(!initialized){return;}
var visible=getVisibleRange();var rendered=getRenderedRange(); cleanupRows(rendered); if(lastRenderedScrollLeft!=scrollLeft){cleanUpAndRenderCells(rendered);} 
renderRows(rendered);postProcessFromRow=visible.top;postProcessToRow=Math.min(options.enableAddRow?getDataLength():getDataLength()-1,visible.bottom);startPostProcessing();lastRenderedScrollTop=scrollTop;lastRenderedScrollLeft=scrollLeft;h_render=null;}
function handleHeaderRowScroll(){var scrollLeft=$headerRowScroller[0].scrollLeft;if(scrollLeft!=$viewport[0].scrollLeft){$viewport[0].scrollLeft=scrollLeft;}}
function handleScroll(){scrollTop=$viewport[0].scrollTop;scrollLeft=$viewport[0].scrollLeft;var vScrollDist=Math.abs(scrollTop-prevScrollTop);var hScrollDist=Math.abs(scrollLeft-prevScrollLeft);if(hScrollDist){prevScrollLeft=scrollLeft;$headerScroller[0].scrollLeft=scrollLeft;$topPanelScroller[0].scrollLeft=scrollLeft;$headerRowScroller[0].scrollLeft=scrollLeft;}
if(vScrollDist){vScrollDir=prevScrollTop<scrollTop?1:-1;prevScrollTop=scrollTop; if(vScrollDist<viewportH){scrollTo(scrollTop+offset);}else{var oldOffset=offset;if(h==viewportH){page=0;}else{page=Math.min(n-1,Math.floor(scrollTop*((th-viewportH)/(h-viewportH))*(1/ph)));}
offset=Math.round(page*cj);if(oldOffset!=offset){invalidateAllRows();}}}
if(hScrollDist||vScrollDist){if(h_render){clearTimeout(h_render);}
if(Math.abs(lastRenderedScrollTop-scrollTop)>20||Math.abs(lastRenderedScrollLeft-scrollLeft)>20){if(options.forceSyncScrolling||(Math.abs(lastRenderedScrollTop-scrollTop)<viewportH&&Math.abs(lastRenderedScrollLeft-scrollLeft)<viewportW)){render();}else{h_render=setTimeout(render,50);}
trigger(self.onViewportChanged,{});}}
trigger(self.onScroll,{scrollLeft:scrollLeft,scrollTop:scrollTop});}
function asyncPostProcessRows(){while(postProcessFromRow<=postProcessToRow){var row=(vScrollDir>=0)?postProcessFromRow++:postProcessToRow--;var cacheEntry=rowsCache[row];if(!cacheEntry||row>=getDataLength()){continue;}
if(!postProcessedRows[row]){postProcessedRows[row]={};}
ensureCellNodesInRowsCache(row);for(var columnIdx in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)){continue;}
columnIdx=columnIdx|0;var m=columns[columnIdx];if(m.asyncPostRender&&!postProcessedRows[row][columnIdx]){var node=cacheEntry.cellNodesByColumnIdx[columnIdx];if(node){m.asyncPostRender(node,row,getDataItem(row),m);}
postProcessedRows[row][columnIdx]=true;}}
h_postrender=setTimeout(asyncPostProcessRows,options.asyncPostRenderDelay);return;}}
function updateCellCssStylesOnRenderedRows(addedHash,removedHash){var node,columnId,addedRowHash,removedRowHash;for(var row in rowsCache){removedRowHash=removedHash&&removedHash[row];addedRowHash=addedHash&&addedHash[row];if(removedRowHash){for(columnId in removedRowHash){if(!addedRowHash||removedRowHash[columnId]!=addedRowHash[columnId]){node=getCellNode(row,getColumnIndex(columnId));if(node){$(node).removeClass(removedRowHash[columnId]);}}}}
if(addedRowHash){for(columnId in addedRowHash){if(!removedRowHash||removedRowHash[columnId]!=addedRowHash[columnId]){node=getCellNode(row,getColumnIndex(columnId));if(node){$(node).addClass(addedRowHash[columnId]);}}}}}}
function addCellCssStyles(key,hash){if(cellCssClasses[key]){throw"addCellCssStyles: cell CSS hash with key '"+key+"' already exists.";}
cellCssClasses[key]=hash;updateCellCssStylesOnRenderedRows(hash,null);trigger(self.onCellCssStylesChanged,{"key":key,"hash":hash});}
function removeCellCssStyles(key){if(!cellCssClasses[key]){return;}
updateCellCssStylesOnRenderedRows(null,cellCssClasses[key]);delete cellCssClasses[key];trigger(self.onCellCssStylesChanged,{"key":key,"hash":null});}
function setCellCssStyles(key,hash){var prevHash=cellCssClasses[key];cellCssClasses[key]=hash;updateCellCssStylesOnRenderedRows(hash,prevHash);trigger(self.onCellCssStylesChanged,{"key":key,"hash":hash});}
function getCellCssStyles(key){return cellCssClasses[key];}
function flashCell(row,cell,speed){speed=speed||100;if(rowsCache[row]){var $cell=$(getCellNode(row,cell));function toggleCellClass(times){if(!times){return;}
setTimeout(function(){$cell.queue(function(){$cell.toggleClass(options.cellFlashingCssClass).dequeue();toggleCellClass(times-1);});},speed);}
toggleCellClass(4);}} 
function handleDragInit(e,dd){var cell=getCellFromEvent(e);if(!cell||!cellExists(cell.row,cell.cell)){return false;}
var retval=trigger(self.onDragInit,dd,e);if(e.isImmediatePropagationStopped()){return retval;} 
return false;}
function handleDragStart(e,dd){var cell=getCellFromEvent(e);if(!cell||!cellExists(cell.row,cell.cell)){return false;}
var retval=trigger(self.onDragStart,dd,e);if(e.isImmediatePropagationStopped()){return retval;}
return false;}
function handleDrag(e,dd){return trigger(self.onDrag,dd,e);}
function handleDragEnd(e,dd){trigger(self.onDragEnd,dd,e);}
function handleKeyDown(e){trigger(self.onKeyDown,{row:activeRow,cell:activeCell},e);var handled=e.isImmediatePropagationStopped();if(!handled){if(!e.shiftKey&&!e.altKey&&!e.ctrlKey){if(e.which==27){if(!getEditorLock().isActive()){return; }
cancelEditAndSetFocus();}else if(e.which==37){handled=navigateLeft();}else if(e.which==39){handled=navigateRight();}else if(e.which==38){handled=navigateUp();}else if(e.which==40){handled=navigateDown();}else if(e.which==9){handled=navigateNext();}else if(e.which==13){if(options.editable){if(currentEditor){ if(activeRow===getDataLength()){navigateDown();}else{commitEditAndSetFocus();}}else{if(getEditorLock().commitCurrentEdit()){makeActiveCellEditable();}}}
handled=true;}}else if(e.which==9&&e.shiftKey&&!e.ctrlKey&&!e.altKey){handled=navigatePrev();}}
if(handled){ e.stopPropagation();e.preventDefault();try{e.originalEvent.keyCode=0;}
catch(error){}}}
function handleClick(e){if(!currentEditor){ if(e.target!=document.activeElement){setFocus();}}
var cell=getCellFromEvent(e);if(!cell||(currentEditor!==null&&activeRow==cell.row&&activeCell==cell.cell)){return;}
trigger(self.onClick,{row:cell.row,cell:cell.cell},e);if(e.isImmediatePropagationStopped()){return;}
if((activeCell!=cell.cell||activeRow!=cell.row)&&canCellBeActive(cell.row,cell.cell)){if(!getEditorLock().isActive()||getEditorLock().commitCurrentEdit()){scrollRowIntoView(cell.row,false);setActiveCellInternal(getCellNode(cell.row,cell.cell),(cell.row===getDataLength())||options.autoEdit);}}}
function handleContextMenu(e){var $cell=$(e.target).closest(".slick-cell",$canvas);if($cell.length===0){return;}
if(activeCellNode===$cell[0]&&currentEditor!==null){return;}
trigger(self.onContextMenu,{},e);}
function handleDblClick(e){var cell=getCellFromEvent(e);if(!cell||(currentEditor!==null&&activeRow==cell.row&&activeCell==cell.cell)){return;}
trigger(self.onDblClick,{row:cell.row,cell:cell.cell},e);if(e.isImmediatePropagationStopped()){return;}
if(options.editable){gotoCell(cell.row,cell.cell,true);}}
function handleHeaderMouseEnter(e){trigger(self.onHeaderMouseEnter,{"column":$(this).data("column")},e);}
function handleHeaderMouseLeave(e){trigger(self.onHeaderMouseLeave,{"column":$(this).data("column")},e);}
function handleHeaderContextMenu(e){var $header=$(e.target).closest(".slick-header-column",".slick-header-columns");var column=$header&&$header.data("column");trigger(self.onHeaderContextMenu,{column:column},e);}
function handleHeaderClick(e){var $header=$(e.target).closest(".slick-header-column",".slick-header-columns");var column=$header&&$header.data("column");if(column){trigger(self.onHeaderClick,{column:column},e);}}
function handleMouseEnter(e){trigger(self.onMouseEnter,{},e);}
function handleMouseLeave(e){trigger(self.onMouseLeave,{},e);}
function cellExists(row,cell){return!(row<0||row>=getDataLength()||cell<0||cell>=columns.length);}
function getCellFromPoint(x,y){var row=getRowFromPosition(y);var cell=0;var w=0;for(var i=0;i<columns.length&&w<x;i++){w+=columns[i].width;cell++;}
if(cell<0){cell=0;}
return{row:row,cell:cell-1};}
function getCellFromNode(cellNode){ var cls=/l\d+/.exec(cellNode.className);if(!cls){throw"getCellFromNode: cannot get cell - "+cellNode.className;}
return parseInt(cls[0].substr(1,cls[0].length-1),10);}
function getRowFromNode(rowNode){for(var row in rowsCache){if(rowsCache[row].rowNode===rowNode){return row|0;}}
return null;}
function getCellFromEvent(e){var $cell=$(e.target).closest(".slick-cell",$canvas);if(!$cell.length){return null;}
var row=getRowFromNode($cell[0].parentNode);var cell=getCellFromNode($cell[0]);if(row==null||cell==null){return null;}else{return{"row":row,"cell":cell};}}
function getCellNodeBox(row,cell){if(!cellExists(row,cell)){return null;}
var y1=getRowTop(row);var y2=y1+options.rowHeight-1;var x1=0;for(var i=0;i<cell;i++){x1+=columns[i].width;}
var x2=x1+columns[cell].width;return{top:y1,left:x1,bottom:y2,right:x2};} 
function resetActiveCell(){setActiveCellInternal(null,false);}
function setFocus(){if(tabbingDirection==-1){$focusSink[0].focus();}else{$focusSink2[0].focus();}}
function scrollCellIntoView(row,cell,doPaging){scrollRowIntoView(row,doPaging);var colspan=getColspan(row,cell);var left=columnPosLeft[cell],right=columnPosRight[cell+(colspan>1?colspan-1:0)],scrollRight=scrollLeft+viewportW;if(left<scrollLeft){$viewport.scrollLeft(left);handleScroll();render();}else if(right>scrollRight){$viewport.scrollLeft(Math.min(left,right-$viewport[0].clientWidth));handleScroll();render();}}
function setActiveCellInternal(newCell,editMode){if(activeCellNode!==null){makeActiveCellNormal();$(activeCellNode).removeClass("active");if(rowsCache[activeRow]){$(rowsCache[activeRow].rowNode).removeClass("active");}}
var activeCellChanged=(activeCellNode!==newCell);activeCellNode=newCell;if(activeCellNode!=null){activeRow=getRowFromNode(activeCellNode.parentNode);activeCell=activePosX=getCellFromNode(activeCellNode);$(activeCellNode).addClass("active");$(rowsCache[activeRow].rowNode).addClass("active");if(options.editable&&editMode&&isCellPotentiallyEditable(activeRow,activeCell)){clearTimeout(h_editorLoader);if(options.asyncEditorLoading){h_editorLoader=setTimeout(function(){makeActiveCellEditable();},options.asyncEditorLoadDelay);}else{makeActiveCellEditable();}}}else{activeRow=activeCell=null;}
if(activeCellChanged){trigger(self.onActiveCellChanged,getActiveCell());}}
function clearTextSelection(){if(document.selection&&document.selection.empty){try{ document.selection.empty();}catch(e){}}else if(window.getSelection){var sel=window.getSelection();if(sel&&sel.removeAllRanges){sel.removeAllRanges();}}}
function isCellPotentiallyEditable(row,cell){if(row<getDataLength()&&!getDataItem(row)){return false;}
if(columns[cell].cannotTriggerInsert&&row>=getDataLength()){return false;}
if(!getEditor(row,cell)){return false;}
return true;}
function makeActiveCellNormal(){if(!currentEditor){return;}
trigger(self.onBeforeCellEditorDestroy,{editor:currentEditor});currentEditor.destroy();currentEditor=null;if(activeCellNode){var d=getDataItem(activeRow);$(activeCellNode).removeClass("editable invalid");if(d){var column=columns[activeCell];var formatter=getFormatter(activeRow,column);activeCellNode.innerHTML=formatter(activeRow,activeCell,getDataItemValueForColumn(d,column),column,d);invalidatePostProcessingResults(activeRow);}} 
if(navigator.userAgent.toLowerCase().match(/msie/)){clearTextSelection();}
getEditorLock().deactivate(editController);}
function makeActiveCellEditable(editor){if(!activeCellNode){return;}
if(!options.editable){throw"Grid : makeActiveCellEditable : should never get called when options.editable is false";} 
clearTimeout(h_editorLoader);if(!isCellPotentiallyEditable(activeRow,activeCell)){return;}
var columnDef=columns[activeCell];var item=getDataItem(activeRow);if(trigger(self.onBeforeEditCell,{row:activeRow,cell:activeCell,item:item,column:columnDef})===false){setFocus();return;}
getEditorLock().activate(editController);$(activeCellNode).addClass("editable"); if(!editor){activeCellNode.innerHTML="";}
currentEditor=new(editor||getEditor(activeRow,activeCell))({grid:self,gridPosition:absBox($container[0]),position:absBox(activeCellNode),container:activeCellNode,column:columnDef,item:item||{},commitChanges:commitEditAndSetFocus,cancelChanges:cancelEditAndSetFocus});if(item){currentEditor.loadValue(item);}
serializedEditorValue=currentEditor.serializeValue();if(currentEditor.position){handleActiveCellPositionChange();}}
function commitEditAndSetFocus(){
 if(getEditorLock().commitCurrentEdit()){setFocus();if(options.autoEdit){navigateDown();}}}
function cancelEditAndSetFocus(){if(getEditorLock().cancelCurrentEdit()){setFocus();}}
function absBox(elem){var box={top:elem.offsetTop,left:elem.offsetLeft,bottom:0,right:0,width:$(elem).outerWidth(),height:$(elem).outerHeight(),visible:true};box.bottom=box.top+box.height;box.right=box.left+box.width; var offsetParent=elem.offsetParent;while((elem=elem.parentNode)!=document.body){if(box.visible&&elem.scrollHeight!=elem.offsetHeight&&$(elem).css("overflowY")!="visible"){box.visible=box.bottom>elem.scrollTop&&box.top<elem.scrollTop+elem.clientHeight;}
if(box.visible&&elem.scrollWidth!=elem.offsetWidth&&$(elem).css("overflowX")!="visible"){box.visible=box.right>elem.scrollLeft&&box.left<elem.scrollLeft+elem.clientWidth;}
box.left-=elem.scrollLeft;box.top-=elem.scrollTop;if(elem===offsetParent){box.left+=elem.offsetLeft;box.top+=elem.offsetTop;offsetParent=elem.offsetParent;}
box.bottom=box.top+box.height;box.right=box.left+box.width;}
return box;}
function getActiveCellPosition(){return absBox(activeCellNode);}
function getGridPosition(){return absBox($container[0])}
function handleActiveCellPositionChange(){if(!activeCellNode){return;}
trigger(self.onActiveCellPositionChanged,{});if(currentEditor){var cellBox=getActiveCellPosition();if(currentEditor.show&&currentEditor.hide){if(!cellBox.visible){currentEditor.hide();}else{currentEditor.show();}}
if(currentEditor.position){currentEditor.position(cellBox);}}}
function getCellEditor(){return currentEditor;}
function getActiveCell(){if(!activeCellNode){return null;}else{return{row:activeRow,cell:activeCell};}}
function getActiveCellNode(){return activeCellNode;}
function scrollRowIntoView(row,doPaging){var rowAtTop=row*options.rowHeight;var rowAtBottom=(row+1)*options.rowHeight-viewportH+(viewportHasHScroll?scrollbarDimensions.height:0);if((row+1)*options.rowHeight>scrollTop+viewportH+offset){scrollTo(doPaging?rowAtTop:rowAtBottom);render();}
else if(row*options.rowHeight<scrollTop+offset){scrollTo(doPaging?rowAtBottom:rowAtTop);render();}}
function scrollRowToTop(row){scrollTo(row*options.rowHeight);render();}
function getColspan(row,cell){var metadata=data.getItemMetadata&&data.getItemMetadata(row);if(!metadata||!metadata.columns){return 1;}
var columnData=metadata.columns[columns[cell].id]||metadata.columns[cell];var colspan=(columnData&&columnData.colspan);if(colspan==="*"){colspan=columns.length-cell;}else{colspan=colspan||1;}
return colspan;}
function findFirstFocusableCell(row){var cell=0;while(cell<columns.length){if(canCellBeActive(row,cell)){return cell;}
cell+=getColspan(row,cell);}
return null;}
function findLastFocusableCell(row){var cell=0;var lastFocusableCell=null;while(cell<columns.length){if(canCellBeActive(row,cell)){lastFocusableCell=cell;}
cell+=getColspan(row,cell);}
return lastFocusableCell;}
function gotoRight(row,cell,posX){if(cell>=columns.length){return null;}
do{cell+=getColspan(row,cell);}
while(cell<columns.length&&!canCellBeActive(row,cell));if(cell<columns.length){return{"row":row,"cell":cell,"posX":cell};}
return null;}
function gotoLeft(row,cell,posX){if(cell<=0){return null;}
var firstFocusableCell=findFirstFocusableCell(row);if(firstFocusableCell===null||firstFocusableCell>=cell){return null;}
var prev={"row":row,"cell":firstFocusableCell,"posX":firstFocusableCell};var pos;while(true){pos=gotoRight(prev.row,prev.cell,prev.posX);if(!pos){return null;}
if(pos.cell>=cell){return prev;}
prev=pos;}}
function gotoDown(row,cell,posX){var prevCell;while(true){if(++row>=getDataLength()+(options.enableAddRow?1:0)){return null;}
prevCell=cell=0;while(cell<=posX){prevCell=cell;cell+=getColspan(row,cell);}
if(canCellBeActive(row,prevCell)){return{"row":row,"cell":prevCell,"posX":posX};}}}
function gotoUp(row,cell,posX){var prevCell;while(true){if(--row<0){return null;}
prevCell=cell=0;while(cell<=posX){prevCell=cell;cell+=getColspan(row,cell);}
if(canCellBeActive(row,prevCell)){return{"row":row,"cell":prevCell,"posX":posX};}}}
function gotoNext(row,cell,posX){if(row==null&&cell==null){row=cell=posX=0;if(canCellBeActive(row,cell)){return{"row":row,"cell":cell,"posX":cell};}}
var pos=gotoRight(row,cell,posX);if(pos){return pos;}
var firstFocusableCell=null;while(++row<getDataLength()+(options.enableAddRow?1:0)){firstFocusableCell=findFirstFocusableCell(row);if(firstFocusableCell!==null){return{"row":row,"cell":firstFocusableCell,"posX":firstFocusableCell};}}
return null;}
function gotoPrev(row,cell,posX){if(row==null&&cell==null){row=getDataLength()+(options.enableAddRow?1:0)-1;cell=posX=columns.length-1;if(canCellBeActive(row,cell)){return{"row":row,"cell":cell,"posX":cell};}}
var pos;var lastSelectableCell;while(!pos){pos=gotoLeft(row,cell,posX);if(pos){break;}
if(--row<0){return null;}
cell=0;lastSelectableCell=findLastFocusableCell(row);if(lastSelectableCell!==null){pos={"row":row,"cell":lastSelectableCell,"posX":lastSelectableCell};}}
return pos;}
function navigateRight(){return navigate("right");}
function navigateLeft(){return navigate("left");}
function navigateDown(){return navigate("down");}
function navigateUp(){return navigate("up");}
function navigateNext(){return navigate("next");}
function navigatePrev(){return navigate("prev");}
function navigate(dir){if(!options.enableCellNavigation){return false;}
if(!activeCellNode&&dir!="prev"&&dir!="next"){return false;}
if(!getEditorLock().commitCurrentEdit()){return true;}
setFocus();var tabbingDirections={"up":-1,"down":1,"left":-1,"right":1,"prev":-1,"next":1};tabbingDirection=tabbingDirections[dir];var stepFunctions={"up":gotoUp,"down":gotoDown,"left":gotoLeft,"right":gotoRight,"prev":gotoPrev,"next":gotoNext};var stepFn=stepFunctions[dir];var pos=stepFn(activeRow,activeCell,activePosX);if(pos){var isAddNewRow=(pos.row==getDataLength());scrollCellIntoView(pos.row,pos.cell,!isAddNewRow);setActiveCellInternal(getCellNode(pos.row,pos.cell),isAddNewRow||options.autoEdit);activePosX=pos.posX;return true;}else{setActiveCellInternal(getCellNode(activeRow,activeCell),(activeRow==getDataLength())||options.autoEdit);return false;}}
function getCellNode(row,cell){if(rowsCache[row]){ensureCellNodesInRowsCache(row);return rowsCache[row].cellNodesByColumnIdx[cell];}
return null;}
function setActiveCell(row,cell){if(!initialized){return;}
if(row>getDataLength()||row<0||cell>=columns.length||cell<0){return;}
if(!options.enableCellNavigation){return;}
scrollCellIntoView(row,cell,false);setActiveCellInternal(getCellNode(row,cell),false);}
function canCellBeActive(row,cell){if(!options.enableCellNavigation||row>=getDataLength()+(options.enableAddRow?1:0)||row<0||cell>=columns.length||cell<0){return false;}
var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);if(rowMetadata&&typeof rowMetadata.focusable==="boolean"){return rowMetadata.focusable;}
var columnMetadata=rowMetadata&&rowMetadata.columns;if(columnMetadata&&columnMetadata[columns[cell].id]&&typeof columnMetadata[columns[cell].id].focusable==="boolean"){return columnMetadata[columns[cell].id].focusable;}
if(columnMetadata&&columnMetadata[cell]&&typeof columnMetadata[cell].focusable==="boolean"){return columnMetadata[cell].focusable;}
return columns[cell].focusable;}
function canCellBeSelected(row,cell){if(row>=getDataLength()||row<0||cell>=columns.length||cell<0){return false;}
var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);if(rowMetadata&&typeof rowMetadata.selectable==="boolean"){return rowMetadata.selectable;}
var columnMetadata=rowMetadata&&rowMetadata.columns&&(rowMetadata.columns[columns[cell].id]||rowMetadata.columns[cell]);if(columnMetadata&&typeof columnMetadata.selectable==="boolean"){return columnMetadata.selectable;}
return columns[cell].selectable;}
function gotoCell(row,cell,forceEdit){if(!initialized){return;}
if(!canCellBeActive(row,cell)){return;}
if(!getEditorLock().commitCurrentEdit()){return;}
scrollCellIntoView(row,cell,false);var newCell=getCellNode(row,cell); setActiveCellInternal(newCell,forceEdit||(row===getDataLength())||options.autoEdit); if(!currentEditor){setFocus();}} 
function commitCurrentEdit(){var item=getDataItem(activeRow);var column=columns[activeCell];if(currentEditor){if(currentEditor.isValueChanged()){var validationResults=currentEditor.validate();if(validationResults.valid){if(activeRow<getDataLength()){var editCommand={row:activeRow,cell:activeCell,editor:currentEditor,serializedValue:currentEditor.serializeValue(),prevSerializedValue:serializedEditorValue,execute:function(){this.editor.applyValue(item,this.serializedValue);updateRow(this.row);},undo:function(){this.editor.applyValue(item,this.prevSerializedValue);updateRow(this.row);}};if(options.editCommandHandler){makeActiveCellNormal();options.editCommandHandler(item,column,editCommand);}else{editCommand.execute();makeActiveCellNormal();}
trigger(self.onCellChange,{row:activeRow,cell:activeCell,item:item});}else{var newItem={};currentEditor.applyValue(newItem,currentEditor.serializeValue());makeActiveCellNormal();trigger(self.onAddNewRow,{item:newItem,column:column});} 
return!getEditorLock().isActive();}else{$(activeCellNode).removeClass("invalid");$(activeCellNode).width(); $(activeCellNode).addClass("invalid");trigger(self.onValidationError,{editor:currentEditor,cellNode:activeCellNode,validationResults:validationResults,row:activeRow,cell:activeCell,column:column});currentEditor.focus();return false;}}
makeActiveCellNormal();}
return true;}
function cancelCurrentEdit(){makeActiveCellNormal();return true;}
function rowsToRanges(rows){var ranges=[];var lastCell=columns.length-1;for(var i=0;i<rows.length;i++){ranges.push(new Slick.Range(rows[i],0,rows[i],lastCell));}
return ranges;}
function getSelectedRows(){if(!selectionModel){throw"Selection model is not set";}
return selectedRows;}
function setSelectedRows(rows){if(!selectionModel){throw"Selection model is not set";}
selectionModel.setSelectedRanges(rowsToRanges(rows));} 
this.debug=function(){var s="";s+=("\n"+"counter_rows_rendered:  "+counter_rows_rendered);s+=("\n"+"counter_rows_removed:  "+counter_rows_removed);s+=("\n"+"renderedRows:  "+renderedRows);s+=("\n"+"numVisibleRows:  "+numVisibleRows);s+=("\n"+"maxSupportedCssHeight:  "+maxSupportedCssHeight);s+=("\n"+"n(umber of pages):  "+n);s+=("\n"+"(current) page:  "+page);s+=("\n"+"page height (ph):  "+ph);s+=("\n"+"vScrollDir:  "+vScrollDir);alert(s);}; this.eval=function(expr){return eval(expr);}; $.extend(this,{"slickGridVersion":"2.1","onScroll":new Slick.Event(),"onSort":new Slick.Event(),"onHeaderMouseEnter":new Slick.Event(),"onHeaderMouseLeave":new Slick.Event(),"onHeaderContextMenu":new Slick.Event(),"onHeaderClick":new Slick.Event(),"onHeaderCellRendered":new Slick.Event(),"onBeforeHeaderCellDestroy":new Slick.Event(),"onHeaderRowCellRendered":new Slick.Event(),"onBeforeHeaderRowCellDestroy":new Slick.Event(),"onMouseEnter":new Slick.Event(),"onMouseLeave":new Slick.Event(),"onClick":new Slick.Event(),"onDblClick":new Slick.Event(),"onContextMenu":new Slick.Event(),"onKeyDown":new Slick.Event(),"onAddNewRow":new Slick.Event(),"onValidationError":new Slick.Event(),"onViewportChanged":new Slick.Event(),"onColumnsReordered":new Slick.Event(),"onColumnsResized":new Slick.Event(),"onCellChange":new Slick.Event(),"onBeforeEditCell":new Slick.Event(),"onBeforeCellEditorDestroy":new Slick.Event(),"onBeforeDestroy":new Slick.Event(),"onActiveCellChanged":new Slick.Event(),"onActiveCellPositionChanged":new Slick.Event(),"onDragInit":new Slick.Event(),"onDragStart":new Slick.Event(),"onDrag":new Slick.Event(),"onDragEnd":new Slick.Event(),"onSelectedRowsChanged":new Slick.Event(),"onCellCssStylesChanged":new Slick.Event(),"registerPlugin":registerPlugin,"unregisterPlugin":unregisterPlugin,"getColumns":getColumns,"setColumns":setColumns,"getColumnIndex":getColumnIndex,"updateColumnHeader":updateColumnHeader,"setSortColumn":setSortColumn,"setSortColumns":setSortColumns,"getSortColumns":getSortColumns,"autosizeColumns":autosizeColumns,"getOptions":getOptions,"setOptions":setOptions,"getData":getData,"getDataLength":getDataLength,"getDataItem":getDataItem,"setData":setData,"getSelectionModel":getSelectionModel,"setSelectionModel":setSelectionModel,"getSelectedRows":getSelectedRows,"setSelectedRows":setSelectedRows,"getContainerNode":getContainerNode,"render":render,"invalidate":invalidate,"invalidateRow":invalidateRow,"invalidateRows":invalidateRows,"invalidateAllRows":invalidateAllRows,"updateCell":updateCell,"updateRow":updateRow,"getViewport":getVisibleRange,"getRenderedRange":getRenderedRange,"resizeCanvas":resizeCanvas,"updateRowCount":updateRowCount,"scrollRowIntoView":scrollRowIntoView,"scrollRowToTop":scrollRowToTop,"scrollCellIntoView":scrollCellIntoView,"getCanvasNode":getCanvasNode,"focus":setFocus,"getCellFromPoint":getCellFromPoint,"getCellFromEvent":getCellFromEvent,"getActiveCell":getActiveCell,"setActiveCell":setActiveCell,"getActiveCellNode":getActiveCellNode,"getActiveCellPosition":getActiveCellPosition,"resetActiveCell":resetActiveCell,"editActiveCell":makeActiveCellEditable,"getCellEditor":getCellEditor,"getCellNode":getCellNode,"getCellNodeBox":getCellNodeBox,"canCellBeSelected":canCellBeSelected,"canCellBeActive":canCellBeActive,"navigatePrev":navigatePrev,"navigateNext":navigateNext,"navigateUp":navigateUp,"navigateDown":navigateDown,"navigateLeft":navigateLeft,"navigateRight":navigateRight,"gotoCell":gotoCell,"getTopPanel":getTopPanel,"setTopPanelVisibility":setTopPanelVisibility,"setHeaderRowVisibility":setHeaderRowVisibility,"getHeaderRow":getHeaderRow,"getHeaderRowColumn":getHeaderRowColumn,"getGridPosition":getGridPosition,"flashCell":flashCell,"addCellCssStyles":addCellCssStyles,"setCellCssStyles":setCellCssStyles,"removeCellCssStyles":removeCellCssStyles,"getCellCssStyles":getCellCssStyles,"init":finishInitialization,"destroy":destroy,"getEditorLock":getEditorLock,"getEditController":getEditController});init();}}(jQuery));(function($){$.extend(true,window,{Slick:{Data:{DataView:DataView,Aggregators:{Avg:AvgAggregator,Min:MinAggregator,Max:MaxAggregator,Sum:SumAggregator}}}});function DataView(options){var self=this;var defaults={groupItemMetadataProvider:null,inlineFilters:false}; var idProperty="id"; var items=[]; var rows=[]; var idxById={}; var rowsById=null; var filter=null; var updated=null; var suspend=false; var sortAsc=true;var fastSortField;var sortComparer;var refreshHints={};var prevRefreshHints={};var filterArgs;var filteredItems=[];var compiledFilter;var compiledFilterWithCaching;var filterCache=[]; var groupingInfoDefaults={getter:null,formatter:null,comparer:function(a,b){return a.value-b.value;},predefinedValues:[],aggregators:[],aggregateEmpty:false,aggregateCollapsed:false,aggregateChildGroups:false,collapsed:false,displayTotalsRow:true};var groupingInfos=[];var groups=[];var toggledGroupsByLevel=[];var groupingDelimiter=':|:';var pagesize=0;var pagenum=0;var totalRows=0; var onRowCountChanged=new Slick.Event();var onRowsChanged=new Slick.Event();var onPagingInfoChanged=new Slick.Event();options=$.extend(true,{},defaults,options);function beginUpdate(){suspend=true;}
function endUpdate(){suspend=false;refresh();}
function setRefreshHints(hints){refreshHints=hints;}
function setFilterArgs(args){filterArgs=args;}
function updateIdxById(startingIndex){startingIndex=startingIndex||0;var id;for(var i=startingIndex,l=items.length;i<l;i++){id=items[i][idProperty];if(id===undefined){throw"Each data element must implement a unique 'id' property";}
idxById[id]=i;}}
function ensureIdUniqueness(){var id;for(var i=0,l=items.length;i<l;i++){id=items[i][idProperty];if(id===undefined||idxById[id]!==i){throw"Each data element must implement a unique 'id' property";}}}
function getItems(){return items;}
function setItems(data,objectIdProperty){if(objectIdProperty!==undefined){idProperty=objectIdProperty;}
items=filteredItems=data;idxById={};updateIdxById();ensureIdUniqueness();refresh();}
function setPagingOptions(args){if(args.pageSize!=undefined){pagesize=args.pageSize;pagenum=pagesize?Math.min(pagenum,Math.max(0,Math.ceil(totalRows/pagesize)-1)):0;}
if(args.pageNum!=undefined){pagenum=Math.min(args.pageNum,Math.max(0,Math.ceil(totalRows/pagesize)-1));}
onPagingInfoChanged.notify(getPagingInfo(),null,self);refresh();}
function getPagingInfo(){var totalPages=pagesize?Math.max(1,Math.ceil(totalRows/pagesize)):1;return{pageSize:pagesize,pageNum:pagenum,totalRows:totalRows,totalPages:totalPages};}
function sort(comparer,ascending){sortAsc=ascending;sortComparer=comparer;fastSortField=null;if(ascending===false){items.reverse();}
items.sort(comparer);if(ascending===false){items.reverse();}
idxById={};updateIdxById();refresh();}
function fastSort(field,ascending){sortAsc=ascending;fastSortField=field;sortComparer=null;var oldToString=Object.prototype.toString;Object.prototype.toString=(typeof field=="function")?field:function(){return this[field]};
if(ascending===false){items.reverse();}
items.sort();Object.prototype.toString=oldToString;if(ascending===false){items.reverse();}
idxById={};updateIdxById();refresh();}
function reSort(){if(sortComparer){sort(sortComparer,sortAsc);}else if(fastSortField){fastSort(fastSortField,sortAsc);}}
function setFilter(filterFn){filter=filterFn;if(options.inlineFilters){compiledFilter=compileFilter();compiledFilterWithCaching=compileFilterWithCaching();}
refresh();}
function getGrouping(){return groupingInfos;}
function setGrouping(groupingInfo){if(!options.groupItemMetadataProvider){options.groupItemMetadataProvider=new Slick.Data.GroupItemMetadataProvider();}
groups=[];toggledGroupsByLevel=[];groupingInfo=groupingInfo||[];groupingInfos=(groupingInfo instanceof Array)?groupingInfo:[groupingInfo];for(var i=0;i<groupingInfos.length;i++){var gi=groupingInfos[i]=$.extend(true,{},groupingInfoDefaults,groupingInfos[i]);gi.getterIsAFn=typeof gi.getter==="function"; gi.compiledAccumulators=[];var idx=gi.aggregators.length;while(idx--){gi.compiledAccumulators[idx]=compileAccumulatorLoop(gi.aggregators[idx]);}
toggledGroupsByLevel[i]={};}
refresh();}
function groupBy(valueGetter,valueFormatter,sortComparer){if(valueGetter==null){setGrouping([]);return;}
setGrouping({getter:valueGetter,formatter:valueFormatter,comparer:sortComparer});}
function setAggregators(groupAggregators,includeCollapsed){if(!groupingInfos.length){throw new Error("At least one grouping must be specified before calling setAggregators().");}
groupingInfos[0].aggregators=groupAggregators;groupingInfos[0].aggregateCollapsed=includeCollapsed;setGrouping(groupingInfos);}
function getItemByIdx(i){return items[i];}
function getIdxById(id){return idxById[id];}
function ensureRowsByIdCache(){if(!rowsById){rowsById={};for(var i=0,l=rows.length;i<l;i++){rowsById[rows[i][idProperty]]=i;}}}
function getRowById(id){ensureRowsByIdCache();return rowsById[id];}
function getItemById(id){return items[idxById[id]];}
function mapIdsToRows(idArray){var rows=[];ensureRowsByIdCache();for(var i=0;i<idArray.length;i++){var row=rowsById[idArray[i]];if(row!=null){rows[rows.length]=row;}}
return rows;}
function mapRowsToIds(rowArray){var ids=[];for(var i=0;i<rowArray.length;i++){if(rowArray[i]<rows.length){ids[ids.length]=rows[rowArray[i]][idProperty];}}
return ids;}
function updateItem(id,item){if(idxById[id]===undefined||id!==item[idProperty]){throw"Invalid or non-matching id";}
items[idxById[id]]=item;if(!updated){updated={};}
updated[id]=true;refresh();}
function insertItem(insertBefore,item){items.splice(insertBefore,0,item);updateIdxById(insertBefore);refresh();}
function addItem(item){items.push(item);updateIdxById(items.length-1);refresh();}
function deleteItem(id){var idx=idxById[id];if(idx===undefined){throw"Invalid id";}
delete idxById[id];items.splice(idx,1);updateIdxById(idx);refresh();}
function getLength(){return rows.length;}
function getItem(i){return rows[i];}
function getItemMetadata(i){var item=rows[i];if(item===undefined){return null;} 
if(item.__group){return options.groupItemMetadataProvider.getGroupRowMetadata(item);} 
if(item.__groupTotals){return options.groupItemMetadataProvider.getTotalsRowMetadata(item);}
return null;}
function expandCollapseAllGroups(level,collapse){if(level==null){for(var i=0;i<groupingInfos.length;i++){toggledGroupsByLevel[i]={};groupingInfos[i].collapsed=collapse;}}else{toggledGroupsByLevel[level]={};groupingInfos[level].collapsed=collapse;}
refresh();}
function collapseAllGroups(level){expandCollapseAllGroups(level,true);}
function expandAllGroups(level){expandCollapseAllGroups(level,false);}
function expandCollapseGroup(level,groupingKey,collapse){toggledGroupsByLevel[level][groupingKey]=groupingInfos[level].collapsed^collapse;refresh();}
function collapseGroup(varArgs){var args=Array.prototype.slice.call(arguments);var arg0=args[0];if(args.length==1&&arg0.indexOf(groupingDelimiter)!=-1){expandCollapseGroup(arg0.split(groupingDelimiter).length-1,arg0,true);}else{expandCollapseGroup(args.length-1,args.join(groupingDelimiter),true);}}
function expandGroup(varArgs){var args=Array.prototype.slice.call(arguments);var arg0=args[0];if(args.length==1&&arg0.indexOf(groupingDelimiter)!=-1){expandCollapseGroup(arg0.split(groupingDelimiter).length-1,arg0,false);}else{expandCollapseGroup(args.length-1,args.join(groupingDelimiter),false);}}
function getGroups(){return groups;}
function extractGroups(rows,parentGroup){var group;var val;var groups=[];var groupsByVal=[];var r;var level=parentGroup?parentGroup.level+1:0;var gi=groupingInfos[level];for(var i=0,l=gi.predefinedValues.length;i<l;i++){val=gi.predefinedValues[i];group=groupsByVal[val];if(!group){group=new Slick.Group();group.value=val;group.level=level;group.groupingKey=(parentGroup?parentGroup.groupingKey+groupingDelimiter:'')+val;groups[groups.length]=group;groupsByVal[val]=group;}}
for(var i=0,l=rows.length;i<l;i++){r=rows[i];val=gi.getterIsAFn?gi.getter(r):r[gi.getter];group=groupsByVal[val];if(!group){group=new Slick.Group();group.value=val;group.level=level;group.groupingKey=(parentGroup?parentGroup.groupingKey+groupingDelimiter:'')+val;groups[groups.length]=group;groupsByVal[val]=group;}
group.rows[group.count++]=r;}
if(level<groupingInfos.length-1){for(var i=0;i<groups.length;i++){group=groups[i];group.groups=extractGroups(group.rows,group);}}
groups.sort(groupingInfos[level].comparer);return groups;} 
function calculateGroupTotals(group){ var gi=groupingInfos[group.level];var isLeafLevel=(group.level==groupingInfos.length);var totals=new Slick.GroupTotals();var agg,idx=gi.aggregators.length;while(idx--){agg=gi.aggregators[idx];agg.init();gi.compiledAccumulators[idx].call(agg,(!isLeafLevel&&gi.aggregateChildGroups)?group.groups:group.rows);agg.storeResult(totals);}
totals.group=group;group.totals=totals;}
function calculateTotals(groups,level){level=level||0;var gi=groupingInfos[level];var idx=groups.length,g;while(idx--){g=groups[idx];if(g.collapsed&&!gi.aggregateCollapsed){continue;}
if(g.groups){calculateTotals(g.groups,level+1);}
if(gi.aggregators.length&&(gi.aggregateEmpty||g.rows.length||(g.groups&&g.groups.length))){calculateGroupTotals(g);}}}
function finalizeGroups(groups,level){level=level||0;var gi=groupingInfos[level];var groupCollapsed=gi.collapsed;var toggledGroups=toggledGroupsByLevel[level];var idx=groups.length,g;while(idx--){g=groups[idx];g.collapsed=groupCollapsed^toggledGroups[g.groupingKey];g.title=gi.formatter?gi.formatter(g):g.value;if(g.groups){finalizeGroups(g.groups,level+1);g.rows=[];}}}
function flattenGroupedRows(groups,level){level=level||0;var gi=groupingInfos[level];var groupedRows=[],rows,gl=0,g;for(var i=0,l=groups.length;i<l;i++){g=groups[i];groupedRows[gl++]=g;if(!g.collapsed){rows=g.groups?flattenGroupedRows(g.groups,level+1):g.rows;for(var j=0,jj=rows.length;j<jj;j++){groupedRows[gl++]=rows[j];}}
if(g.totals&&gi.displayTotalsRow&&(!g.collapsed||gi.aggregateCollapsed)){groupedRows[gl++]=g.totals;}}
return groupedRows;}
function getFunctionInfo(fn){var fnRegex=/^function[^(]*\(([^)]*)\)\s*{([\s\S]*)}$/;var matches=fn.toString().match(fnRegex);return{params:matches[1].split(","),body:matches[2]};}
function compileAccumulatorLoop(aggregator){var accumulatorInfo=getFunctionInfo(aggregator.accumulate);var fn=new Function("_items","for (var "+accumulatorInfo.params[0]+", _i=0, _il=_items.length; _i<_il; _i++) {"+
accumulatorInfo.params[0]+" = _items[_i]; "+
accumulatorInfo.body+"}");fn.displayName=fn.name="compiledAccumulatorLoop";return fn;}
function compileFilter(){var filterInfo=getFunctionInfo(filter);var filterBody=filterInfo.body.replace(/return false\s*([;}]|$)/gi,"{ continue _coreloop; }$1").replace(/return true\s*([;}]|$)/gi,"{ _retval[_idx++] = $item$; continue _coreloop; }$1").replace(/return ([^;}]+?)\s*([;}]|$)/gi,"{ if ($1) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");  var tpl=["var _retval = [], _idx = 0; ","var $item$, $args$ = _args; ","_coreloop: ","for (var _i = 0, _il = _items.length; _i < _il; _i++) { ","$item$ = _items[_i]; ","$filter$; ","} ","return _retval; "
].join("");tpl=tpl.replace(/\$filter\$/gi,filterBody);tpl=tpl.replace(/\$item\$/gi,filterInfo.params[0]);tpl=tpl.replace(/\$args\$/gi,filterInfo.params[1]);var fn=new Function("_items,_args",tpl);fn.displayName=fn.name="compiledFilter";return fn;}
function compileFilterWithCaching(){var filterInfo=getFunctionInfo(filter);var filterBody=filterInfo.body.replace(/return false\s*([;}]|$)/gi,"{ continue _coreloop; }$1").replace(/return true\s*([;}]|$)/gi,"{ _cache[_i] = true;_retval[_idx++] = $item$; continue _coreloop; }$1").replace(/return ([^;}]+?)\s*([;}]|$)/gi,"{ if ((_cache[_i] = $1)) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");  var tpl=["var _retval = [], _idx = 0; ","var $item$, $args$ = _args; ","_coreloop: ","for (var _i = 0, _il = _items.length; _i < _il; _i++) { ","$item$ = _items[_i]; ","if (_cache[_i]) { ","_retval[_idx++] = $item$; ","continue _coreloop; ","} ","$filter$; ","} ","return _retval; "
].join("");tpl=tpl.replace(/\$filter\$/gi,filterBody);tpl=tpl.replace(/\$item\$/gi,filterInfo.params[0]);tpl=tpl.replace(/\$args\$/gi,filterInfo.params[1]);var fn=new Function("_items,_args,_cache",tpl);fn.displayName=fn.name="compiledFilterWithCaching";return fn;}
function uncompiledFilter(items,args){var retval=[],idx=0;for(var i=0,ii=items.length;i<ii;i++){if(filter(items[i],args)){retval[idx++]=items[i];}}
return retval;}
function uncompiledFilterWithCaching(items,args,cache){var retval=[],idx=0,item;for(var i=0,ii=items.length;i<ii;i++){item=items[i];if(cache[i]){retval[idx++]=item;}else if(filter(item,args)){retval[idx++]=item;cache[i]=true;}}
return retval;}
function getFilteredAndPagedItems(items){if(filter){var batchFilter=options.inlineFilters?compiledFilter:uncompiledFilter;var batchFilterWithCaching=options.inlineFilters?compiledFilterWithCaching:uncompiledFilterWithCaching;if(refreshHints.isFilterNarrowing){filteredItems=batchFilter(filteredItems,filterArgs);}else if(refreshHints.isFilterExpanding){filteredItems=batchFilterWithCaching(items,filterArgs,filterCache);}else if(!refreshHints.isFilterUnchanged){filteredItems=batchFilter(items,filterArgs);}}else{

 filteredItems=pagesize?items:items.concat();} 
var paged;if(pagesize){if(filteredItems.length<pagenum*pagesize){pagenum=Math.floor(filteredItems.length/pagesize);}
paged=filteredItems.slice(pagesize*pagenum,pagesize*pagenum+pagesize);}else{paged=filteredItems;}
return{totalRows:filteredItems.length,rows:paged};}
function getRowDiffs(rows,newRows){var item,r,eitherIsNonData,diff=[];var from=0,to=newRows.length;if(refreshHints&&refreshHints.ignoreDiffsBefore){from=Math.max(0,Math.min(newRows.length,refreshHints.ignoreDiffsBefore));}
if(refreshHints&&refreshHints.ignoreDiffsAfter){to=Math.min(newRows.length,Math.max(0,refreshHints.ignoreDiffsAfter));}
for(var i=from,rl=rows.length;i<to;i++){if(i>=rl){diff[diff.length]=i;}else{item=newRows[i];r=rows[i];if((groupingInfos.length&&(eitherIsNonData=(item.__nonDataRow)||(r.__nonDataRow))&&item.__group!==r.__group||item.__group&&!item.equals(r))||(eitherIsNonData&&

(item.__groupTotals||r.__groupTotals))||item[idProperty]!=r[idProperty]||(updated&&updated[item[idProperty]])){diff[diff.length]=i;}}}
return diff;}
function recalc(_items){rowsById=null;if(refreshHints.isFilterNarrowing!=prevRefreshHints.isFilterNarrowing||refreshHints.isFilterExpanding!=prevRefreshHints.isFilterExpanding){filterCache=[];}
var filteredItems=getFilteredAndPagedItems(_items);totalRows=filteredItems.totalRows;var newRows=filteredItems.rows;groups=[];if(groupingInfos.length){groups=extractGroups(newRows);if(groups.length){calculateTotals(groups);finalizeGroups(groups);newRows=flattenGroupedRows(groups);}}
var diff=getRowDiffs(rows,newRows);rows=newRows;return diff;}
function refresh(){if(suspend){return;}
var countBefore=rows.length;var totalRowsBefore=totalRows;var diff=recalc(items,filter);

 if(pagesize&&totalRows<pagenum*pagesize){pagenum=Math.max(0,Math.ceil(totalRows/pagesize)-1);diff=recalc(items,filter);}
updated=null;prevRefreshHints=refreshHints;refreshHints={};if(totalRowsBefore!=totalRows){onPagingInfoChanged.notify(getPagingInfo(),null,self);}
if(countBefore!=rows.length){onRowCountChanged.notify({previous:countBefore,current:rows.length},null,self);}
if(diff.length>0){onRowsChanged.notify({rows:diff},null,self);}}
function syncGridSelection(grid,preserveHidden){var self=this;var selectedRowIds=self.mapRowsToIds(grid.getSelectedRows());;var inHandler;function update(){if(selectedRowIds.length>0){inHandler=true;var selectedRows=self.mapIdsToRows(selectedRowIds);if(!preserveHidden){selectedRowIds=self.mapRowsToIds(selectedRows);}
grid.setSelectedRows(selectedRows);inHandler=false;}}
grid.onSelectedRowsChanged.subscribe(function(e,args){if(inHandler){return;}
selectedRowIds=self.mapRowsToIds(grid.getSelectedRows());});this.onRowsChanged.subscribe(update);this.onRowCountChanged.subscribe(update);}
function syncGridCellCssStyles(grid,key){var hashById;var inHandler; storeCellCssStyles(grid.getCellCssStyles(key));function storeCellCssStyles(hash){hashById={};for(var row in hash){var id=rows[row][idProperty];hashById[id]=hash[row];}}
function update(){if(hashById){inHandler=true;ensureRowsByIdCache();var newHash={};for(var id in hashById){var row=rowsById[id];if(row!=undefined){newHash[row]=hashById[id];}}
grid.setCellCssStyles(key,newHash);inHandler=false;}}
grid.onCellCssStylesChanged.subscribe(function(e,args){if(inHandler){return;}
if(key!=args.key){return;}
if(args.hash){storeCellCssStyles(args.hash);}});this.onRowsChanged.subscribe(update);this.onRowCountChanged.subscribe(update);}
$.extend(this,{"beginUpdate":beginUpdate,"endUpdate":endUpdate,"setPagingOptions":setPagingOptions,"getPagingInfo":getPagingInfo,"getItems":getItems,"setItems":setItems,"setFilter":setFilter,"sort":sort,"fastSort":fastSort,"reSort":reSort,"setGrouping":setGrouping,"getGrouping":getGrouping,"groupBy":groupBy,"setAggregators":setAggregators,"collapseAllGroups":collapseAllGroups,"expandAllGroups":expandAllGroups,"collapseGroup":collapseGroup,"expandGroup":expandGroup,"getGroups":getGroups,"getIdxById":getIdxById,"getRowById":getRowById,"getItemById":getItemById,"getItemByIdx":getItemByIdx,"mapRowsToIds":mapRowsToIds,"mapIdsToRows":mapIdsToRows,"setRefreshHints":setRefreshHints,"setFilterArgs":setFilterArgs,"refresh":refresh,"updateItem":updateItem,"insertItem":insertItem,"addItem":addItem,"deleteItem":deleteItem,"syncGridSelection":syncGridSelection,"syncGridCellCssStyles":syncGridCellCssStyles,"getLength":getLength,"getItem":getItem,"getItemMetadata":getItemMetadata,"onRowCountChanged":onRowCountChanged,"onRowsChanged":onRowsChanged,"onPagingInfoChanged":onPagingInfoChanged});}
function AvgAggregator(field){this.field_=field;this.init=function(){this.count_=0;this.nonNullCount_=0;this.sum_=0;};this.accumulate=function(item){var val=item[this.field_];this.count_++;if(val!=null&&val!==""&&val!==NaN){this.nonNullCount_++;this.sum_+=parseFloat(val);}};this.storeResult=function(groupTotals){if(!groupTotals.avg){groupTotals.avg={};}
if(this.nonNullCount_!=0){groupTotals.avg[this.field_]=this.sum_/this.nonNullCount_;}};}
function MinAggregator(field){this.field_=field;this.init=function(){this.min_=null;};this.accumulate=function(item){var val=item[this.field_];if(val!=null&&val!==""&&val!==NaN){if(this.min_==null||val<this.min_){this.min_=val;}}};this.storeResult=function(groupTotals){if(!groupTotals.min){groupTotals.min={};}
groupTotals.min[this.field_]=this.min_;}}
function MaxAggregator(field){this.field_=field;this.init=function(){this.max_=null;};this.accumulate=function(item){var val=item[this.field_];if(val!=null&&val!==""&&val!==NaN){if(this.max_==null||val>this.max_){this.max_=val;}}};this.storeResult=function(groupTotals){if(!groupTotals.max){groupTotals.max={};}
groupTotals.max[this.field_]=this.max_;}}
function SumAggregator(field){this.field_=field;this.init=function(){this.sum_=null;};this.accumulate=function(item){var val=item[this.field_];if(val!=null&&val!==""&&val!==NaN){this.sum_+=parseFloat(val);}};this.storeResult=function(groupTotals){if(!groupTotals.sum){groupTotals.sum={};}
groupTotals.sum[this.field_]=this.sum_;}}

})(jQuery);(function($){ $.extend(true,window,{"Slick":{"CheckboxSelectColumn":CheckboxSelectColumn}});function CheckboxSelectColumn(options){var _grid;var _self=this;var _handler=new Slick.EventHandler();var _selectedRowsLookup={};var _defaults={columnId:"_checkbox_selector",cssClass:null,toolTip:"Select/Deselect All",width:30};var _options=$.extend(true,{},_defaults,options);function init(grid){_grid=grid;_handler.subscribe(_grid.onSelectedRowsChanged,handleSelectedRowsChanged).subscribe(_grid.onClick,handleClick).subscribe(_grid.onHeaderClick,handleHeaderClick).subscribe(_grid.onKeyDown,handleKeyDown);}
function destroy(){_handler.unsubscribeAll();}
function handleSelectedRowsChanged(e,args){var selectedRows=_grid.getSelectedRows();var lookup={},row,i;for(i=0;i<selectedRows.length;i++){row=selectedRows[i];lookup[row]=true;if(lookup[row]!==_selectedRowsLookup[row]){_grid.invalidateRow(row);delete _selectedRowsLookup[row];}}
for(i in _selectedRowsLookup){_grid.invalidateRow(i);}
_selectedRowsLookup=lookup;_grid.render();if(selectedRows.length&&selectedRows.length==_grid.getDataLength()){_grid.updateColumnHeader(_options.columnId,"<input type='checkbox' checked='checked'>",_options.toolTip);}else{_grid.updateColumnHeader(_options.columnId,"<input type='checkbox'>",_options.toolTip);}}
function handleKeyDown(e,args){if(e.which==32){if(_grid.getColumns()[args.cell].id===_options.columnId){ if(!_grid.getEditorLock().isActive()||_grid.getEditorLock().commitCurrentEdit()){toggleRowSelection(args.row);}
e.preventDefault();e.stopImmediatePropagation();}}}
function handleClick(e,args){ if(_grid.getColumns()[args.cell].id===_options.columnId&&$(e.target).is(":checkbox")){ if(_grid.getEditorLock().isActive()&&!_grid.getEditorLock().commitCurrentEdit()){e.preventDefault();e.stopImmediatePropagation();return;}
toggleRowSelection(args.row);e.stopPropagation();e.stopImmediatePropagation();}}
function toggleRowSelection(row){if(_selectedRowsLookup[row]){_grid.setSelectedRows($.grep(_grid.getSelectedRows(),function(n){return n!=row}));}else{_grid.setSelectedRows(_grid.getSelectedRows().concat(row));}}
function handleHeaderClick(e,args){if(args.column.id==_options.columnId&&$(e.target).is(":checkbox")){ if(_grid.getEditorLock().isActive()&&!_grid.getEditorLock().commitCurrentEdit()){e.preventDefault();e.stopImmediatePropagation();return;}
if($(e.target).is(":checked")){var rows=[];for(var i=0;i<_grid.getDataLength();i++){rows.push(i);}
_grid.setSelectedRows(rows);}else{_grid.setSelectedRows([]);}
e.stopPropagation();e.stopImmediatePropagation();}}
function getColumnDefinition(){return{id:_options.columnId,name:"<input type='checkbox'>",toolTip:_options.toolTip,field:"sel",width:_options.width,resizable:false,sortable:false,cssClass:_options.cssClass,formatter:checkboxSelectionFormatter};}
function checkboxSelectionFormatter(row,cell,value,columnDef,dataContext){if(dataContext){return _selectedRowsLookup[row]?"<input type='checkbox' checked='checked'>":"<input type='checkbox'>";}
return null;}
$.extend(this,{"init":init,"destroy":destroy,"getColumnDefinition":getColumnDefinition});}})(jQuery);(function($){ $.extend(true,window,{"Slick":{"RowSelectionModel":RowSelectionModel}});function RowSelectionModel(options){var _grid;var _ranges=[];var _self=this;var _handler=new Slick.EventHandler();var _inHandler;var _options;var _defaults={selectActiveRow:true};function init(grid){_options=$.extend(true,{},_defaults,options);_grid=grid;_handler.subscribe(_grid.onActiveCellChanged,wrapHandler(handleActiveCellChange));_handler.subscribe(_grid.onKeyDown,wrapHandler(handleKeyDown));_handler.subscribe(_grid.onClick,wrapHandler(handleClick));}
function destroy(){_handler.unsubscribeAll();}
function wrapHandler(handler){return function(){if(!_inHandler){_inHandler=true;handler.apply(this,arguments);_inHandler=false;}};}
function rangesToRows(ranges){var rows=[];for(var i=0;i<ranges.length;i++){for(var j=ranges[i].fromRow;j<=ranges[i].toRow;j++){rows.push(j);}}
return rows;}
function rowsToRanges(rows){var ranges=[];var lastCell=_grid.getColumns().length-1;for(var i=0;i<rows.length;i++){ranges.push(new Slick.Range(rows[i],0,rows[i],lastCell));}
return ranges;}
function getRowsRange(from,to){var i,rows=[];for(i=from;i<=to;i++){rows.push(i);}
for(i=to;i<from;i++){rows.push(i);}
return rows;}
function getSelectedRows(){return rangesToRows(_ranges);}
function setSelectedRows(rows){setSelectedRanges(rowsToRanges(rows));}
function setSelectedRanges(ranges){_ranges=ranges;_self.onSelectedRangesChanged.notify(_ranges);}
function getSelectedRanges(){return _ranges;}
function handleActiveCellChange(e,data){if(_options.selectActiveRow&&data.row!=null){setSelectedRanges([new Slick.Range(data.row,0,data.row,_grid.getColumns().length-1)]);}}
function handleKeyDown(e){var activeRow=_grid.getActiveCell();if(activeRow&&e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&(e.which==38||e.which==40)){var selectedRows=getSelectedRows();selectedRows.sort(function(x,y){return x-y});if(!selectedRows.length){selectedRows=[activeRow.row];}
var top=selectedRows[0];var bottom=selectedRows[selectedRows.length-1];var active;if(e.which==40){active=activeRow.row<bottom||top==bottom?++bottom:++top;}else{active=activeRow.row<bottom?--bottom:--top;}
if(active>=0&&active<_grid.getDataLength()){_grid.scrollRowIntoView(active);_ranges=rowsToRanges(getRowsRange(top,bottom));setSelectedRanges(_ranges);}
e.preventDefault();e.stopPropagation();}}
function handleClick(e){var cell=_grid.getCellFromEvent(e);if(!cell||!_grid.canCellBeActive(cell.row,cell.cell)){return false;}
var selection=rangesToRows(_ranges);var idx=$.inArray(cell.row,selection);if(!e.ctrlKey&&!e.shiftKey&&!e.metaKey){return false;}
else if(_grid.getOptions().multiSelect){if(idx===-1&&(e.ctrlKey||e.metaKey)){selection.push(cell.row);_grid.setActiveCell(cell.row,cell.cell);}else if(idx!==-1&&(e.ctrlKey||e.metaKey)){selection=$.grep(selection,function(o,i){return(o!==cell.row);});_grid.setActiveCell(cell.row,cell.cell);}else if(selection.length&&e.shiftKey){var last=selection.pop();var from=Math.min(cell.row,last);var to=Math.max(cell.row,last);selection=[];for(var i=from;i<=to;i++){if(i!==last){selection.push(i);}}
selection.push(last);_grid.setActiveCell(cell.row,cell.cell);}}
_ranges=rowsToRanges(selection);setSelectedRanges(_ranges);e.stopImmediatePropagation();return true;}
$.extend(this,{"getSelectedRows":getSelectedRows,"setSelectedRows":setSelectedRows,"getSelectedRanges":getSelectedRanges,"setSelectedRanges":setSelectedRanges,"init":init,"destroy":destroy,"onSelectedRangesChanged":new Slick.Event()});}})(jQuery);(function($){"use strict";var SlickGrid=function(element,options){element=$(element);var cookedOptions=$.extend(true,{},$.fn.slickgrid.defaults,options);this.init('slickgrid',element,cookedOptions);};SlickGrid.prototype={constructor:SlickGrid,init:function(type,element,options){var self=this;this.element=$(element);this.wrapperOptions=$.extend(true,options,{ slickGridOptions:{jQueryUiStyles:false}});this.postInit();},postInit:function(){(this.wrapperOptions.handleCreate||this.handleCreate).apply(this);},handleCreate:function(){





var o=this.wrapperOptions;var grid=new Slick.Grid(this.element,o.data,o.columns,o.slickGridOptions);}};$.fn.slickgrid=function(option){return this.each(function(){var $this=$(this),data=$this.data('slickgrid'),options=typeof option=='object'&&option;if(!data){$this.data('slickgrid',(data=new SlickGrid(this,options)));}
if(typeof option=='string'){data[option]();}});};$.fn.slickgrid.Constructor=SlickGrid;$.fn.slickgrid.defaults={slickGridOptions:{},columns:[],handleCreate:null


};})(window.jQuery);