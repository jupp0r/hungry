speiseplan = null
ajax_count_completed = 0
defaultsettings =
  flatview: true
settings = null
settingschanged = false

String::strip = ->
  @replace(/(^\s+)|(\s+$)/gm, "").replace /(\r|\n|r\n)/gm, ""

$(document).ready ->
  speiseplan =
    date: ""
    mensen: {}
  console.log "loading settings ..."
  loadSettings()
  console.log settings
  setupOptionScreen()
  console.log "getting feed ..."
  jQuery.ajax
    url: "http://www.studentenwerk-dresden.de/feeds/speiseplan.rss"
    success: loadSpeiseplan
    method: "GET"
    dataType: "xml"

# Update Model (sync with localstore)
updateModel = ->
  console.log speiseplan

# Update Main Page
updateView = ->
  $updatedView = $.mobile.pageContainer
  if settings.flatview
    buildFlatView $updatedView
  else
    buildNestedView $updatedView


buildFlatView = ($updatedView) ->
  $topPage = $ '<div data-role="page" id="mensalist">
    <div data-role="header">
      <h1>Speiseplan</h2>
      <a href="#options" data-icon="gear" class="ui-btn-right">Options</a>
    </div>'
  $topContent = $ '<div data-role="content">'
  $topList = $ '<ul>'
    title: "Speiseplan"
    id: "mainlist"
    "data-role": "listview"
    "data-inset": true
  for mensa_name, mensa_essen_list of speiseplan.mensen
    $mensadivider = $ '<li>'
      "data-role": "list-divider"
      text: mensa_name
    $mensadivider.appendTo $topList
    buildSpeiseLiView mensa_essen_list, $topList
  console.log "bla"
  $topList.appendTo($topContent).trigger "create"
  $topContent.appendTo $topPage
  $topPage.appendTo $updatedView

buildNestedView = ($updatedView) ->
  $topPage = $ '<div data-role="page" id="mensalist">
    <div data-role="header">
      <h1>Mensen</h1>
      <a href="#options" data-icon="gear" class="ui-btn-right">Options</a>
    </div>'
  $topContent = $ '<div data-role="content">'
  $topList = $ '<ul>',
    title: "Mensen"
    id: "top"
    "data-role": "listview"
    "data-theme": "a"
  for mensa_name, bla of speiseplan.mensen
    mensa_id = mensa_str_to_id mensa_name
    $mensaEntry = $ '<li>'
      id: "#{mensa_id}_link"
      "class": "mensa_link"
    $mensaLink = $ '<a>'
      href: "##{mensa_id}"
      text: mensa_name
    $mensaLink.appendTo $mensaEntry
    $mensaEntry.appendTo $topList
  $topList.appendTo($topContent).trigger "create"
  $topContent.appendTo $topPage
  if $("#mensalist").length
    $("#mensalist").replaceWith $topPage
  else
    $topPage.appendTo $updatedView
  for mensa_name, mensa_essen_list of speiseplan.mensen
    mensa_id = mensa_str_to_id mensa_name
    $mensaView = $ "<div data-role=\"page\" id=\"#{mensa_id}\" data-add-back-btn=\"true\">
      <div data-role=\"header\"><h1>#{mensa_name}</h1></div>
      <div data-role=\"content\">"
    $mensaList = $ "<ul title=\"#{mensa_name}\" data-role=\"listview\">"
    buildSpeiseLiView mensa_essen_list, $mensaList
    $mensaList.appendTo $mensaView
    if $("##{mensa_id}").length
      console.log "replacing page #{mensa_id}"
      $("##{mensa_id}").replaceWith $mensaView
    else
      console.log "appending page #{mensa_id}"
      $mensaView.appendTo $updatedView

buildSpeiseLiView = (mensa_essen_list, $view) ->
  for speise in mensa_essen_list
      $speiseView = $ '<li>'
      $speiseTitleView = $ '<h3>'
        text: speise.name
      $speiseDetailsView = $ '<p>'
        text: speise.zutaten.join ", "
      $speisePriceView = $('<p class="ui-li-aside">' + ("#{group}: #{price}" for group, price of speise.prices).join("<br />") + '</p>')
      $speiseTitleView.appendTo $speiseView
      $speiseDetailsView.appendTo $speiseView
      $speisePriceView.appendTo $speiseView
      $speiseView.appendTo $view

# load speiseplan from Studentenwerk RSS Feed
loadSpeiseplan = (xml) ->
  console.log "Loading Speiseplan ..."
  speiseplan.date = $(xml).find("pubDate").text()
  $items = $(xml).find('item')
  $items.each (i, elem) ->
    mensa_str = $(@).find("author").text()
    details_url = $(@).find("link").text()
    speiseplan.mensen[mensa_str] = []
    console.log "Parsing url #{i} of #{$items.length}"
    parseDetailsUrl details_url,
      mensa_name: mensa_str
      num_queries: $items.length

parseDetailsUrl = (details_url, mensa_context) ->
  jQuery.ajax
    url: details_url
    context: mensa_context
    success: detailsGetReady
    type: "GET"
    dataType: "xml"
    contentType: "text/html"

detailsGetReady = (data) ->
  price_str = $("div#preise", data)?.text()?.replace(/Preise\[.*\]\s*:/, "").strip() ? "nf"
  essen =
    name: $("div#speiseplanessentext", data).text() ? "nf"
    mensa: @.mensa_name
    img_full_url: $("a#essenfoto", data)?.attr("href")? ? "nf"
    img_thumb_url: $("a#essenfoto", data)?.find("img")?.attr("src")? ? "nf"
    prices: parse_prices price_str
    zutaten: []
  $("ul.speiseplaninfos", data).each ->
    $("li", @).each ->
      essen.zutaten.push $(@).text()
  speiseplan.mensen[@.mensa_name].push essen
  ajax_count_completed++
  updateProgress ajax_count_completed, @.num_queries
  if @.num_queries == ajax_count_completed
    updateView()
    updateModel()
    $('#mensalist').on "pagebeforeshow", checkForNewView
    $.mobile.changePage '#mensalist'

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

updateProgress = (have, full) ->
  $("#progress").text(Math.round ((have / full) * 100))

loadSettings = ->
  settings = $.jStorage.get "settings", defaultsettings

saveSettings = ->
  $.jStorage.set "settings", settings

setupOptionScreen = ->
  $('#options #viewslider').on "change", viewSliderChange
  updateOptionScreenWithSettings()

updateOptionScreenWithSettings = ->
  $('#options #viewslider #flat').attr "selected", settings.flatview
  $('#options #viewslider #nested').attr "selected", not settings.flatview

viewSliderChange = (event) ->
  newval = $(event.currentTarget).find("flat").attr("selected")
  console.log "change!" + newval
  settings.flatview = newval
  saveSettings()
  settingschanged = true

checkForNewView = (event) ->
  updateView() if settingschanged
  settingschanged = false