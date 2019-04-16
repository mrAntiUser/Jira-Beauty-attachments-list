// ==UserScript==
// @name         Beauty attachments list
// @license      MIT
// @namespace    argustelecom.ru
// @version      1.4
// @description  Beauty attachments list
// @author       Andy BitOff
// @include      *support.argustelecom.ru*
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @run-at       document-start
// ==/UserScript==

/* RELEASE NOTES
  1.4
    В редакторе текста пропадали элементы списка аттачментов. Поправил
  1.3
    Длинные списки (более 20 элементов) сворачиваются
  1.2
    Баг обновления списка
  1.0
    Release
*/

(function(MutationObserver) {
  'use strict';

  let $attachContainer;
  const observer = new MutationObserver(mutationCallback);

  const timId = setInterval(function() {
    if ($('body').length === 0){ return };
    clearInterval(timId);
    new MutationObserver(function(){
      if ($('div#attachmentmodule div.mod-content').length === 0){ return };
      this.disconnect();
      addNewCss();
      observerStart();
    }).observe($('body').get(0), {childList: true});
  }, 100);

  function mutationCallback() {
    observer.disconnect();
    observerStart();
  }

  function observerStart() {
    $attachContainer = $('div#attachmentmodule div.mod-content');
    if ($attachContainer.find('ol#file_attachments_BAL').length === 0){
      correctList($attachContainer);
    }
    observer.observe($attachContainer.get(0), {childList: true})
  }

  function correctList($container){
    if (!$('li.aui-list-item a#attachment-view-mode-gallery').hasClass('aui-checked')){
      return;
    }

    const $appItems = $container.find('li.attachment-content:not(li.attachment-content[data-downloadurl^="image/"])');
    if ($appItems.length === 0){
      return;
    }
    const $newAppItemsList = $('<ol id="file_attachments_BAL" class="item-attachments" data-sort-key="fileName" data-sort-order="asc"><ol>');
    const $newContainerAppList = $('<div></div>');
    if ($appItems.length > 20){
      $newContainerAppList.append($(`<div class="aui-button" style="width: 100%;"><b>
                                     Показаны первые 10</b>. Нажмите чтобы посмотреть все ${$appItems.length}</div>`)
          .click(function(){
            $newAppItemsList.toggleClass('bal-crop-list');
            if ($newAppItemsList.hasClass('bal-crop-list')) {
              $(this).html(`<b>Показаны первые 10</b>. Нажмите чтобы посмотреть все ${$appItems.length}`);
            }else{
              $(this).html(`<b>Показаны все ${$appItems.length}</b>. Нажмите чтобы сократить до 10`);
            }
          }));
      $newAppItemsList.css({'height': '325px'});
      $newAppItemsList.addClass('bal-crop-list');
    };
    $newContainerAppList.append($newAppItemsList);
    $newContainerAppList.css({'display': 'inline-block', 'width': '100%'});

    $appItems.each(function(){
      const $elm = $(this);
      const downloadUrl = $elm.attr('data-downloadurl');
      if (downloadUrl === undefined){return}
      const $hrefAelm = $elm.find('dl dt a.attachment-title');
      const $attachDateElm = $elm.find('dl dd.attachment-date time');
      const $deleteAttach = $elm.find('dl div.attachment-delete');
      const $earlierVersion = $elm.find('dl.earlier-version');

      const newListItemData = `
          <div class="attachment-thumb"><a href="${$hrefAelm.attr('href')}" draggable="true" data-downloadurl="${downloadUrl}">
          <span class="aui-icon aui-icon-small attachment-icon"></span></a></div><dl class="${($earlierVersion.length !== 0) ? 'earlier-version' : ''}">
          <dt class="attachment-title"><a href="${$hrefAelm.attr('href')}" draggable="true" data-downloadurl="${downloadUrl}">
          ${$hrefAelm.text()}</a></dt><dd class="attachment-delete">${($deleteAttach.length !== 0) ? $deleteAttach.html() : ''}</dd>
          <dd class="attachment-date"><time datetime="${$attachDateElm.attr('datetime')}">${$attachDateElm.text()}</time></dd>
          <dd class="attachment-size">${$elm.find('dl dd.attachment-size').text()}</dd><dd class="attachment-author">
          ${$elm.find('dl dd.attachment-author').text()}</dd>`;

      let $newItem = $(`<li class="attachment-content js-file-attachment" data-attachment-id="${/attachment\/(\d+)\//gmi.exec(downloadUrl)[1]}"
                        data-issue-id="${$elm.attr('data-issue-id')}" data-attachment-type="expandable" resolved=""></li>`);

      switch(/^\w+\/([\w\-\.]+):/gmi.exec($elm.attr('data-downloadurl'))[1]) {
        case 'zip':
          $newItem.append(makeZipItem($elm, newListItemData));
          break;
        case 'x-msdownload':
          $newItem.append(makeExeItem($elm, newListItemData));
          break;
        default:
          $newItem.append(makeDefItem($elm, newListItemData));
      }

      $newAppItemsList.append($newItem);
    });

    $container.append($newContainerAppList);
    $appItems.css('display', 'none');
  }

  function makeDefItem($elm, itemData){
    return setIcon($elm, itemData);
  }

  function makeExeItem($elm, itemData){
    return makeDefItem($elm, itemData);
  }

  function makeZipItem($elm, itemData){
    const $item = setIcon($elm, itemData);
    return $(`<div class="twixi-block collapsed expander"><div class="twixi-wrap verbose"><a href="#" class="twixi"><span
            class="icon-default aui-icon aui-icon-small aui-iconfont-expanded"><span>Скрыть</span></span></a>
            ${outerHTML($item)}<dd class="zip-contents"><ol><li><div class="attachment-thumb"><img src="/images/icons/wait.gif">
            </div>Извлечение архива ...</li></ol></dd></dl></div><div class="twixi-wrap concise"><a href="#" class="twixi"><span
            class="icon-default aui-icon aui-icon-small aui-iconfont-collapsed"><span>Показать</span></span></a>
            ${outerHTML($item)}</dl></div></div>`);
  }

  function outerHTML($elms) {
    if ($elms.length > 1)
      return $.map($elms, function(elm){ return outerHTML($(elm)); }).join('');
    return $elms.clone().wrap('<p/>').parent().html();
  }

  function setIcon($elm, itemData){
    const $itemData = $(itemData);
    $elm.find('span.aui-icon.attachment-thumbnail-icon').each(function(){
      try {
        $itemData.find('span.aui-icon.aui-icon-small.attachment-icon').addClass(
            $(this).attr('class').split(' ').filter(function(a){return a.match(/^aui-iconfont/)})[0]);
      } catch (err) {}
    });
    return $itemData;
  }

  function newCssClass(cssClass){
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(cssClass));
    head.appendChild(style);
  }

  function addNewCss(){
    newCssClass(`
      .bal-crop-list{
        overflow-y: scroll;
      }
    `)
  }

})(window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver);