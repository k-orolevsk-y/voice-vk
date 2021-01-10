// ==UserScript==
// @name         Voice VK
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script for viewing the text of voice messages on VK.COM
// @author       Korolevsky Kirill
// @homepage     https://korolevsky.me/
// @match        *://*.vk.com/*
// @resource     dekstopApi https://ssapi.ru/VKDesktopAPI.js
// @grant        GM_getResourceText
// ==/UserScript==

function Inj() {
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
        if (transcript == null || transcript == '') return;

        var icon = document.createElement("span");
        icon.style = "color: rgba(127,127,127,1.0)";
        icon.innerHTML = '<span style="color: black">Сказал(-а):</span> ' + transcript;

        var injectElement = element.getElementsByClassName('im-mess--text');
        injectElement[0].prepend(icon);
        return transcript;
    }

    function checkMessage(msg) {
        API("messages.getById", { message_ids: msg.getAttribute('data-msgid') })
        .then((r) => {
            if(r.response.items[0] == undefined) return r;
            else if(r.response.items[0].attachments[0] == undefined) return r;

            r = r.response.items[0].attachments[0].audio_message.transcript;

            setText(msg, r);
            return r;
        }).catch(function (e) {
            console.error(e);
        });
    }

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
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
