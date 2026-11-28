

var RE_WHITESPACE = new RegExp("[" + String.fromCharCode(9, 10, 13, 32) + "]+", "g");

var UNLOCKED_MODULES = ["841416", "878404"]; // à compléter au fur et à mesure des déblocages

// Stats d'un  module à partir du DOM (uniquement dispo sur une page de chapitre)
function getModuleStatsFromDOM(modId) {
  var $chapitres = $("[id^='p" + modId + "-']");
  if ($chapitres.length === 0) return null;
  var total = $chapitres.length;
  var done = $chapitres.find('a.menu-page i.fa-check').length;
  return { total: total, done: done };
}

// % du module en cours, basé sur le DOM (page de chapitre uniquement)
function getCompletionPct(modId) {
  var stats = getModuleStatsFromDOM(modId);
  if (!stats || stats.total === 0) return null;
  return Math.round((stats.done / stats.total) * 100);
}

// Stats d'un module via AJAX (utilisable partout, y compris sur la home)
function getModuleStatsAsync(modId, callback) {
  $.get(window.location.origin + '/formation/sommaire/' + modId + '/')
    .done(function(html) {
      var $pages = $(html).find('.col-md-9 .media.element.page');
      var total = $pages.length;
      var done = $pages.filter(':has(.fa-check-circle)').length;
      callback({ total: total, done: done });
    })
    .fail(function(xhr) {
      console.error('getModuleStatsAsync échec pour', modId, xhr.status);
    });
}

// % global (tous modules débloqués cumulés), via AJAX
function getGlobalCompletionPctAsync(callback) {
  var doneTotal = 0;
  var totalSum = 0;
  var remaining = UNLOCKED_MODULES.length;
  if (remaining === 0) { callback(0); return; }

  UNLOCKED_MODULES.forEach(function(modId) {
    getModuleStatsAsync(modId, function(stats) {
      totalSum += stats.total;
      doneTotal += stats.done;
      remaining--;
      if (remaining === 0) {
        callback(totalSum > 0 ? Math.round((doneTotal / totalSum) * 100) : 0);
      }
    });
  });
}

function updateChapterState(modId, pageId, estTermine) {
  // Mise à jour visuelle immédiate uniquement (icône + rond), Learnybox gère la vraie donnée
  var $li = $("#p" + modId + "-" + pageId);
  var $icon = $li.find('a.menu-page i.fa-check');
  var $checkBtn = $li.find('.se-check-btn');

  if (estTermine) {
    if ($icon.length === 0) {
      $li.find('a.menu-page').prepend('<i class="fa fa-check floatLeft" style="color:white; font-size:16px;"></i>');
    }
    $checkBtn.addClass('is-done');
  } else {
    $icon.remove();
    $checkBtn.removeClass('is-done');
  }

  var pct = getCompletionPct(modId);
  if (pct !== null) {
    $(".nav-prog-pct").text(pct + "%");
    $(".se-progress-fill").css("width", pct + "%");
    $("#se-topbar-wrap .se-progress-fill").css("width", pct + "%");
    $("#se-topbar-wrap .se-progress-pct").text(pct + "%");
  }
}

$(document).on('click', '.progression-confirm-form .progression-confirm-button', function() {
  var $form = $(this).closest('form.progression-confirm-form');
  var pageId = $form.find('input[name="id_page"]').val();
  var urlModMatch = window.location.href.match(/idmodule=([0-9]+)/);
  var modId = urlModMatch ? urlModMatch[1] : null;
  if (!modId || !pageId) return;

  var $btnSuccess = $form.find('.btn-success.progression-confirm-button');
  var $btnNormal = $form.find('.progression-confirm-button').not('.btn-success');
  var seraTermine = !$btnSuccess.hasClass('se-visible');

  if (seraTermine) {
    $btnSuccess.removeClass('se-hidden').addClass('se-visible');
    $btnNormal.removeClass('se-visible').addClass('se-hidden');
  } else {
    $btnSuccess.removeClass('se-visible').addClass('se-hidden');
    $btnNormal.removeClass('se-hidden').addClass('se-visible');
  }

  updateChapterState(modId, pageId, seraTermine);
});

$(document).ready(function () {


function fitChapterTitle() {
  var $h1 = $('.contenu-header h1');
  if (!$h1.length || window.innerWidth > 600) return;

  var el = $h1[0];
  el.style.setProperty('white-space', 'normal', 'important');
  el.style.removeProperty('-webkit-line-clamp');
  el.style.removeProperty('display');
  el.style.removeProperty('overflow');

  function nbLignes() {
    var range = document.createRange();
    range.selectNodeContents(el);
    var rects = range.getClientRects();
    var tops = {};
    for (var i = 0; i < rects.length; i++) {
      if (rects[i].height > 0) tops[Math.round(rects[i].top)] = true;
    }
    return Object.keys(tops).length;
  }

  var maxSize = 22, minSize = 13, size = maxSize;
  el.style.setProperty('font-size', size + 'px', 'important');

  while (nbLignes() > 2 && size > minSize) {
    size--;
    el.style.setProperty('font-size', size + 'px', 'important');
  }

  if (nbLignes() > 2) {
    el.style.setProperty('display', '-webkit-box', 'important');
    el.style.setProperty('-webkit-line-clamp', '2', 'important');
    el.style.setProperty('-webkit-box-orient', 'vertical', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
  }
}

fitChapterTitle();
$(window).on('resize', fitChapterTitle);

$('.progression-confirm-form .progression-confirm-button').each(function() {
  var $btn = $(this);
  var estVisible = $btn.css('display') !== 'none';
  $btn.removeAttr('style');
  if (estVisible) {
    $btn.addClass('se-visible');
  } else {
    $btn.addClass('se-hidden');
  }
});


   // Supprime définitivement le formulaire du haut
    $('.menu-sequence-header')
        .next('form.progression-confirm-form')
        .remove();

    // Récupère le formulaire du bas
    var $form = $('.menu-sequence-footer')
        .prevAll('form.progression-confirm-form')
        .first();

function injectCheckButtons() {
  $("li[id^='p'] > a.menu-page").each(function() {
    var $link = $(this);
    if ($link.find('.se-check-btn').length > 0) return;

    var isDone = $link.find('i.fa-check').length > 0;
    var svg = '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    var $btn = $('<span class="se-check-btn' + (isDone ? ' is-done' : '') + '">' + svg + '</span>');
    $link.append($btn);
  });
}

injectCheckButtons();

  /* ?? Commentaires ?? */
  var observer = new MutationObserver(function() {
    var btn = document.querySelector("a[onclick*='DisplayMoreComments'], a[onclick*='displayMoreComments'], .more-comments");
    if (btn) btn.click();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  /* ?? Select2 ?? */
  $('select[name="subject"] option[value="question"]').text("Envoyer un message");
  $('select[name="subject"] option[value="pedagogique"]').remove();
  $('select[name="subject"] option[value="technique"]').remove();
  $('select[name="subject"] option[value="autre"]').remove();
  $('select[name="subject"]').trigger('change.select2');
  $('select[name="idformation"] option[value=""]').remove();
  $('select[name="idformation"] option[value="84488"]').remove();
  $('select[name="idformation"]').trigger('change.select2');

  /* ?? Bouton signaler ?? */

  if ($("body").hasClass("formation")) {
    var $titre = $(".contenu-header h1");
    if ($titre.length) {
      var signalHref = $(".footer-actions .signaler a").attr("href") || "#";

      if ($form && $form.length) {
        var $wrap = $('<div class="maincontainer formationscorm" style="display:contents;"></div>');
        $wrap.insertBefore($titre);
        $form.appendTo($wrap).css('order', 98);
      }

      $titre.before("<a href='" + signalHref + "' class='se-signal-btn' title='Signaler un problème'><i class='fa fa-flag'></i></a>");
    }
  }


var urlModMatchDesktop = window.location.href.match(/idmodule=([0-9]+)/);
var modIdDesktop = urlModMatchDesktop ? urlModMatchDesktop[1] : null;

if (modIdDesktop) {
  var pctDesktop = getCompletionPct(modIdDesktop) || 0;
  $(".se-progress-fill").css("width", pctDesktop + "%");
  $(".nav-prog-pct").text(pctDesktop + "%");
} else {
  getGlobalCompletionPctAsync(function(pctGlobalTop) {
    $(".se-progress-fill").css("width", pctGlobalTop + "%");
    $(".nav-prog-pct").text(pctGlobalTop + "%");
  });
}

  /* ?? Messages aléatoires ?? */
  if ($("body").hasClass("formation")) {
    var messages = [
      { label: "Chat", color: "#ff721f", bg: "#ffd2b8", icon: "fa-comment", text: "Si tu rencontres un problème, n'hésite pas à m'écrire dans le chat en bas à droite" },
      { label: "Commentaires", color: "#ff721f", bg: "#ffd2b8", icon: "fa-commenting", text: 'Mets en pratique rapidement ce que tu apprends dans les chapitres dans la section "Commentaires" en-dessous des chapitres et partage avec les autres de la communauté' },
      { label: "Suggestions", color: "#ff721f", bg: "#ffd2b8", icon: "fa-cogs", text: 'Propose tes idées pour améliorer Smart English en cliquant sur "Suggestions" dans la barre de navigation' },
      { label: "Signale une erreur", color: "#ff721f", bg: "#ffd2b8", icon: "fa-flag", text: "Un problème dans un chapitre ? Signale-le en cliquant sur l'icône du drapeau dans le chapitre en question" }
    ];

    var msg = messages[Math.floor(Math.random() * messages.length)];

    $(".se-menu-obj").remove();

    var html =
      "<div class='se-menu-obj' style='border-left-color:" + msg.color + "'>" +
        "<div class='se-menu-obj-icon-wrap' style='background:" + msg.bg + "'>" +
          "<i class='fa " + msg.icon + "' style='color:" + msg.color + "'></i>" +
        "</div>" +
        "<div>" +
          "<div class='se-menu-obj-title' style='color:" + msg.color + "'>" + msg.label + "</div>" +
          "<div class='se-menu-obj-text'>" + msg.text + "</div>" +
        "</div>" +
      "</div>";

    if (window.innerWidth <= 768 && $(".maincontainer.comments").length) {
      $(".maincontainer.comments").before(html);
    } else {
      $("#main-menu-container").after(html);
    }
  }

  /* ?? Dashboard home ?? */

if ($("body").hasClass("home")) {
    var timeSpent = $("#header_progression27723040 .formation-time-infos .nb").text().trim() || "—";
    var resumeHref = $("#btn_progression_27723040").attr("href") || "#";
    var modMatch = resumeHref.match(/idmodule=([0-9]+)/);
    var pageMatch = resumeHref.match(/idpage=([0-9]+)/);
    var currentModId = (modMatch && modMatch[1] !== "0") ? modMatch[1] : "841416";
    var currentPageId = pageMatch ? pageMatch[1] : "";

  if (!currentPageId) {
      $(".se-hero-eyebrow").text("Commence ton aventure");
      $(".se-hero-title").html("Prêt à te lancer ?<br>Ta série t'attend !");
    } else {
      $(".se-hero-eyebrow").text("Continue ton aventure");
      $(".se-hero-title").html("Reprends là où<br>tu t'es arrêté !");
    }


    var currentModName = $.trim($("#m" + currentModId + " > a").text().replace(RE_WHITESPACE, " ")) || "Module 1 - Premiers pas";
    var currentChapter = currentPageId ? ($("#p" + currentModId + "-" + currentPageId + " a").attr("title") || "") : "";

    $("#se-hero-play-btn").attr("href", resumeHref);
    $("#se-hero-mod-name").text(currentModName);
    $("#se-hero-chap-name").text(currentChapter ? "Chapitre · " + currentChapter : "");
    $("#se-hero-time").text(timeSpent);



var moduleImages = {
      "841416": "https://da32ev14kd4yl.cloudfront.net/versioned/smart-english/Site/75f4e91c-61a5-4493-a196-edcdcfadbc60.png",
      "878404": "https://da32ev14kd4yl.cloudfront.net/versioned/smart-english/Site/c371951f-9117-48b3-b1d6-9a31c9d735a2.png",
      "878405": "https://da32ev14kd4yl.cloudfront.net/versioned/smart-english/Landing%20Pages/Early%20Access/beginner-icone-module-3.jpg",
      "878406": "https://da32ev14kd4yl.cloudfront.net/versioned/smart-english/Landing%20Pages/Early%20Access/beginner-icone-module-4.jpg"
    };
    var hero = document.querySelector(".se-hero-dashboard");
    if (hero && moduleImages[currentModId]) {
      hero.style.backgroundImage = "url('" + moduleImages[currentModId] + "')";
    }

['878405', '878406'].forEach(function(modId) {
      var $card = $('#se-card-' + modId);
      $card.addClass('se-card-locked');
      $card.css({ 'pointer-events': 'none', 'opacity': '0.7' });
      $('#se-btn-' + modId).replaceWith(
        '<div class="se-lock-btn"><i class="fa fa-lock" style="margin-right:6px;"></i>Bientôt disponible</div>'
      );
    });

if (currentPageId) {
      $("#se-card-" + currentModId).addClass("se-card-active");
      $("#se-status-" + currentModId).html("<span class='se-status-badge se-status-active'>En cours</span>");
      var $activeBtn = $("#se-btn-" + currentModId);
      var activeColor = $activeBtn.data("color") || "#ff721f";
      $activeBtn.css({ background: activeColor, "border-color": activeColor, color: "#fff", "box-shadow": "0 8px 20px " + activeColor + "44" }).html("<i class='fa fa-play'></i> Continuer");
    }

var chargementsRestants = 2;
    function verifieChargementTermine() {
      chargementsRestants--;
      if (chargementsRestants === 0) {
        $(".se-hero-dashboard").addClass("se-ready");
      }
    }

setTimeout(function() {
      $(".se-hero-dashboard").addClass("se-ready");
    }, 600);

    getModuleStatsAsync(currentModId, function(stats) {
      var globalPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
      $("#se-hero-prog-fill").css("width", globalPct + "%");
      $("#se-hero-prog-pct").text(globalPct + "%");
      $("#se-hero-chapters").text(stats.total);
      $("#se-prog-" + currentModId).text(globalPct + "%");
      verifieChargementTermine();
    });

    getGlobalCompletionPctAsync(function(pct) {
      $("#se-hero-global-pct").text(pct + "%");
      verifieChargementTermine();
    });


 // ? AJOUTE CE BLOC ICI
    var allModuleIds = ['841416', '878404', '878405', '878406'];
    allModuleIds.forEach(function(modId) {
      getModuleStatsAsync(modId, function(stats) {
        $('#se-chap-' + modId).text(stats.total > 0 ? stats.total : "0");
        $('#se-prog-' + modId).text((stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0) + "%");
      });
    });
}
});

/* ??????????????????????????????????????????
   TABBAR MOBILE
?????????????????????????????????????????? */
(function() {
  var BREAKPOINT = 768;

  var style = document.createElement('style');
  style.textContent = `
    @media (max-width: ${BREAKPOINT}px) {
      .se-tabbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999; background: #ffffff; display: flex; align-items: flex-start; padding: 16px 8px calc(16px + env(safe-area-inset-bottom)); box-shadow: 0 -10px 26px rgba(34,48,71,0.09); }
      .se-tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none; color: #a3adba; font-family: 'Segoe UI', Arial, sans-serif; }
      .se-tab svg { width: 22px; height: 22px; }
      .se-tab span { font-size: 10px; font-weight: 700; }
      .se-tab.se-active { color: #ff721f; }
      .se-fab { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(160deg, #ff721f, #e8611a); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(255,114,31,0.45), 0 0 0 5px #ffffff; cursor: pointer; }
      .se-fab svg { width: 24px; height: 24px; color: #fff; margin-left: 2px; }
      .se-fab-space { width: 58px; }
      body { padding-bottom: 90px !important; }
    }
    @media (min-width: ${BREAKPOINT + 1}px) {
      .se-tabbar { display: none !important; }
    }
  `;
  document.head.appendChild(style);

var tabbarHTML = `
  <div class="se-tabbar" id="se-tabbar">
    <a href="https://www.smartenglish.fr/formation/home/?idformation=84378" class="se-tab se-active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
      <span>Accueil</span>
    </a>
    <div class="se-fab" id="se-fab-continue">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <a href="https://www.smartenglish.fr/formation/profil/" class="se-tab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>
      <span>Profil</span>
    </a>
  </div>
`;

  document.body.insertAdjacentHTML('beforeend', tabbarHTML);

  /* FAB — reprendre le chapitre en cours */
document.getElementById('se-fab-continue').addEventListener('click', function() {
    var idmodule = window.location.href.match(/idmodule=([0-9]+)/);
    var idpage = window.location.href.match(/idpage=([0-9]+)/);
    if (idmodule && idpage) {
      // On est déjà sur une page de chapitre : on ne redirige pas, on remonte juste en haut
      window.scrollTo(0, 0);
      return;
    }
    var resumeBtn = document.querySelector('#btn_progression_27723040');
    if (resumeBtn && resumeBtn.getAttribute('href')) {
      window.location.href = resumeBtn.getAttribute('href');
      return;
    }
    window.location.href = 'https://www.smartenglish.fr/formation/home/?idformation=84378';
  });

})();

/* ??????????????????????????????????????????
   TOPBAR MOBILE
?????????????????????????????????????????? */
(function() {
  var BREAKPOINT = 768;
  var SERIES_NAME  = 'Beginner Series';
  var MODULE_NAME  = 'Survie';
  var MODULE_NUMBER = 2;

function getStreakCount() {
  var KEY = 'se_streak';
  function localDateStr(d) {
    var dt = d || new Date();
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  var dates = [];
  try { dates = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) {}

  // Enregistre la visite du jour, peu importe la page visitée
  var today = localDateStr();
  if (dates.indexOf(today) === -1) {
    dates.push(today);
    dates = dates.slice(-90);
    try { localStorage.setItem(KEY, JSON.stringify(dates)); } catch(e) {}
  }

  var set = {};
  dates.forEach(function(d) { set[d] = true; });
  var streak = 0;
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  while (set[localDateStr(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

var STREAK_COUNT = getStreakCount();



  var style = document.createElement('style');
  style.textContent = `
    @media (max-width: ${BREAKPOINT}px) {
      #line5525853 { display: none !important; }
      .se-topbar-wrap { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff721f 0%, #ff973c 100%); font-family: 'Lato', sans-serif; }
      .se-topbar { padding: 16px 18px 12px; display: flex; align-items: center; justify-content: space-between; }
      .se-brand { display: flex; align-items: center; gap: 10px; }
   .se-logo-img { height: 15px !important; width: auto !important; max-width: 50px !important; flex-shrink: 0; display: block; }
      .se-series-name { color: #ffffff; font-size: 13px; font-weight: 700; }
      .se-top-actions { display: flex; align-items: center; gap: 10px; }
      .se-streak { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 5px 9px; border-radius: 20px; }
      .se-streak svg { width: 14px; height: 14px; }
      .se-streak span { color: #ffffff; font-size: 12px; font-weight: 700; }
      .se-avatar { width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: #ffffff; overflow: hidden; }
      .se-avatar svg { width: 22px; height: 22px; }
      .se-progress-bloc { margin: 0 18px 14px; }
      .se-progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
      .se-progress-track { flex: 1; height: 5px; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden; }
      .se-progress-fill { height: 100%; background: #ffffff; border-radius: 999px; box-shadow: 0 0 8px rgba(255,255,255,0.4); transition: width 0.6s ease; }
      .se-progress-pct { font-size: 12px; font-weight: 700; color: #ffffff; min-width: 28px; text-align: right; }
      .se-module-caption { color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 400; }
      .se-module-caption b { color: #ffffff; font-weight: 700; }
    }
    @media (min-width: ${BREAKPOINT + 1}px) {
      .se-topbar-wrap { display: none !important; }
    }
  `;
  document.head.appendChild(style);

var topbarHTML = `
    <div class="se-topbar-wrap" id="se-topbar-wrap">
      <div class="se-topbar">
        <div class="se-brand">
          <img src="https://da32ev14kd4yl.cloudfront.net/versioned/smart-english/Branding/logo%20smart%20english%20v9%20transparent.png" class="se-logo-img" alt="Smart English">
          <span class="se-series-name">${SERIES_NAME}</span>
        </div>
        <div class="se-top-actions">
          <div class="se-streak">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 2s-5 6-5 11a5 5 0 0010 0c0-2-1-3-1-3s-.5 2-2 2c-2 0-2-2-2-3 0-2 2-4 2-4z"/></svg>
            <span>${STREAK_COUNT}</span>
          </div>
        <a href="https://www.smartenglish.fr/formation/profil/" class="se-avatar" id="se-avatar-img"></a>
        </div>
      </div>
      <div class="se-progress-bloc">
        <div class="se-progress-row">
          <div class="se-progress-track"><div class="se-progress-fill" style="width: 0%"></div></div>
          <div class="se-progress-pct">0%</div>
        </div>
        <div class="se-module-caption"> <b>Module ${MODULE_NUMBER}—${MODULE_NAME}</div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', topbarHTML);

  function ajustePaddingTop() {
    if (window.innerWidth <= BREAKPOINT) {
      var h = document.getElementById('se-topbar-wrap').offsetHeight;
      document.body.style.paddingTop = h + 'px';
    } else {
      document.body.style.paddingTop = '';
    }
  }
  ajustePaddingTop();
  window.addEventListener('resize', ajustePaddingTop);

  $(document).ready(function() {

var modNames = {
  "841416": "Premiers pas",
  "878404": "Survie",
  "878405": "Vie sociale",
  "878406": "Vie professionnelle"
};
var modNumbers = { "841416": 1, "878404": 2, "878405": 3, "878406": 4 };
var urlModMatch = window.location.href.match(/idmodule=([0-9]+)/);
var urlPageMatch = window.location.href.match(/idpage=([0-9]+)/);
var currentModIdProg = urlModMatch ? urlModMatch[1] : null;
var currentPageIdProg = urlPageMatch ? urlPageMatch[1] : null;

var pctAAfficher = null;
var modIdAAfficher = null;
var modNameAAfficher = null;

if (currentModIdProg) {
  var modNameLive = $.trim($("#m" + currentModIdProg + " > a").text().replace(RE_WHITESPACE, " "));
  var pctModule = getCompletionPct(currentModIdProg);
  var modNameAAfficher = modNameLive || modNames[currentModIdProg] || MODULE_NAME;

  if (pctModule !== null) {
    $(".se-progress-fill").css("width", pctModule + "%");
    $(".se-progress-pct").text(pctModule + "%");
  }
  var currentModNumber = modNumbers[currentModIdProg] || MODULE_NUMBER;
  $(".se-module-caption").html("Module " + currentModNumber + " — <b>" + modNameAAfficher + "</b>");
} else {
  getGlobalCompletionPctAsync(function(pctGlobal) {
    $(".se-progress-fill").css("width", pctGlobal + "%");
    $(".se-progress-pct").text(pctGlobal + "%");
  });
  $(".se-module-caption").html("<b>Progression totale de la série en cours</b>");
}

function syncAvatar(tentative) {
  var $profileImgDiv = $('.avatar.dropdown a.dropdown-toggle div[style*="background-image"]').first();

  if ($profileImgDiv.length) {
    var bgImg = $profileImgDiv.css('background-image');
    var start = bgImg.indexOf('(');
    var end = bgImg.lastIndexOf(')');

    if (start > -1 && end > start) {
      var url = bgImg.substring(start + 1, end).trim();

      if ((url.charAt(0) === '"' && url.charAt(url.length - 1) === '"') ||
          (url.charAt(0) === "'" && url.charAt(url.length - 1) === "'")) {
        url = url.substring(1, url.length - 1);
      }

      $('#se-avatar-img').css({
        'background-image': 'url("' + url + '")',
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat'
      });
      return;
    }
  }

  if (tentative < 10) {
    setTimeout(function () {
      syncAvatar(tentative + 1);
    }, 300);
  }
}

syncAvatar(0);

  });
})();

(function () {
  var KEY = 'se_streak';
  function localDateStr(d) {
    var dt = d || new Date();
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function getData() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; }
  }
  function saveToday() {
    var dates = getData();
    var t = localDateStr();
    if (dates.indexOf(t) === -1) {
      dates.push(t);
      dates = dates.slice(-90);
      try { localStorage.setItem(KEY, JSON.stringify(dates)); } catch(e) {}
    }
  }
  function calcStreak(dates) {
    var set = {};
    dates.forEach(function(d) { set[d] = true; });
    var streak = 0;
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    while (set[localDateStr(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  function getWeek(dates) {
    var set = {};
    dates.forEach(function(d) { set[d] = true; });
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dow = today.getDay();
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));
    var labels = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    var result = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      result.push({
        label: labels[i],
        done: !!set[localDateStr(d)],
        isToday: localDateStr(d) === localDateStr(),
        future: d > today
      });
    }
    return result;
  }

  saveToday();
  var dates = getData();
  var streak = calcStreak(dates);
  var week = getWeek(dates);

  var numEl = document.getElementById('se-streak-num');
  if (numEl) numEl.textContent = streak + (streak > 1 ? ' jours' : ' jour');

  var weekEl = document.getElementById('se-streak-week');
  if (weekEl) {
    week.forEach(function(day) {
      var wrap = document.createElement('div');
      wrap.className = 'se-streak-day';
      var label = document.createElement('div');
      label.className = 'se-streak-day-label';
      label.textContent = day.label;
      var dot = document.createElement('div');
      var classes = 'se-streak-dot';
      if (day.done) classes += ' done';
      else if (day.isToday) classes += ' today';
      dot.className = classes;
      wrap.appendChild(label);
      wrap.appendChild(dot);
      weekEl.appendChild(wrap);
    });
  }
})();


/* =====================================================================
   FREEMIUM — verrouillage de la suite après « Parle de ta routine matinale »
   Groupe concerné : « Freemium » (ID 98099)
   ---------------------------------------------------------------------
   Repère utilisé : LearnyBox ne transmet pas le groupe du membre à la page.
   Freemium a accès aux mêmes pages que les groupes payants, SAUF aux
   5 épisodes de la mini-série. Donc : le membre voit le module 1 mais pas
   l'épisode 1 de la mini-série  =>  il est dans le groupe Freemium.
   /!\ Si tu modifies les pages ouvertes à Freemium ou aux groupes payants,
       vérifie que ce repère est toujours valable.
   ===================================================================== */
(function ($) {
  var FM = {
    repereModule1: "4717925",  // « Dire salut » (module 1) : visible par tous les inscrits au module 1
    reperePayant:  "5012058",  // « Episode 1 » (mini-série) : visible par les groupes payants, PAS par Freemium
    pagesBloquees: [
      "4915627", // Fréquence
      "4915628", // Décris tes goûts
      "4915642", // Prononciation
      "4915630", // Parle des goûts d'un ami
      "4915631", // Parle de ce que tu aimes faire ou pas
      "4915641", // Prononciation
      "4915632", // Parle de la routine d'un ami
      "4915633", // Parler de sa pratique de l'anglais
      "4915643"  // Prononciation
    ],
    modulesBloques:["878404","878405","878406"], // Module 2 - Survie
    offreUrl: "https://www.smartenglish.fr/beginner-series-early-access/",
    cacheKey: "se_fm_status",
    applique: false
  };

  /* ---------- Détection du groupe Freemium ---------- */
  function estFreemium(ids) {
    return ids.indexOf(FM.repereModule1) !== -1 && ids.indexOf(FM.reperePayant) === -1;
  }
  function idsDepuisDom() {
    var ids = [];
    $('li[id^="p"]').each(function () {
      var m = this.id.match(/^p\d+-(\d+)$/);
      if (m) ids.push(m[1]);
    });
    return ids;
  }
  function idsDepuisHtml(html) {
    var ids = [], re = /id="p\d+-(\d+)"/g, m;
    while ((m = re.exec(html))) ids.push(m[1]);
    return ids;
  }
  function memoriser(statut) {
    try { sessionStorage.setItem(FM.cacheKey, statut ? "1" : "0"); } catch (e) {}
  }
  function lireMemoire() {
    try { return sessionStorage.getItem(FM.cacheKey); } catch (e) { return null; }
  }

  /* ---------- Règles de blocage ---------- */
  function param(url, nom) {
    var m = (url || "").match(new RegExp("[?&]" + nom + "=([0-9]+)"));
    return m ? m[1] : null;
  }
  function estBloquee(idpage, idmodule) {
    if (idpage && FM.pagesBloquees.indexOf(String(idpage)) !== -1) return true;
    if (idmodule && FM.modulesBloques.indexOf(String(idmodule)) !== -1) return true;
    if (idpage) {
      for (var i = 0; i < FM.modulesBloques.length; i++) {
        if (document.getElementById("p" + FM.modulesBloques[i] + "-" + idpage)) return true;
      }
    }
    return false;
  }
  function lienBloque(href) {
    if (!href) return false;
    if (estBloquee(param(href, "idpage"), param(href, "idmodule"))) return true;
    for (var i = 0; i < FM.modulesBloques.length; i++) {
      if (href.indexOf("/sommaire/" + FM.modulesBloques[i]) !== -1) return true;
    }
    return false;
  }

  /* ---------- Affichage ---------- */
  function injecterCss() {
    if (document.getElementById("se-fm-css")) return;
    var css = ""
      + ".se-fm-locked > a{opacity:.55;}"
      + ".se-fm-locked > a .se-fm-ico{margin-left:6px;color:#FF721F;}"
      + ".se-fm-panel{max-width:640px;margin:40px auto;padding:36px 28px;border-radius:18px;background:#fff;"
      +   "box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center;}"
      + ".se-fm-panel .se-fm-lock{font-size:42px;line-height:1;margin-bottom:12px;}"
      + ".se-fm-panel h2{margin:0 0 14px;font-size:26px;}"
      + ".se-fm-panel p{font-size:17px;line-height:1.6;margin:0 0 14px;}"
      + ".se-fm-btn{display:inline-block;margin-top:10px;padding:14px 30px;border-radius:999px;background:#FF721F;"
      +   "color:#fff !important;font-weight:700;text-decoration:none !important;}"
      + ".se-fm-btn:hover{opacity:.9;}"
      + ".se-fm-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.6);z-index:99999;"
      +   "display:flex;align-items:center;justify-content:center;padding:16px;}"
      + ".se-fm-overlay .se-fm-panel{margin:0;position:relative;}"
      + ".se-fm-close{position:absolute;top:10px;right:16px;font-size:26px;cursor:pointer;color:#999;line-height:1;}";
    $('<style id="se-fm-css">').text(css).appendTo("head");
  }
  function panneau(avecFermeture) {
    return '<div class="se-fm-panel">'
      + (avecFermeture ? '<span class="se-fm-close" aria-label="Fermer">&times;</span>' : "")
      + '<div class="se-fm-lock"><i class="fa fa-lock" style="color:#FF721F;"></i></div>'
      + "<h2>La suite de l'aventure t'attend !</h2>"
      + "<p>Nicolas passera son test d'anglais à la fin du module 1… et c'est peut-être sa seule chance "
      + "de décrocher le stage de ses rêves. Il compte sur toi pour la suite !</p>"
      + "<p>Ton accès gratuit s'arrête ici. Débloque la Beginner Series pour continuer l'aventure "
      + "et garder le rythme pendant que ton cerveau est lancé.</p>"
      + "</div>";
  }
  function ouvrirOverlay() {
    if ($(".se-fm-overlay").length) return;
    var $o = $('<div class="se-fm-overlay">' + panneau(true) + "</div>").appendTo("body");
    $o.on("click", function (e) {
      if (e.target === this || $(e.target).hasClass("se-fm-close")) $o.remove();
    });
  }

  function appliquer() {
    if (FM.applique) return;
    FM.applique = true;
    injecterCss();

    // 1. Menu : cadenas sur les chapitres verrouillés
    var sel = FM.pagesBloquees.map(function (id) { return 'li[id$="-' + id + '"]'; });
    FM.modulesBloques.forEach(function (mod) { sel.push('li[id^="p' + mod + '-"]'); });
    $(sel.join(",")).addClass("se-fm-locked").each(function () {
      var $a = $(this).children("a").first();
      if (!$a.find(".se-fm-ico").length) $a.append('<i class="fa fa-lock se-fm-ico"></i>');
    });
    FM.modulesBloques.forEach(function (mod) {
      $("#m" + mod).addClass("se-fm-locked");
    });

    // 2. Tout clic vers une page verrouillée (menu, bouton « Suite », liens…) ouvre le message
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a && lienBloque(a.getAttribute("href"))) {
        e.preventDefault();
        e.stopPropagation();
        ouvrirOverlay();
      }
    }, true);

    // 3. Page verrouillée ouverte directement (lien, favori…) : contenu remplacé
    if (estBloquee(param(window.location.search, "idpage"), param(window.location.search, "idmodule"))) {
      $("#formation > .col-md-8").html(panneau(false));
    }

    // 4. Accueil : cartes des modules verrouillés (2, 3 et 4)
    function cartes() {
      FM.modulesBloques.forEach(function (mod) {
        var $card = $("#se-card-" + mod);
        if (!$card.length) return;
        $card.addClass("se-card-locked").css({ "pointer-events": "", "opacity": "" });
        if ($card.find(".se-fm-unlock").length) return;
        var $btn = $("#se-btn-" + mod);
        if (!$btn.length) $btn = $card.find(".se-lock-btn");
        $btn.replaceWith(
          '<a class="se-lock-btn se-fm-unlock" href="#"><i class="fa fa-lock" style="margin-right:6px;"></i>Débloquer la suite</a>'
        );
      });
    }
    $(document).on("click", ".se-fm-unlock", function (e) { e.preventDefault(); e.stopPropagation(); ouvrirOverlay(); });
    cartes();
    [600, 1500, 3000, 6000].forEach(function (t) { setTimeout(cartes, t); });

    // 5. Menu : bulle des modules 3 et 4, même message que pour le module 2
    var MSG_MODULES = {
      m878405: "Tu dois d'abord terminer le module 2 pour accéder au module 3",
      m878406: "Tu dois d'abord terminer le module 3 pour accéder au module 4"
    };
    window.addEventListener("click", function (e) {
      var li = e.target.closest ? e.target.closest("li[id]") : null;
      if (!li || !MSG_MODULES[li.id]) return;
      setTimeout(function () {
        var tip = document.querySelector(".se-lock-tip");
        if (tip) tip.textContent = MSG_MODULES[li.id];
      }, 0);
    }, true);

    // 6. Barres de progression : cadenas au niveau de la fin de l'essai (épisode 7)
    var BARLOCK_CSS = '.se-fm-barlock{position:absolute;top:-3px;bottom:-3px;width:3px;margin-left:-1.5px;border-radius:2px;background:#fff;box-shadow:0 0 3px rgba(0,0,0,.35);z-index:5;pointer-events:none}.se-fm-barlock i{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:3px;color:#fff;font-size:12px;line-height:1;text-shadow:0 0 3px rgba(0,0,0,.35)}';
    if (!document.getElementById('se-fm-barlock-css')) { var st = document.createElement('style'); st.id = 'se-fm-barlock-css'; st.textContent = BARLOCK_CSS; document.head.appendChild(st); }
    function statsModule(modId, cb) {
      $.get(window.location.origin + '/formation/sommaire/' + modId + '/').done(function (html) {
        var $p = $(html).find('.col-md-9 .media.element.page');
        var bloquees = 0;
        $p.each(function () {
          var h = $(this).find('a[href*="idpage"]').attr('href') || '';
          var m = h.match(/idpage=(\d+)/);
          if (m && FM.pagesBloquees.indexOf(m[1]) !== -1) bloquees++;
        });
        cb({ total: $p.length, bloquees: bloquees });
      });
    }
    function poserCadenas(fills, pct) {
      Array.prototype.forEach.call(fills, function (fill) {
        var bar = fill.parentElement;
        if (!bar) return;
        if (getComputedStyle(bar).position === 'static') bar.style.position = 'relative';
        bar.style.overflow = 'visible';
        var mk = bar.querySelector('.se-fm-barlock');
        if (!mk) { mk = document.createElement('span'); mk.className = 'se-fm-barlock'; mk.innerHTML = '<i class="fa fa-lock"></i>'; bar.appendChild(mk); }
        mk.style.left = pct + '%';
      });
    }
    var mod = (window.location.search.match(/idmodule=(\d+)/) || [])[1];
    var POS = { module: 53, serie: 25 };
    try { var c = JSON.parse(localStorage.getItem('se_fm_barlock') || 'null'); if (c && c.module) POS = c; } catch (e) {}
    function appliquerCadenas() {
      if (mod === '841416') {
        poserCadenas(document.querySelectorAll('.se-progress-fill'), 35); // volontairement avant la moitié du module
      } else if (!mod || mod === '0') {
        poserCadenas(document.querySelectorAll('.se-progress-fill, #se-hero-prog-fill'), POS.serie);
      }
    }
    function majPositions(t1, b1, t2) {
      if (!t1) return;
      var libres = t1 - (b1 || FM.pagesBloquees.length);
      POS = { module: Math.round((libres / t1) * 100), serie: Math.round((libres / (t1 + (t2 || 0))) * 100) };
      try { localStorage.setItem('se_fm_barlock', JSON.stringify(POS)); } catch (e) {}
      appliquerCadenas();
    }
    // Affichage immédiat (positions mémorisées), en même temps que la barre
    appliquerCadenas();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', appliquerCadenas);
    var obs = new MutationObserver(function () { appliquerCadenas(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 8000);
    // Calcul exact depuis le menu (pages de chapitre), sinon en arrière-plan
    var li1 = document.querySelectorAll('li[id^="p841416-"]').length;
    var li2 = document.querySelectorAll('li[id^="p878404-"]').length;
    if (li1) {
      var b1 = FM.pagesBloquees.filter(function (id) { return document.querySelector('li[id="p841416-' + id + '"]'); }).length;
      majPositions(li1, b1, li2);
    } else {
      statsModule('841416', function (m1) { statsModule('878404', function (m2) { majPositions(m1.total, m1.bloquees, m2.total); }); });
    }
  }

  /* ---------- Lancement ---------- */
  function lancer(statut) { if (statut) appliquer(); }

  var ids = idsDepuisDom();
  if (ids.length) {
    var statut = estFreemium(ids);
    memoriser(statut);
    lancer(statut);
  } else {
    // Pages sans menu (accueil) : on lit le menu de la formation en arrière-plan
    var cache = lireMemoire();
    if (cache !== null) lancer(cache === "1");
    $.get(window.location.origin + "/formation/formation/84378/").done(function (html) {
      var s = estFreemium(idsDepuisHtml(html));
      memoriser(s);
      lancer(s);
    });
  }
})(jQuery);
/* =================== FIN FREEMIUM =================== */


/* bienvenue retiree sur TEST */

/* ===== BOUTON PLAY BRILLANT - play du haut (accueil) ===== */
(function () {
  var css = '#se-hero-play-btn{position:relative;animation:seHeroBeat 1.8s ease-in-out infinite}' +
    '#se-hero-play-btn::before,#se-hero-play-btn::after{content:"";position:absolute;inset:0;border-radius:50%;border:3px solid #ff721f;pointer-events:none;animation:seHeroRing 1.8s ease-out infinite}' +
    '#se-hero-play-btn::after{animation-delay:.9s}' +
    '@keyframes seHeroRing{0%{transform:scale(1);opacity:.85}100%{transform:scale(1.9);opacity:0}}' +
    '@keyframes seHeroBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}';
  var s = document.createElement('style');
  s.id = 'se-play-glow';
  s.textContent = css;
  document.head.appendChild(s);
})();
/* ===== FIN BOUTON PLAY BRILLANT ===== */

/* ===== MENU AVATAR ALLEGE : sans Messagerie ni Beginner Series ===== */
(function () {
  var s = document.createElement('style');
  s.id = 'se-avatar-menu';
  s.textContent = '.dropdown-menu-user > .formation,.dropdown-menu-user > .user-formations,.dropdown-menu-user .user-main-actions{display:none !important}';
  document.head.appendChild(s);
})();
/* ===== FIN MENU AVATAR ALLEGE ===== */

/* ===== LIENS ESPACE MEMBRE : tout sur www.smartenglish.fr ===== */
(function () {
  var BON = 'www.smartenglish.fr';
  var MAUVAIS = ['smart-english.learnybox.com', 'go.smartenglish.fr'];
  function corriger() {
    if (window.location.host !== BON) return;
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var u;
      try { u = new URL(a.getAttribute('href'), window.location.href); } catch (e) { return; }
      if (MAUVAIS.indexOf(u.host) === -1 || u.pathname.indexOf('/formation/') !== 0) return;
      u.host = BON;
      u.protocol = 'https:';
      if (u.pathname === '/formation/home/' && !u.searchParams.get('idformation')) u.searchParams.set('idformation', '84378');
      a.setAttribute('href', u.toString());
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', corriger); else corriger();
  setTimeout(corriger, 1500);
})();
/* ===== FIN LIENS ESPACE MEMBRE ===== */

/* ===== DATES COMMENTAIRES MASQUEES ===== */
(function () {
  var s = document.createElement('style');
  s.id = 'se-comment-dates';
  s.textContent = '.comments .comments-content .date{display:none !important}';
  document.head.appendChild(s);
})();
/* ===== FIN DATES COMMENTAIRES ===== */



/* ===== RAPPEL MOT DE PASSE - chapitre 2, pour tous les membres ===== */
(function () {
  function go() {
    if (/[?&]idpage=4720248(&|$)/.test(window.location.search)) {
      var PWD_CSS = '#se-pwd-reminder{display:flex;align-items:center;gap:16px;margin:18px 0 40px;padding:18px 20px;background:#fff;border:1.5px solid #ffd9c2;border-radius:16px;box-shadow:0 8px 24px rgba(255,114,31,.10);font-family:Lato,sans-serif}' +
        '#se-pwd-reminder .se-pr-ico{flex:none;width:46px;height:46px;border-radius:50%;background:#fff1e8;color:#FF721F;display:flex;align-items:center;justify-content:center;font-size:20px}' +
        '#se-pwd-reminder .se-pr-txt{flex:1;min-width:0}' +
        '#se-pwd-reminder .se-pr-txt b{display:block;font-size:16px;font-weight:900;color:#1a2433;margin-bottom:2px}' +
        '#se-pwd-reminder .se-pr-txt span{font-size:14px;color:#6b5d50;line-height:1.45}' +
        '#se-pwd-reminder a.se-pr-btn{flex:none;padding:12px 20px;border-radius:999px;background:#FF721F;color:#fff !important;font-weight:900;font-size:14px;text-decoration:none !important;white-space:nowrap}' +
        '#se-pwd-reminder a.se-pr-btn:hover{opacity:.9}' +
        '@media (max-width:600px){#se-pwd-reminder{flex-wrap:wrap}#se-pwd-reminder a.se-pr-btn{width:100%;text-align:center}}';
      var poserRappel = function () {
        if (document.getElementById('se-pwd-reminder')) return true;
        var frame = document.querySelector('#formation iframe[src*="scorm"]') || document.querySelector('#formation iframe');
        if (!frame) return false;
        var cible = frame.closest('[id^="element"]') || frame.closest('.maincontainer') || frame.parentElement;
        if (!cible) return false;
        
        if (!document.getElementById('se-pwd-reminder-css')) { var s2 = document.createElement('style'); s2.id = 'se-pwd-reminder-css'; s2.textContent = PWD_CSS; document.head.appendChild(s2); }
        var box = document.createElement('div');
        box.id = 'se-pwd-reminder';
        box.innerHTML = '<div class="se-pr-ico"><i class="fa fa-lock"></i></div>' +
          '<div class="se-pr-txt"><b>Pense à choisir ton mot de passe</b><span>Pour retrouver Nicolas quand tu veux, choisis un mot de passe facile à retenir.</span></div>' +
          '<a class="se-pr-btn" href="https://www.smartenglish.fr/formation/profil/password/" target="_blank" rel="noopener">Choisir mon mot de passe</a>';
        cible.parentNode.insertBefore(box, cible.nextSibling);
        return true;
      };
      if (!poserRappel()) { [300, 1000, 2500].forEach(function (t) { setTimeout(poserRappel, t); }); }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
/* ===== FIN RAPPEL MOT DE PASSE ===== */

/* ===== SCORM TAILLE FIXE : la vidéo garde sa taille d'origine (860x516) et est réduite à l'échelle sur mobile ===== */
(function () {
  var W = 860, H = 516;
  var css = '[id^="scormmodule"].se-scorm-fixed{height:auto !important}' +
    '[id^="scormmodule"].se-scorm-fixed iframe{width:' + W + 'px !important;height:' + H + 'px !important;max-width:none !important;transform-origin:0 0 !important}';
  var s = document.createElement('style');
  s.id = 'se-scorm-fixed-css';
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
  function ajuster() {
    Array.prototype.forEach.call(document.querySelectorAll('[id^="scormmodule"]'), function (wrap) {
      var f = wrap.querySelector('iframe');
      if (!f) return;
      wrap.classList.add('se-scorm-fixed');
      var largeur = wrap.clientWidth || W;
      var k = Math.min(1, largeur / W);
      f.style.setProperty('transform', 'scale(' + k + ')', 'important');
      wrap.style.setProperty('height', Math.round(H * k) + 'px', 'important');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ajuster); else ajuster();
  window.addEventListener('load', ajuster);
  window.addEventListener('resize', ajuster);
  window.addEventListener('orientationchange', function () { setTimeout(ajuster, 300); });
  [500, 1500].forEach(function (t) { setTimeout(ajuster, t); });
})();
/* ===== FIN SCORM TAILLE FIXE ===== */

/* ===== TELECHARGEMENTS VIDES : masque les blocs « Pas de fichier à télécharger » ===== */
(function () {
  function masquer() {
    Array.prototype.forEach.call(document.querySelectorAll('.maincontainer.downloads'), function (c) {
      var liens = c.querySelectorAll('.download-link');
      if (!liens.length) return;
      var vides = Array.prototype.every.call(liens, function (l) { return /pas de fichiers? à télécharger/i.test(l.textContent); });
      if (!vides) return;
      var box = c.closest('[id^="element"]') || c;
      box.style.setProperty('display', 'none', 'important');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', masquer); else masquer();
  window.addEventListener('load', masquer);
})();
/* ===== FIN TELECHARGEMENTS VIDES ===== */

/* ===== LIBELLE PROFIL : « Profil » au lieu de « Modifier mon profil » ===== */
(function () {
  function renommer() {
    Array.prototype.forEach.call(document.querySelectorAll('.dropdown-menu-user h4, .dropdown-menu-user a, .user-action-content h4'), function (el) {
      if (el.children.length === 0 && /^\s*Modifier mon profil\s*$/i.test(el.textContent)) el.textContent = 'Profil';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renommer); else renommer();
  window.addEventListener('load', renommer);
})();
/* ===== FIN LIBELLE PROFIL ===== */

/* ===================================================================
   NOM DE LA SERIE DANS LE HEADER (a droite du logo)
   =================================================================== */
(function () {
  function poser() {
    var img = document.querySelector("#element30231396 .image img");
    if (!img || document.getElementById("se-hd-serie")) return;
    var box = img.parentElement;
    box.style.position = "relative";
    var s = document.createElement("div");
    s.id = "se-hd-serie";
    s.innerHTML = '<span class="se-hd-sep"></span><span class="se-hd-txt">BEGINNER SERIES</span>';
    var st = document.createElement("style");
    st.textContent = "#se-hd-serie{position:absolute;left:100%;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:14px;pointer-events:none;white-space:nowrap}" +
      "#se-hd-serie .se-hd-sep{width:1.5px;height:26px;background:rgba(255,255,255,.6)}" +
      "#se-hd-serie .se-hd-txt{font-family:Lato,sans-serif;color:#fff;font-weight:700;font-size:12px;letter-spacing:2.5px;opacity:.95}" +
      ".se-brand .se-series-name{text-transform:uppercase;letter-spacing:1.8px;font-weight:400 !important;font-size:11px}" +
      "@media (max-width:600px){#se-hd-serie{gap:10px}#se-hd-serie .se-hd-sep{height:22px}#se-hd-serie .se-hd-txt{font-size:11px;letter-spacing:2px}}";
    document.head.appendChild(st);
    box.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", poser); else poser();
  window.addEventListener("load", poser);
})();

;
/*dynprog*/document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.sep-done');if(!b)return;var t=document.querySelector('.nav-prog-pct'),w=b.classList.contains('on'),p0=parseInt(t&&t.textContent)||0,li=document.querySelector('#multilevelmenu li.page.active'),m=li&&li.closest('li.module'),N=m?m.querySelectorAll('a.menu-page').length:5;function u(x){var on=x===undefined?b.classList.contains('on'):x;if(on==w)return;w=on;var d=Math.round(p0*N/100)+(on?1:-1);p0=Math.max(0,Math.min(100,Math.round(d*100/N)));var th=document.querySelector('#sep-car a.c.cur .th');if(th){var br=th.querySelector('.br');if(on&&!br){br=document.createElement('span');br.className='br';br.style.width='100%';th.appendChild(br);}if(!on&&br)br.remove();}var s=document.querySelector('#sep-car .hd span');if(s)s.textContent=p0+' %';window.__sp=p0;if(t&&!t.__o){t.__o=1;new MutationObserver(function(){if(window.__sp!=null&&t.textContent!=window.__sp+'%'){t.textContent=window.__sp+'%';var ff=document.querySelector('.nav-prog .se-progress-fill');if(ff)ff.style.width=window.__sp+'%';}}).observe(t,{childList:true,characterData:true,subtree:true});}if(t)t.textContent=p0+'%';var f=document.querySelector('.nav-prog .se-progress-fill');if(f)f.style.width=p0+'%';}u(!w);setTimeout(function(){u()},1800);},true);
;
/*sea ADN*/(function(){function q(s,r){return(r||document).querySelector(s)}
function go(){var hd=q('#sep-head'),car=q('#sep-car'),ab=q('#sep-about'),sq=q('.sequence');if(!hd||!car||!ab||!sq||q('#sea-tabs'))return!!q('#sea-tabs');
var it=[].slice.call(car.querySelectorAll('.tr>a.c'));if(!it.length)return false;var cur=it.findIndex(function(a){return a.classList.contains('cur')});
var com=[].slice.call(document.querySelectorAll('.sequence .box-masonry')).filter(function(b){return /Commentaires/.test((b.querySelector('h4,h3')||{}).textContent||'')})[0];if(com)com.classList.add('sea-com');
function T(a){return a?{h:a.href,m:((q('.m',a)||{}).textContent||'').replace(/\s*\u00b7.*$/,''),t:(q('.t',a)||{}).textContent||'',i:((q('.th',a)||{}).style||{}).backgroundImage||''}:null}
var P=T(it[cur-1]),N=T(it[cur+1]),C=T(it[cur]);
var nav=document.createElement('div');nav.id='sea-nav';
function pn(o,r,l){return '<a class="sea-pn'+(r?' r':'')+(o?'':' off')+'" href="'+(o?o.h:'#')+'"><i>'+(r?'&rsaquo;':'&lsaquo;')+'</i><div><b>'+l+'</b><span>'+(o?o.t:'&nbsp;')+'</span></div></a>'}
nav.innerHTML=pn(P,0,'&Eacute;pisode pr&eacute;c.')+pn(N,1,'&Eacute;pisode suiv.');sq.insertBefore(nav,hd);
var seen=it.filter(function(a){return q('.br',a)}).length,done=it[cur]&&q('.br',it[cur]);
var me=document.createElement('div');me.className='sea-meta';me.innerHTML='<span>&Eacute;pisode '+(cur+1)+' sur '+it.length+'</span><span>Mini-s&eacute;rie gratuite</span>'+(done?'<span class="ok">&#10003; Vu</span>':'');hd.firstElementChild.appendChild(me);
var nc=com?((com.querySelector('h4')||{}).textContent||'').replace(/\D+/g,''):'';
var tb=document.createElement('div');tb.id='sea-tabs';tb.innerHTML='<button class="on" data-p="a">&Agrave; propos</button><button class="m" data-p="e">&Eacute;pisodes</button>'+(com?'<button data-p="c">Commentaires'+(nc?' ('+nc+')':'')+'</button>':'');sq.insertBefore(tb,hd.nextSibling);
var pan={a:ab,e:car,c:com};function sh(k){[].forEach.call(tb.children,function(b){b.classList.toggle('on',b.dataset.p==k)});Object.keys(pan).forEach(function(x){if(pan[x])pan[x].classList.toggle('sea-hide',x!=k&&!(x=='e'&&innerWidth>991))})}
tb.addEventListener('click',function(e){var b=e.target.closest('button');if(b)sh(b.dataset.p)});sh('a');addEventListener('resize',function(){var o=q('#sea-tabs .on');if(o&&o.dataset.p=='e'&&innerWidth>991)sh('a');else if(o)sh(o.dataset.p)});
var nx=N||it.map(T).filter(function(o,i){return i!=cur&&!q('.br',it[i])})[0];if(nx){var na=document.createElement('a');na.className='sea-next';na.href=nx.h;na.innerHTML='<small>&Agrave; SUIVRE</small><span class="im" style="background-image:'+nx.i.replace(/"/g,"'")+'"></span><b>'+nx.m+'</b><span>'+nx.t+'</span>';car.insertBefore(na,q('.tr',car))}
var h2=q('.hd h2',car);if(h2)h2.textContent='Tous les épisodes';
var s2=q('.s2');if(s2){var st=q('.s2-stage',s2),v=q('video',s2);if(st&&!q('.sea-pt',st)){var pt=document.createElement('div');pt.className='sea-pt';pt.innerHTML='<small>Objectif London &middot; '+(C?C.m:'')+'</small><b>'+(C?C.t:'')+'</b>';st.appendChild(pt)}if(v){var u=function(){s2.classList.toggle('sea-on',!v.paused)};v.addEventListener('play',u);v.addEventListener('pause',u);v.addEventListener('ended',u)}}
return true}
var n=0;(function t(){if(!go()&&++n<60)setTimeout(t,250)})()})();

;/* ===== EARLY ACCESS : mini-serie terminee (header M2 + barre mobile en bas) ===== */
(function(){
var URL_EA='https://www.smartenglish.fr/fin-essai-gratuit/',KEY='senD';
try{var qs=location.search;if(/[?&]seea=1/.test(qs))sessionStorage.setItem('seea_f','1');if(/[?&]seea=0/.test(qs))sessionStorage.removeItem('seea_f')}catch(e){}
function forced(){try{return sessionStorage.getItem('seea_f')==='1'}catch(e){return false}}
function state(){var seen=0,n=0,acc;try{var d=JSON.parse(localStorage.getItem(KEY));if(d&&d.pil){n=d.pil.length;seen=d.pil.filter(function(p){return p.d}).length;acc=d.acc}}catch(e){}
var car=document.querySelectorAll('#sep-car .tr>a.c');if(car.length){var b=0;[].forEach.call(car,function(a){if(a.querySelector('.br'))b++});if(b>seen){seen=b;n=car.length}}
return {done:forced()||(n>0&&seen>=n&&acc!==true)}}
var LOCK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
ARR='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
CHK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>';
var BTN='<a class="seea-b" href="'+URL_EA+'">'+LOCK+'<span><b>Débloque la suite</b><small>Saisons 1 à 4 · Early Access</small></span>'+ARR+'</a>';
var CSS='@media(min-width:769px){.nav-serie-bloc.seea-on>*:not(.seea){display:none!important}.nav-serie-bloc.seea-on{display:flex!important;align-items:center}}@media(max-width:768px){.nav-serie-bloc>.seea{display:none!important}}'+
'.seea{display:flex;align-items:center;gap:14px;margin-left:18px}.seea-t{display:flex;flex-direction:column;gap:2px;color:#fff;font-size:13px;line-height:1.2;font-weight:700;white-space:nowrap}.seea-t b{display:flex;align-items:center;gap:4px;font-weight:800}'+
'.seea-b{display:flex!important;align-items:center;gap:10px;background:#fff;color:#FF721F!important;text-decoration:none!important;border-radius:12px;padding:7px 14px;font-weight:800;line-height:1.15;white-space:nowrap;transition:transform .15s,box-shadow .15s}.seea-b:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(122,42,6,.18)}'+
'.seea-b span{display:flex;flex-direction:column}.seea-b b{font-size:15px;font-weight:800}.seea-b small{font-size:11px;color:#9A4A1E;font-weight:700}'+
'#seea-m{display:none}@media(max-width:768px){#seea-m{display:flex;flex-direction:column;gap:10px;position:fixed;left:0;right:0;bottom:0;z-index:9990;background:#fff;border-top:2px solid #FFE1CF;padding:12px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(122,42,6,.08);font-family:inherit}'+
'#seea-m .r{display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#7A2A06}#seea-m .r b{display:flex;align-items:center;gap:4px;color:#FF721F}#seea-m .k{height:7px;border-radius:7px;background:#FF721F}'+
'#seea-m .seea-b{justify-content:space-between;border:2px solid #FFE1CF}#seea-m .seea-b span{flex:1}body.seea-pad{padding-bottom:210px!important}}';
function go(){if(!state().done)return false;if(!document.getElementById('seea-css')){var st=document.createElement('style');st.id='seea-css';st.textContent=CSS;document.head.appendChild(st)}
var bl=document.querySelector('.nav-serie-bloc');if(bl&&!bl.querySelector('.seea')){var d=document.createElement('div');d.className='seea';d.innerHTML='<div class="seea-t"><span>Mini-série</span><b>'+CHK+'Terminée</b></div>'+BTN;bl.appendChild(d);bl.classList.add('seea-on')}
if(!document.getElementById('seea-m')){var m=document.createElement('div');m.id='seea-m';m.innerHTML='<div class="r"><span>Mini-série</span><b>'+CHK+'100%</b></div><div class="k"></div>'+BTN;document.body.appendChild(m);document.body.classList.add('seea-pad')}
var tb=document.getElementById('se-tabbar'),mm=document.getElementById('seea-m');if(mm)mm.style.bottom=(tb&&tb.offsetHeight?tb.offsetHeight+12:0)+'px';
return true}
var n=0;(function t(){go();if(++n<20)setTimeout(t,500)})();
})();

;/* ===== TEST : lecteur facon ADN (pause sombre, -10/play/+10 au centre, +10 s, vitesse, volume, survol du temps, clavier) ===== */
(function(){
var I={
fwd:'<svg viewBox="0 0 24 24"><path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/><text x="12" y="16.2" text-anchor="middle" font-size="7" font-weight="700" font-family="sans-serif">10</text></svg>',
bk:'<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/><text x="12" y="16.2" text-anchor="middle" font-size="7" font-weight="700" font-family="sans-serif">10</text></svg>',
play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'};
var CSS='.s2-stage::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .25s;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.15) 30%,rgba(0,0,0,.15) 65%,rgba(0,0,0,.7))}'+
'.s2-stage.sea-p::before,.s2-stage:not(.idle):hover::before{opacity:1}.s2-stage.sea-p .s2-mid{display:none!important}'+
'.s2 .s2-bar{z-index:5;background:none!important}.s2 .sea-pt{z-index:5}'+
'.sea-c{position:absolute;inset:0;z-index:4;display:none;align-items:center;justify-content:center;gap:clamp(18px,7cqw,64px);pointer-events:none}.s2-stage.sea-p .sea-c{display:flex}'+
'.sea-c button{pointer-events:auto;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;transition:transform .15s,background .15s}'+
'.sea-c .c-s{width:clamp(40px,8cqw,58px);height:clamp(40px,8cqw,58px);background:rgba(0,0,0,.35)}.sea-c .c-s:hover{background:rgba(0,0,0,.55);transform:scale(1.06)}.sea-c .c-s svg{width:62%;height:62%;fill:#fff}'+
'.sea-c .c-p{width:clamp(56px,13cqw,88px);height:clamp(56px,13cqw,88px);background:#FF721F;box-shadow:0 8px 30px rgba(255,114,31,.45)}.sea-c .c-p:hover{transform:scale(1.07)}.sea-c .c-p svg{width:46%;height:46%;fill:#fff;margin-left:6%}'+
'.s2 .s2-bar .b-play{order:1}.s2 .s2-bar .b-back{order:2}.s2 .s2-bar .b-fwd{order:3}.s2 .s2-bar .sea-vw{order:4}.s2 .s2-bar .s2-time{order:5}.s2 .s2-bar .s2-chap{order:6}.s2 .s2-bar .b-spd{order:7}.s2 .s2-bar .b-fs{order:8}'+
'.s2 .s2-bar .b-fwd svg,.s2 .s2-bar .b-back svg{fill:#fff}.s2 .s2-bar .b-fwd svg text,.s2 .s2-bar .b-back svg text{fill:#fff}'+
'.sea-vw{display:flex;align-items:center}.sea-vr{width:0;opacity:0;transition:width .2s,opacity .2s;accent-color:#FF721F;cursor:pointer;margin:0}.sea-vw:hover .sea-vr{width:72px;opacity:1;margin:0 6px 0 2px}.s2 .sea-vw .sea-vr{width:0!important;min-width:0!important;padding:0!important;border:0!important}.s2 .sea-vw:hover .sea-vr{width:72px!important}'+
'.s2 .s2-bar .b-spd{font:700 13px/1 inherit;color:#fff;min-width:44px;height:34px;padding:0 8px;border-radius:8px}'+
'.sea-tip{position:absolute;bottom:14px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font:600 12px/1 sans-serif;padding:5px 7px;border-radius:6px;pointer-events:none;opacity:0;transition:opacity .12s;white-space:nowrap}.s2-track:hover .sea-tip{opacity:1}'+
'@media(max-width:768px){.sea-vr,.s2 .s2-bar .b-fwd,.s2 .s2-bar .b-back{display:none!important}}';
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function setup(p){if(p.dataset.seaPl)return;var st=p.querySelector('.s2-stage'),v=p.querySelector('.s2-v'),bar=p.querySelector('.s2-bar');if(!st||!v||!bar)return;p.dataset.seaPl='1';
var bp=bar.querySelector('.b-play'),bb=bar.querySelector('.b-back'),bv=bar.querySelector('.b-vol'),tr=bar.querySelector('.s2-track');
function skip(d){var t=v.currentTime+d;if(d<0&&bb){if(d===-10){bb.click();return}}v.currentTime=Math.max(0,Math.min((v.duration||t)-0.3,t))}
var f=document.createElement('button');f.className='b-fwd';f.setAttribute('aria-label','Avancer de 10 s');f.innerHTML=I.fwd;f.onclick=function(e){e.stopPropagation();skip(10)};if(bb)bb.after(f);else bar.appendChild(f);
if(bv){var w=document.createElement('div');w.className='sea-vw';bv.before(w);w.appendChild(bv);var r=document.createElement('input');r.type='range';r.min=0;r.max=1;r.step=0.05;r.value=v.muted?0:v.volume;r.className='sea-vr';r.setAttribute('aria-label','Volume');
r.oninput=function(){v.volume=+r.value;v.muted=+r.value===0};v.addEventListener('volumechange',function(){r.value=v.muted?0:v.volume});w.appendChild(r)}
var SP=[1,1.25,1.5,0.75],si=0,sp=document.createElement('button');sp.className='b-spd';sp.setAttribute('aria-label','Vitesse de lecture');sp.textContent='1x';sp.onclick=function(e){e.stopPropagation();si=(si+1)%SP.length;v.playbackRate=SP[si];sp.textContent=(SP[si]+'x').replace('.',',')};bar.appendChild(sp);
if(tr){var tip=document.createElement('div');tip.className='sea-tip';tr.appendChild(tip);tr.addEventListener('mousemove',function(e){var b=tr.getBoundingClientRect(),x=Math.max(0,Math.min(b.width,e.clientX-b.left));tip.style.left=x+'px';tip.textContent=fmt((v.duration||0)*x/b.width)})}
var c=document.createElement('div');c.className='sea-c';c.innerHTML='<button class="c-s c-b" aria-label="Reculer de 10 s">'+I.bk+'</button><button class="c-p" aria-label="Lecture">'+I.play+'</button><button class="c-s c-f" aria-label="Avancer de 10 s">'+I.fwd+'</button>';
c.querySelector('.c-b').onclick=function(e){e.stopPropagation();skip(-10)};c.querySelector('.c-f').onclick=function(e){e.stopPropagation();skip(10)};c.querySelector('.c-p').onclick=function(e){e.stopPropagation();if(bp)bp.click();else v.play()};
var bar0=st.querySelector('.s2-bar');st.insertBefore(c,bar0);
function upd(){var started=v.currentTime>0.05||v.played.length>0;var ovOn=st.querySelector('.s2-ov.on,.s2-cross.on,.s2-end.on');st.classList.toggle('sea-p',v.paused&&started&&!ovOn&&!v.ended)}
['play','pause','playing','seeked','ended','loadeddata'].forEach(function(ev){v.addEventListener(ev,upd)});setInterval(upd,700);upd()}
function key(e){var t=e.target;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;var p=document.querySelector('.s2[data-sea-pl]');if(!p)return;var st=p.querySelector('.s2-stage');if(st.querySelector('.s2-ov.on'))return;var r=st.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
var v=p.querySelector('.s2-v'),q=function(s){return p.querySelector(s)},k=e.key;
if(k===' '||k==='k'||k==='K'){e.preventDefault();(q('.b-play')||{click:function(){v.paused?v.play():v.pause()}}).click()}
else if(k==='ArrowRight'){e.preventDefault();q('.b-fwd')&&q('.b-fwd').click()}
else if(k==='ArrowLeft'){e.preventDefault();q('.b-back')&&q('.b-back').click()}
else if(k==='f'||k==='F'){q('.b-fs')&&q('.b-fs').click()}
else if(k==='m'||k==='M'){q('.b-vol')&&q('.b-vol').click()}}
function go(){if(!document.querySelector('.s2'))return false;if(!document.getElementById('sea-pl-css')){var s=document.createElement('style');s.id='sea-pl-css';s.textContent=CSS;document.head.appendChild(s);document.addEventListener('keydown',key)}
[].forEach.call(document.querySelectorAll('.s2'),setup);return true}
var n=0;(function t(){go();if(++n<30)setTimeout(t,500)})();
})();

;/* ===== TEST : page episode facon ADN v4 (bande cinema sombre, lecteur pleine hauteur, vignettes episodes dans la bande, descriptif dans la carte) ===== */
(function(){
var CSS='body:has(#sep-head) #formation{overflow:visible!important}body:has(#sep-head) [class*=col-]:has(> .sequence){width:100%!important;max-width:100%!important;flex:0 0 100%!important}body:has(#sep-head) .sequence{grid-template-columns:minmax(0,1fr)!important;column-gap:0!important}'+
'body:has(#sep-head) .sequence .s2{position:relative;z-index:2;max-width:none!important;width:100%;margin:0!important;justify-self:start}'+
'body:has(#sep-head) .sequence .s2 .s2-stage{box-shadow:none!important}'+
'#sea-cine{position:absolute;left:0;width:100%;z-index:1;pointer-events:none;overflow:hidden;background:#140a05}'+
'#sea-cine i{position:absolute;inset:-40px;background:center/cover no-repeat;filter:blur(28px) saturate(1.15);opacity:.55;transform:scale(1.1)}'+
'#sea-cine b{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(20,10,5,.15),rgba(20,10,5,.85) 75%),linear-gradient(rgba(20,10,5,0) 70%,rgba(20,10,5,.9))}'+
'#sea-nav,#sea-tabs{display:none!important}'+
'.sea-desc{display:none!important}#sep-about>p.sea-dup{display:none!important}'+
'#sea-info{margin:0 0 30px;max-width:860px}#sea-info small{display:block;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#FFB48A;margin:0 0 6px}#sep-car #sea-info h3{font-size:30px!important;font-weight:800!important;line-height:1.15!important;color:#fff!important;margin:0 0 10px!important}#sea-info p{font-size:16px;line-height:1.6;color:rgba(255,255,255,.82);margin:0!important}@media(max-width:991px){#sea-info{margin:0 0 22px}#sep-car #sea-info h3{font-size:22px!important}#sea-info p{font-size:14px}}'+
'#sep-head{grid-row:3;margin:64px 0 0!important;padding:20px 24px!important;background:#fff;border:1px solid #FFE1CF;border-radius:16px;box-shadow:0 8px 26px rgba(122,42,6,.06)}'+
'body:has(#sep-head) #sep-about{grid-row:4!important;margin:28px 0 0!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;width:auto!important}'+
'body:has(#sep-head) #sep-car{grid-column:1!important;grid-row:2!important;position:relative!important;z-index:2;padding:0!important;border:0!important;box-shadow:none!important;background:none!important;margin:26px 0 0!important}'+
'body:has(#sep-head) .sequence .sea-com{grid-row:6!important;margin-top:36px!important}'+
'#sep-car.sea-hide,#sep-about.sea-hide,.sea-com.sea-hide{display:block!important}'+
'#sep-car .hd,#sep-car .sea-next{display:none!important}'+
'#sep-car .sea-h2{font-size:20px!important;font-weight:800!important;color:#fff!important;margin:0 0 14px!important}'+
'#sep-car .tr{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:22px 18px!important;overflow:visible!important;transform:none!important;width:auto!important}'+
'#sep-car .tr>a.c{display:block!important;padding:0!important;background:none!important;box-shadow:none!important;border-radius:0!important}'+
'#sep-car .tr>a.c .th{display:block;position:relative;width:100%!important;height:auto!important;aspect-ratio:16/9;border-radius:12px!important;margin:0 0 9px!important;overflow:hidden;transition:transform .2s,box-shadow .2s}'+
'#sep-car .tr>a.c:hover .th{transform:translateY(-2px)}'+
'#sep-car .tr>a.c.cur .th{box-shadow:0 0 0 3px #FF721F}'+
'#sep-car .tr>a.c.cur .th::after{content:"";position:absolute;inset:0;background:rgba(122,42,6,.45) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M8 5v14l11-7z%27 fill=%27%23fff%27/%3E%3C/svg%3E") center/38px no-repeat}'+
'#sep-car .tr>a.c .m{font-size:12px!important;font-weight:800!important;color:#FFB48A!important;margin:0 0 2px!important}'+
'#sep-car .tr>a.c .t{font-size:15px!important;font-weight:800!important;line-height:1.3!important;color:#fff!important}'+
'@media(max-width:991px){#sep-car .tr{display:flex!important;flex-direction:row!important;gap:12px!important;overflow-x:auto!important;scroll-snap-type:x mandatory;padding-bottom:4px!important;scrollbar-width:none}#sep-car .tr::-webkit-scrollbar{display:none}#sep-car .tr>a.c{flex:0 0 62%!important;scroll-snap-align:start}body:has(#sep-head) .sequence .s2{margin-top:0!important}#sep-car{margin-top:18px!important}#sep-head{margin-top:32px!important;padding:16px!important}.sea-desc{font-size:14px}}';
function q(s,r){return(r||document).querySelector(s)}
var band=null;
function place(){var s2=q('.sequence .s2'),car=q('#sep-car');if(!s2||!band)return;var y=scrollY||document.documentElement.scrollTop||0,vw=document.documentElement.clientWidth,mob=vw<992;
var h=q('.line:has(.se-navbar-inner)'),hb=h?h.getBoundingClientRect().bottom+y:0;
var sq=q('.sequence'),pl=sq?sq.getBoundingClientRect().left:0,t0=s2.getBoundingClientRect().top+y,hh=h?h.getBoundingClientRect().height:0,ch=car?car.getBoundingClientRect().height:0,w=mob?vw:Math.min(vw,Math.max(480,Math.round((innerHeight-hh-Math.max(0,t0-hb)-ch-26-22)*16/9)));
s2.style.setProperty('width',w+'px','important');s2.style.setProperty('margin-left',Math.round((vw-w)/2-pl)+'px','important');
var r=s2.getBoundingClientRect(),top=Math.max(hb,r.top+y-(mob?0:16)),cb=car?car.getBoundingClientRect().bottom+y:r.bottom+y,pad=mob?22:40;
band.style.top=top+'px';band.style.height=(cb+pad-top)+'px'}
function desc(){var hd=q('#sep-head'),p=q('#sep-about>p'),car=q('#sep-car');if(!hd||!p||!car||q('#sea-info'))return;var d=document.createElement('p');d.className='sea-desc';d.textContent=p.textContent;hd.appendChild(d);p.classList.add('sea-dup');
var c=q('#sep-car .tr>a.c.cur'),m=c&&q('.m',c),t=c&&q('.t',c),num=m?(m.textContent.match(/[ÉE]pisode\s*\d+/i)||[''])[0]:'',f=document.createElement('div');f.id='sea-info';f.innerHTML='<small></small><h3></h3><p></p>';f.children[0].textContent=num;f.children[1].textContent=t?t.textContent.trim():'';f.children[2].textContent=p.textContent.trim();car.insertBefore(f,car.firstChild)}
function unhide(){['#sep-car','#sep-about','.sequence .sea-com'].forEach(function(s){var e=q(s);if(e)e.classList.remove('sea-hide')})}
function go(){var car=q('#sep-car'),s2=q('.sequence .s2'),hd=q('#sep-head');if(!car||!s2||!hd||!q('#sea-tabs'))return false;if(q('#sea-cine'))return true;
var st=document.createElement('style');st.id='sea3-css';st.textContent=CSS;document.head.appendChild(st);
var old=q('#sea2-css');if(old)old.remove();
unhide();desc();if(!q('.sea-h2',car)){var h2=document.createElement('h2');h2.className='sea-h2';h2.textContent='Épisodes';car.insertBefore(h2,q('.tr',car))}
band=document.createElement('div');band.id='sea-cine';var cur=q('#sep-car .tr>a.c.cur .th'),img=cur?cur.style.backgroundImage:'';band.innerHTML='<i style="background-image:'+img.replace(/"/g,"'")+'"></i><b></b>';document.body.appendChild(band);
place();addEventListener('resize',function(){unhide();place()});addEventListener('load',place);if(window.ResizeObserver)new ResizeObserver(place).observe(document.body);
var k=0,iv=setInterval(function(){unhide();place();if(++k>20)clearInterval(iv)},500);return true}
var n=0;(function t(){if(!go()&&++n<80)setTimeout(t,250)})();
})();
