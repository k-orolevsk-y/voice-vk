// ==UserScript==
// @name         Voice VK
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Script for viewing the text of voice messages on VK.COM
// @author       Korolevsky Kirill
// @homepage     https://korolevsky.me/
// @match        *://*.vk.com/*
// @resource     dekstopApi https://ssapi.ru/VKDesktopAPI.js
// @grant        GM_getResourceText
// ==/UserScript==

function Inj() {
    const Logs = false;


    function checkMessages(el) {
        var messages = el.querySelectorAll('.im-mess');
        if (!messages) return;

        Array.from(messages).map(function (message) {
            if (message.checked) return;

            var find = message.getElementsByClassName('im_msg_media_audiomsg');
            if(find.length == 0) return;

            checkMessage(message);
            message.checked = 1;
        });
    }

    function setText(element, transcript) {
        const find = document.getElementById(`audio-text-message-${element.getAttribute('data-msgid').toString()}`);
        if(typeof(find) != "undefined" && find !== null) return;

        var text = document.createElement("span");
        text.setAttribute("id", `audio-text-message-${element.getAttribute('data-msgid').toString()}`);
        text.style = "color: rgba(127,127,127,1.0)";

        if(transcript == "" || transcript == null) text.innerHTML = 'В голосовом сообщении слова не найдены.';
        else text.innerHTML = '<span style="color: black">Сказал(-а):</span> ' + transcript;

        var injectElement = element.getElementsByClassName('im-mess--text');
        injectElement[0].prepend(text);
        return transcript;
    }

    function checkMessage(msg) {
        if(Logs) console.log(`📍 Начинаю распознование голсового сообщения с ID ${msg.getAttribute('data-msgid')}`);
        let interval = setInterval(() => {
           API("messages.getById", { message_ids: msg.getAttribute('data-msgid') })
               .then((r) => {
               if(r.response.items[0] == undefined) return r;
               else if(r.response.items[0].attachments[0] == undefined) return r;

               r = r.response.items[0].attachments[0].audio_message.transcript;
               clearInterval(interval);
               if(Logs) console.log(`😇 Сообщение ${msg.getAttribute('data-msgid')} успешно распознано!`);

               setText(msg, r);
               return r;
           }).catch((e) => {
               if(Logs) {
                   console.log(`😱 При распозновании сообщения ${msg.getAttribute('data-msgid')} произошла ошибка.\n\nЗапускаю через 1500ms новое распознование текста..`);
                   console.error(e);
               }
           });
        }, 1500);
    }

    var observer = new MutationObserver(async function (mutations) {
        mutations.forEach(async function (mutation) {
            if (mutation.target.nodeType !== 1) return;
            checkMessages(mutation.target);
        });
    });

    window.addEventListener("load", function () {
        checkMessages(document.body);

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

(function injectScript() {
    var script = document.createElement('script');
    var code = '(' + Inj + ')();';
    code += '(function(){' + (GM_getResourceText('dekstopApi')) + '})();';
    script.appendChild(document.createTextNode(code));
    (document.body || document.head || document.documentElement).appendChild(script);
})();
