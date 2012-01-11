speiseplan = null

String::strip = ->
  @replace(/(^\s+)|(\s+$)/gm, "").replace /(\r|\n|r\n)/gm, ""
$(document).ready ->
  $('#dynamicPage').on "pageinit", ->
    speiseplan =
      date: ""
      mensen: {}
    console.log "getting feed ..."
    $.get "http://www.studentenwerk-dresden.de/feeds/speiseplan.rss", loadSpeiseplan

updateModel = ->

updateView = ->
  $updatedView = $('<body>')
  topView = $ '<div data-role="page">
    <div data-role="header">
      <h1>Mensen</h1>
    </div>
    <div data-role="content">
      <ul title="Mensen" id="top" selected="true" data-role="listview" data-theme="a">'
  for mensa_name, bla of speiseplan.mensen
    mensa_id = mensa_str_to_id mensa_name
    mensaEntry = $ '<li>'
      id: "#{mensa_id}_link"
      "class": "mensa_link"
    mensaLink = $ '<a>'
      href: "##{mensa_id}"
      text: mensa_name
    mensaLink.appendTo mensaEntry
    mensaEntry.appendTo topView
  topView.appendTo($updatedView).trigger "create"

  for mensa_name, mensa_essen_list of speiseplan.mensen
    mensa_id = mensa_str_to_id mensa_name
    mensaView = $ "<div data-role=\"page\" id=\"#{mensa_id}\">
      <div data-role=\"header\"><h1>#{mensa_name}</h1></div>
      <div data-role=\"content\">
        <ul title=\"#{mensa_name}\" data-role=\"listview\">"
    for speise in mensa_essen_list
      speiseView = $ '<li>'
        id: speise.name
        "class": "speise"
        text: "#{speise.name} " + ("#{group}: #{price}" for group, price of speise.prices).join ", "
      speiseView.appendTo(mensaView).trigger "create"
    mensaView.appendTo($updatedView).trigger "create"

loadSpeiseplan = (xml) ->
  console.log "Loading Speiseplan ..."
  speiseplan.date = $(xml).find("pubDate").text()
  $(xml).find('item').each ->
    mensa_str = $(@).find("author").text()
    details_url = $(@).find("link").text()
    speiseplan.mensen[mensa_str] = []
    console.log "Parsing url #{details_url} for mensa #{mensa_str}"
    parseDetailsUrl details_url, mensa_str

parseDetailsUrl = (details_url, mensa_str) ->
  $.ajax
    url: details_url
    context: mensa_str
    success: detailsGetReady
    type: "GET"
    dataType: "xml"
    contentType: "text/html"

detailsGetReady = (data) ->
  price_str = $("div#preise", data)?.text()?.replace(/Preise\[.*\]\s*:/, "").strip() ? "nf"
  essen =
    name: $("div#speiseplanessentext", data).text() ? "nf"
    mensa: @
    img_full_url: $("a#essenfoto", data)?.attr("href")? ? "nf"
    img_thumb_url: $("a#essenfoto", data)?.find("img")?.attr("src")? ? "nf"
    prices: parse_prices price_str
    zutaten: []
  $("ul#speiseplaninfos", data).each ->
    $("li", @).each ->
      essen.zutaten.push $(@).text()
  speiseplan.mensen[@].push essen
  updateView()
  updateModel()

parse_prices = (price_str) ->
  prices = {}
  if /ausverkauft/.test price_str
    return {0:-1}
  if price_str != ""
    k = 0
    for price_offer in price_str.split /\€(?!$)/g
      price_offer_greece =  price_offer.replace(/€/g,"").strip()
      vals = price_offer_greece.strip().split ":"
      if vals? and vals.length > 1
        [group, price] = vals
        prices[group.strip()] = price.strip().replace /,/, "."
      else
        prices["#{k}"] = price_offer_greece.replace(/\//gm,"").replace(/,/gm,".").strip()
      k++
  prices

mensa_str_to_id = (mensa_str) ->
  mensa_str.replace /\s+/, "-"