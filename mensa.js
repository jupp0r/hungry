(function() {
  var ajax_count_completed, buildFlatView, buildNestedView, buildSpeiseLiView, checkForNewView, defaultsettings, detailsGetReady, loadSettings, loadSpeiseplan, mensa_str_to_id, parseDetailsUrl, parse_prices, saveSettings, settings, settingschanged, setupOptionScreen, speiseplan, updateModel, updateOptionScreenWithSettings, updateProgress, updateView, viewSliderChange;

  speiseplan = null;

  ajax_count_completed = 0;

  defaultsettings = {
    flatview: true
  };

  settings = null;

  settingschanged = false;

  String.prototype.strip = function() {
    return this.replace(/(^\s+)|(\s+$)/gm, "").replace(/(\r|\n|r\n)/gm, "");
  };

  $(document).ready(function() {
    speiseplan = {
      date: "",
      mensen: {}
    };
    console.log("loading settings ...");
    loadSettings();
    console.log(settings);
    setupOptionScreen();
    console.log("getting feed ...");
    return $.ajax({
      url: "http://www.studentenwerk-dresden.de/feeds/speiseplan.rss",
      success: loadSpeiseplan,
      method: "GET"
    });
  });

  updateModel = function() {
    return console.log(speiseplan);
  };

  updateView = function() {
    var $updatedView;
    $updatedView = $.mobile.pageContainer;
    if (settings.flatview) {
      return buildFlatView($updatedView);
    } else {
      return buildNestedView($updatedView);
    }
  };

  buildFlatView = function($updatedView) {
    var $mensadivider, $topContent, $topList, $topPage, mensa_essen_list, mensa_name, _ref;
    $topPage = $('<div data-role="page" id="mensalist">\
    <div data-role="header">\
      <h1>Speiseplan</h2>\
      <a href="#options" data-icon="gear" class="ui-btn-right">Options</a>\
    </div>');
    $topContent = $('<div data-role="content">');
    $topList = $('<ul>', {
      title: "Speiseplan",
      id: "mainlist",
      "data-role": "listview",
      "data-inset": true
    });
    _ref = speiseplan.mensen;
    for (mensa_name in _ref) {
      mensa_essen_list = _ref[mensa_name];
      $mensadivider = $('<li>', {
        "data-role": "list-divider",
        text: mensa_name
      });
      $mensadivider.appendTo($topList);
      buildSpeiseLiView(mensa_essen_list, $topList);
    }
    console.log("bla");
    $topList.appendTo($topContent).trigger("create");
    $topContent.appendTo($topPage);
    return $topPage.appendTo($updatedView);
  };

  buildNestedView = function($updatedView) {
    var $mensaEntry, $mensaLink, $mensaList, $mensaView, $topContent, $topList, $topPage, bla, mensa_essen_list, mensa_id, mensa_name, _ref, _ref2, _results;
    $topPage = $('<div data-role="page" id="mensalist">\
    <div data-role="header">\
      <h1>Mensen</h1>\
      <a href="#options" data-icon="gear" class="ui-btn-right">Options</a>\
    </div>');
    $topContent = $('<div data-role="content">');
    $topList = $('<ul>', {
      title: "Mensen",
      id: "top",
      "data-role": "listview",
      "data-theme": "a"
    });
    _ref = speiseplan.mensen;
    for (mensa_name in _ref) {
      bla = _ref[mensa_name];
      mensa_id = mensa_str_to_id(mensa_name);
      $mensaEntry = $('<li>', {
        id: "" + mensa_id + "_link",
        "class": "mensa_link"
      });
      $mensaLink = $('<a>', {
        href: "#" + mensa_id,
        text: mensa_name
      });
      $mensaLink.appendTo($mensaEntry);
      $mensaEntry.appendTo($topList);
    }
    $topList.appendTo($topContent).trigger("create");
    $topContent.appendTo($topPage);
    if ($("#mensalist").length) {
      $("#mensalist").replaceWith($topPage);
    } else {
      $topPage.appendTo($updatedView);
    }
    _ref2 = speiseplan.mensen;
    _results = [];
    for (mensa_name in _ref2) {
      mensa_essen_list = _ref2[mensa_name];
      mensa_id = mensa_str_to_id(mensa_name);
      $mensaView = $("<div data-role=\"page\" id=\"" + mensa_id + "\" data-add-back-btn=\"true\">      <div data-role=\"header\"><h1>" + mensa_name + "</h1></div>      <div data-role=\"content\">");
      $mensaList = $("<ul title=\"" + mensa_name + "\" data-role=\"listview\">");
      buildSpeiseLiView(mensa_essen_list, $mensaList);
      $mensaList.appendTo($mensaView);
      if ($("#" + mensa_id).length) {
        console.log("replacing page " + mensa_id);
        _results.push($("#" + mensa_id).replaceWith($mensaView));
      } else {
        console.log("appending page " + mensa_id);
        _results.push($mensaView.appendTo($updatedView));
      }
    }
    return _results;
  };

  buildSpeiseLiView = function(mensa_essen_list, $view) {
    var $speiseDetailsView, $speisePriceView, $speiseTitleView, $speiseView, group, price, speise, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = mensa_essen_list.length; _i < _len; _i++) {
      speise = mensa_essen_list[_i];
      $speiseView = $('<li>');
      $speiseTitleView = $('<h3>', {
        text: speise.name
      });
      $speiseDetailsView = $('<p>', {
        text: speise.zutaten.join(", ")
      });
      $speisePriceView = $('<p class="ui-li-aside">' + ((function() {
        var _ref, _results2;
        _ref = speise.prices;
        _results2 = [];
        for (group in _ref) {
          price = _ref[group];
          _results2.push("" + group + ": " + price);
        }
        return _results2;
      })()).join("<br />") + '</p>');
      $speiseTitleView.appendTo($speiseView);
      $speiseDetailsView.appendTo($speiseView);
      $speisePriceView.appendTo($speiseView);
      _results.push($speiseView.appendTo($view));
    }
    return _results;
  };

  loadSpeiseplan = function(xml) {
    var $items;
    console.log("Loading Speiseplan ...");
    speiseplan.date = $(xml).find("pubDate").text();
    $items = $(xml).find('item');
    return $items.each(function(i, elem) {
      var details_url, mensa_str;
      mensa_str = $(this).find("author").text();
      details_url = $(this).find("link").text();
      speiseplan.mensen[mensa_str] = [];
      console.log("Parsing url " + i + " of " + $items.length);
      return parseDetailsUrl(details_url, {
        mensa_name: mensa_str,
        num_queries: $items.length
      });
    });
  };

  parseDetailsUrl = function(details_url, mensa_context) {
    return $.ajax({
      url: details_url,
      context: mensa_context,
      success: detailsGetReady,
      type: "GET",
      dataType: "xml",
      contentType: "text/html"
    });
  };

  detailsGetReady = function(data) {
    var essen, price_str, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    price_str = (_ref = (_ref2 = $("div#preise", data)) != null ? (_ref3 = _ref2.text()) != null ? _ref3.replace(/Preise\[.*\]\s*:/, "").strip() : void 0 : void 0) != null ? _ref : "nf";
    essen = {
      name: (_ref4 = $("div#speiseplanessentext", data).text()) != null ? _ref4 : "nf",
      mensa: this.mensa_name,
      img_full_url: (_ref5 = ((_ref6 = $("a#essenfoto", data)) != null ? _ref6.attr("href") : void 0) != null) != null ? _ref5 : "nf",
      img_thumb_url: (_ref7 = ((_ref8 = $("a#essenfoto", data)) != null ? (_ref9 = _ref8.find("img")) != null ? _ref9.attr("src") : void 0 : void 0) != null) != null ? _ref7 : "nf",
      prices: parse_prices(price_str),
      zutaten: []
    };
    $("ul.speiseplaninfos", data).each(function() {
      return $("li", this).each(function() {
        return essen.zutaten.push($(this).text());
      });
    });
    speiseplan.mensen[this.mensa_name].push(essen);
    ajax_count_completed++;
    updateProgress(ajax_count_completed, this.num_queries);
    if (this.num_queries === ajax_count_completed) {
      updateView();
      updateModel();
      $('#mensalist').on("pagebeforeshow", checkForNewView);
      return $.mobile.changePage('#mensalist');
    }
  };

  parse_prices = function(price_str) {
    var group, k, price, price_offer, price_offer_greece, prices, vals, _i, _len, _ref;
    prices = {};
    if (/ausverkauft/.test(price_str)) {
      return {
        0: -1
      };
    }
    if (price_str !== "") {
      k = 0;
      _ref = price_str.split(/\€(?!$)/g);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        price_offer = _ref[_i];
        price_offer_greece = price_offer.replace(/€/g, "").strip();
        vals = price_offer_greece.strip().split(":");
        if ((vals != null) && vals.length > 1) {
          group = vals[0], price = vals[1];
          prices[group.strip()] = price.strip().replace(/,/, ".");
        } else {
          prices["" + k] = price_offer_greece.replace(/\//gm, "").replace(/,/gm, ".").strip();
        }
        k++;
      }
    }
    return prices;
  };

  mensa_str_to_id = function(mensa_str) {
    return mensa_str.replace(/\s+/, "-");
  };

  updateProgress = function(have, full) {
    return $("#progress").text(Math.round((have / full) * 100));
  };

  loadSettings = function() {
    return settings = $.jStorage.get("settings", defaultsettings);
  };

  saveSettings = function() {
    return $.jStorage.set("settings", settings);
  };

  setupOptionScreen = function() {
    $('#options #viewslider').on("change", viewSliderChange);
    return updateOptionScreenWithSettings();
  };

  updateOptionScreenWithSettings = function() {
    $('#options #viewslider #flat').attr("selected", settings.flatview);
    return $('#options #viewslider #nested').attr("selected", !settings.flatview);
  };

  viewSliderChange = function(event) {
    var newval;
    newval = $(event.currentTarget).find("flat").attr("selected");
    console.log("change!" + newval);
    settings.flatview = newval;
    saveSettings();
    return settingschanged = true;
  };

  checkForNewView = function(event) {
    if (settingschanged) updateView();
    return settingschanged = false;
  };

}).call(this);
