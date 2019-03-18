// ==UserScript==
// @name         Beauty attachments list
// @namespace    argustelecom.ru
// @version      0.1
// @description
// @author       Andy BitOff
// @include      *support.argustelecom.ru*
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @run-at       document-end
// ==/UserScript==

(function(MutationObserver) {
  'use strict';

  $.fn.outerHTML = function() {
    if ($(this).length > 1)
      return $.map($(this), function(elm){ return $(elm).outerHTML(); }).join('');
    return $(this).clone().wrap('<p/>').parent().html();
  };  

  let $attachContainer;
  const observer = new MutationObserver(mutationCallback);
  observerStart();

  function mutationCallback() {
    observer.disconnect();
    observerStart();
  }

  function observerStart() {
    $attachContainer = $('div#attachmentmodule div.mod-content');
    correctList($attachContainer);
    observer.observe($attachContainer.get(0), {childList: true})
  }

  function correctList($container){
    if (!$('li.aui-list-item a#attachment-view-mode-gallery').hasClass('aui-checked'){
      return;
    }

    const $appItems = $container.find('li.attachment-content:not(li.attachment-content[data-downloadurl^="image/"])');
    if ($appItems.length === 0){
      return;
    }
    const $newAppItemsList = $('<ol id="file_attachments" class="item-attachments" data-sort-key="fileName" data-sort-order="asc"><ol>');
    const $newContainerAppList = $('<div></div>').append($newAppItemsList);
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
    $appItems.remove();
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
            ${$item.outerHTML()}<dd class="zip-contents"><ol><li><div class="attachment-thumb"><img src="/images/icons/wait.gif">
            </div>Извлечение архива ...</li></ol></dd></dl></div><div class="twixi-wrap concise"><a href="#" class="twixi"><span
            class="icon-default aui-icon aui-icon-small aui-iconfont-collapsed"><span>Показать</span></span></a>
            ${$item.outerHTML()}</dl></div></div>`);
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

})(window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver);