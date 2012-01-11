(function() {
  var detailsGetReady, loadSpeiseplan, mensa_str_to_id, parseDetailsUrl, parse_prices, speiseplan, updateModel, updateView;

  speiseplan = null;

  String.prototype.strip = function() {
    return this.replace(/(^\s+)|(\s+$)/gm, "").replace(/(\r|\n|r\n)/gm, "");
  };

  $(document).ready(function() {
    return $('#dynamicPage').on("pageinit", function() {
      speiseplan = {
        date: "",
        mensen: {}
      };
      console.log("getting feed ...");
      return $.get("http://www.studentenwerk-dresden.de/feeds/speiseplan.rss", loadSpeiseplan);
    });
  });

  updateModel = function() {};

  updateView = function() {
    var $updatedView, bla, group, mensaEntry, mensaLink, mensaView, mensa_essen_list, mensa_id, mensa_name, price, speise, speiseView, topView, _i, _len, _ref, _ref2, _results;
    $updatedView = $('<body>');
    topView = $('<div data-role="page">\
    <div data-role="header">\
      <h1>Mensen</h1>\
    </div>\
    <div data-role="content">\
      <ul title="Mensen" id="top" selected="true" data-role="listview" data-theme="a">');
    _ref = speiseplan.mensen;
    for (mensa_name in _ref) {
      bla = _ref[mensa_name];
      mensa_id = mensa_str_to_id(mensa_name);
      mensaEntry = $('<li>', {
        id: "" + mensa_id + "_link",
        "class": "mensa_link"
      });
      mensaLink = $('<a>', {
        href: "#" + mensa_id,
        text: mensa_name
      });
      mensaLink.appendTo(mensaEntry);
      mensaEntry.appendTo(topView);
    }
    topView.appendTo($updatedView).trigger("create");
    _ref2 = speiseplan.mensen;
    _results = [];
    for (mensa_name in _ref2) {
      mensa_essen_list = _ref2[mensa_name];
      mensa_id = mensa_str_to_id(mensa_name);
      mensaView = $("<div data-role=\"page\" id=\"" + mensa_id + "\">      <div data-role=\"header\"><h1>" + mensa_name + "</h1></div>      <div data-role=\"content\">        <ul title=\"" + mensa_name + "\" data-role=\"listview\">");
      for (_i = 0, _len = mensa_essen_list.length; _i < _len; _i++) {
        speise = mensa_essen_list[_i];
        speiseView = $('<li>', {
          id: speise.name,
          "class": "speise",
          text: ("" + speise.name + " ") + ((function() {
            var _ref3, _results2;
            _ref3 = speise.prices;
            _results2 = [];
            for (group in _ref3) {
              price = _ref3[group];
              _results2.push("" + group + ": " + price);
            }
            return _results2;
          })()).join(", ")
        });
        speiseView.appendTo(mensaView).trigger("create");
      }
      _results.push(mensaView.appendTo($updatedView).trigger("create"));
    }
    return _results;
  };

  loadSpeiseplan = function(xml) {
    console.log("Loading Speiseplan ...");
    speiseplan.date = $(xml).find("pubDate").text();
    return $(xml).find('item').each(function() {
      var details_url, mensa_str;
      mensa_str = $(this).find("author").text();
      details_url = $(this).find("link").text();
      speiseplan.mensen[mensa_str] = [];
      console.log("Parsing url " + details_url + " for mensa " + mensa_str);
      return parseDetailsUrl(details_url, mensa_str);
    });
  };

  parseDetailsUrl = function(details_url, mensa_str) {
    return $.ajax({
      url: details_url,
      context: mensa_str,
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
      mensa: this,
      img_full_url: (_ref5 = ((_ref6 = $("a#essenfoto", data)) != null ? _ref6.attr("href") : void 0) != null) != null ? _ref5 : "nf",
      img_thumb_url: (_ref7 = ((_ref8 = $("a#essenfoto", data)) != null ? (_ref9 = _ref8.find("img")) != null ? _ref9.attr("src") : void 0 : void 0) != null) != null ? _ref7 : "nf",
      prices: parse_prices(price_str),
      zutaten: []
    };
    $("ul#speiseplaninfos", data).each(function() {
      return $("li", this).each(function() {
        return essen.zutaten.push($(this).text());
      });
    });
    speiseplan.mensen[this].push(essen);
    updateView();
    return updateModel();
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

}).call(this);
