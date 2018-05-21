{$, $$, $$$, ScrollView} = require 'atom-space-pen-views'
$el = require 'laconic'
track = require '../services/track'
moment = require 'moment'
{Emitter} = require 'atom'
fs = require 'fs'
MenuView = null
BottomView = null
path = null
util = null
Sortable = null
pluginManager = null
fileService = null
log = null
_ = null
config = require '../services/imdone-config'
envConfig = require '../../config'
# #BACKLOG: Add keen stats for features gh:240 id:89

module.exports =
class ImdoneAtomView extends ScrollView

  class PluginViewInterface extends Emitter
    constructor: (@imdoneView)->
      super()
    emitter: -> @ # CHANGED: deprecated! gh:245 id:74
    selectTask: (id) ->
      @imdoneView.selectTask id
    showPlugin: (plugin) ->
      return unless plugin.getView
      @imdoneView.bottomView.showPlugin plugin

  initialize: ->
    super
    @zoom config.getSettings().zoomLevel
    # imdone icon stuff
    svgPath = path.join config.getPackagePath(), 'images', 'icons.svg'
    fs.readFile svgPath, (err, data) =>
      return if err
      @$svg.html data.toString()

  constructor: ({@imdoneRepo, @path, @uri}) ->
    super
    util = require 'util'
    Sortable = require 'sortablejs'
    pluginManager = require '../services/plugin-manager'
    fileService = require '../services/file-service'
    log = require '../services/log'
    _ = require 'lodash'
    require('./jq-utils')($)

    @title = "#{path.basename(@path)} Tasks"
    @plugins = {}

    @handleEvents()

    @imdoneRepo.fileStats (err, files) =>
      @numFiles = files.length
      @messages.append "<p>Found #{files.length} files in #{path.basename(@path)}</p>"

      if @numFiles > config.getSettings().maxFilesPrompt
        @ignorePrompt.show()
      else
        @messages.append "<p>Looking for TODO's with the following tokens:</p> <p>#{@imdoneRepo.config.code.include_lists.join('<br/>')}</p>"
        @initImdone()

  serialize: ->
    deserializer: 'ImdoneAtomView'
    path: @path
    uri: @uri

  zoom: (dir) ->
    zoomable = @find '.zoomable'
    return zoomable.css 'zoom', dir if typeof dir is 'number'
    zoomVal = new Number(zoomable.css 'zoom')
    zoomVal = if dir == 'in' then zoomVal+.05 else zoomVal-.05
    console.log zoomVal
    zoomable.css 'zoom', zoomVal

  @content: (params) ->
    MenuView = require './menu-view'
    BottomView = require './bottom-view'
    path = require 'path'
    @div tabindex: -1, class: 'imdone-atom pane-item', =>
      @div outlet: '$svg'
      @div outlet: 'loading', class: 'imdone-loading', =>
        @h1 "Scanning files in #{path.basename(params.path)}."
        @p "Get ready for awesome!!!"
        @div outlet: 'messages', class: 'imdone-messages'

        @div outlet: 'ignorePrompt', class: 'ignore-prompt', style: 'display: none;', =>
          @h2 class:'text-warning', "Help!  Don't make me crash!"
          @p "Too many files make me bloated.  Ignoring files and directories in .imdoneignore can make me feel better."
          @div class: 'block', =>
            @button click: 'openIgnore', class:'inline-block-tight btn btn-primary', "Edit .imdoneignore"
            @button click: 'initImdone', class:'inline-block-tight btn btn-warning', "Who cares, keep going"
        @div outlet: 'progressContainer', style: 'display:none;', =>
          @progress class:'inline-block', outlet: 'progress', max:100, value:1
      @div outlet: 'error', class: 'imdone-error'
      @div outlet: 'mask', class: 'mask', =>
        @div class: 'spinner-mask'
        @div class: 'spinner-container', =>
          @div class: 'spinner', =>
            @p outlet: 'spinnerMessage'
            @p =>
              @span class:'loading loading-spinner-small inline-block'
      @div outlet:'mainContainer', class:'imdone-main-container', =>
        @div outlet: 'appContainer', class:'imdone-app-container', =>
          @subview 'menuView', new MenuView(params)
          @div outlet: 'boardWrapper', class: 'imdone-board-wrapper native-key-bindings', =>
            # @div outlet: 'messages', "HAHAH"
            @div outlet: 'board', class: 'imdone-board zoomable'
          @div outlet: 'configWrapper', class:'imdone-config-wrapper', =>
            @subview 'bottomView', new BottomView(params)

  getTitle: -> @title

  getIconName: -> "checklist"

  getURI: -> @uri

  addRepoListeners: ->
    return if @listenersInitialized
    repo = @imdoneRepo
    emitter = @emitter
    handlers = {}
    handle = (event) ->
      (data) -> emitter.emit event, data
    events = ['list.modified', 'project.not-found', 'project.removed', 'project.found', 'product.linked',
      'product.unlinked', 'tasks.updated', 'tasks.syncing', 'sync.error', 'initialized', 'file.update', 'tasks.moved',
      'config.update', 'config.loaded', 'error', 'file.read', 'sync.percent', 'connector.enabled', 'authenticated', 'unauthenticated',
      'authentication-failed', 'unavailable']

    for event in events
      handler = handlers[event] = handle event
      repo.on event, handler

    @removeAllRepoListeners = () ->
      repo.removeListener(event, handlers[event]) for event in events
    @listenersInitialized = true

  handleEvents: ->
    repo = @imdoneRepo
    @emitter = @viewInterface = new PluginViewInterface @
    @addRepoListeners()
    @menuView.handleEvents @emitter
    @bottomView.handleEvents @emitter

    @emitter.on 'authentication-failed', ({status, retries}) =>
      @hideMask() if status == "unavailable" && retries
      #console.log "auth-failed" if status == "failed"

    @emitter.on 'authenticated', (user) =>
      track.send 'authenticated', user
      pluginManager.init()

    @emitter.on 'unavailable', =>
      @hideMask()
      atom.notifications.addInfo "#{envConfig.name} is unavailable", detail: "Click login in an imdone tab to try again.", dismissable: true, icon: 'alert'


    # @emitter.on 'tasks.syncing', => @showMask "Syncing with #{envConfig.name}..."

    @emitter.on 'sync.error', => @hideMask()

    @emitter.on 'tasks.updated', (tasks) =>
      @onRepoUpdate(tasks) # TODO: For UI performance only update the lists that have changed. +enhancement gh:205 id:83

    @emitter.on 'initialized', =>
      @addPlugin(Plugin) for Plugin in pluginManager.getAll()
      @onRepoUpdate @imdoneRepo.getTasks()

    @emitter.on 'list.modified', (list) =>
      @onRepoUpdate @imdoneRepo.getTasksInList(list)

    @emitter.on 'file.update', (file) =>
      #console.log 'file.update: %s', file && file.getPath()
      @onRepoUpdate(file.getTasks()) if file.getPath()

    @emitter.on 'tasks.moved', (tasks) =>
      console.log 'tasks.moved', tasks
      @destroySortables()
      for task in tasks
        do (task) =>
          taskEl = @board.find(".task##{task.id}")
          return taskEl.remove() if @imdoneRepo.config.ignoreList(task.list)
          @replaceTasksInList(task.list)
          @replaceTasksInList(task.oldList)
      @makeTasksSortable()
      @hideMask()
      # @onRepoUpdate(tasks) # TODO: For performance maybe only update the lists that have changed gh:259 id:98

    @emitter.on 'config.update', =>
      #console.log 'config.update'
      repo.refresh()

    @emitter.on 'error', (mdMsg) => atom.notifications.addWarning "OOPS!", description: mdMsg, dismissable: true, icon: 'alert'

    @emitter.on 'task.modified', (task) => @onRepoUpdate()

    @emitter.on 'menu.toggle', =>
      @boardWrapper.toggleClass 'shift'

    @emitter.on 'filter', (text) =>
      @filter text

    @emitter.on 'filter.clear', =>
      @board.find('.task a[href^="#filter/"]').removeClass('inline-block highlight-info')
      @board.find('.task').show()

    @emitter.on 'visible.open', =>
      paths = {}
      for task in @visibleTasks()
        file = @imdoneRepo.getFileForTask(task)
        fullPath = @imdoneRepo.getFullPath file
        paths[fullPath] = task.line

      track.send 'openVisible', paths
      numFiles = _.keys(paths).length
      if numFiles < 5 || window.confirm "imdone is about to open #{numFiles} files.  Continue?"
        for fpath, line of paths
          #console.log fpath, line
          @openPath fpath, line

    @emitter.on 'tasks.delete', =>
      visibleTasks = @imdoneRepo.visibleTasks()
      return unless visibleTasks
      return unless window.confirm "imdone is about to delete #{visibleTasks.length} tasks.  Continue?"
      @showMask "deleting #{visibleTasks.length} tasks"
      @imdoneRepo.deleteVisibleTasks (err) ->
        @hideMask()

    @emitter.on 'readme.open', =>
      file = @imdoneRepo.getReadme()
      unless file
        @emitter.emit 'error', 'Sorry no readme :('
        return
      else
        @openPath @imdoneRepo.getFullPath(file)

    @emitter.on 'config.close', =>
      @boardWrapper.removeClass 'shift-bottom'
      @boardWrapper.css 'bottom', ''
      @clearSelection()

    @emitter.on 'config.open', =>
      @boardWrapper.addClass 'shift-bottom'

    @emitter.on 'resize.change', (height) =>
      @boardWrapper.css('bottom', height + 'px')

    @emitter.on 'zoom', (dir) => @zoom dir

    @on 'click', '.move-up', (e) =>
      id = e.target.dataset.id
      task = @imdoneRepo.getTask id
      list = task.list
      pos = 0
      taskEl = $(e.target).closest('.task')
      taskEl.closest('.tasks').prepend(taskEl)
      @showMask "Moving Tasks"
      track.send 'move', {task,list,pos}
      @imdoneRepo.moveTasks [task], list, pos

    @on 'click', '.move-down', (e) =>
      id = e.target.dataset.id
      task = @imdoneRepo.getTask id
      list = task.list
      pos = @imdoneRepo.getTasksInList(list).length
      taskEl = $(e.target).closest('.task')
      taskEl.closest('.tasks').append(taskEl)
      @showMask "Moving Tasks"
      track.send 'move', {task,list,pos}
      @imdoneRepo.moveTasks [task], list, pos

    @on 'click', '.source-link',  (e) =>
      link = e.target
      track.send 'source-link', {uri: link.dataset.uri, line: link.dataset.line}
      @openPath link.dataset.uri, link.dataset.line

      if config.getSettings().showNotifications && !$(link).hasClass('info-link')
        taskId = $(link).closest('.task').attr 'id'
        task = @imdoneRepo.getTask taskId
        file = @imdoneRepo.getFileForTask(task)
        fullPath = @imdoneRepo.getFullPath file
        line = task.line
        newLink = $(link.cloneNode(true));
        newLink.addClass 'info-link'
        description = "#{task.text}\n\n#{newLink[0].outerHTML}"

        atom.notifications.addInfo task.list, description: description, dismissable: true, icon: 'check'

    @on 'click', '.list-name', (e) =>
      name = e.target.dataset.list
      @bottomView.editListName(name)

    @on 'click', '.delete-list', (e) =>
      e.stopPropagation()
      e.preventDefault()
      target = e.target
      name = target.dataset.list || target.parentElement.dataset.list
      repo.removeList(name)

    @on 'click', '[href^="#filter/"]', (e) =>
      target = e.target
      target = target.closest('a') unless (target.nodeName == 'A')
      e.stopPropagation()
      e.preventDefault()
      filterAry = target.getAttribute('href').split('/');
      filterAry.shift()
      filter = filterAry.join '/' ;
      @setFilter filter

    @on 'change', 'ul.checklist>li>input[type=checkbox]', (e) =>
      target = e.target
      $task = target.closest('.task')
      taskId = $task.id
      items = $task.querySelectorAll('.task-description .checklist-item')
      [].forEach.call items, (el) ->
        if (el.checked) then el.setAttribute('checked', true) else el.removeAttribute('checked')
      repo.modifyTaskFromHtml repo.getTask(taskId), $task.querySelector('.task-text').innerHTML

    pluginManager.emitter.on 'plugin.added', (Plugin) =>
      if (repo.getConfig())
        @addPlugin(Plugin)
      else
        @emitter.on 'initialized', => @addPlugin(Plugin)

    pluginManager.emitter.on 'plugin.removed', (Plugin) => @removePlugin Plugin

    @emitter.on 'connector.disabled', (connector) => @removePluginByProvider connector.name
    @emitter.on 'connector.enabled', (connector) => @addPluginByProvider connector.name
    @emitter.on 'product.unlinked', (product) => @removePluginByProvider product.name
    @emitter.on 'connector.changed', (product) =>
      @addPluginByProvider product.connector.name
      for name, plugin of @plugins
        plugin.setConnector product.connector if plugin.constructor.provider == product.name

    @emitter.on 'logoff', => pluginManager.removeDefaultPlugins()
    @emitter.on 'project.removed', => pluginManager.removeDefaultPlugins()


  addPluginButtons: ->
    @addPluginTaskButtons()
    @addPluginProjectButtons()

  addPluginTaskButtons: ->
    @board.find('.imdone-task-plugins').empty()
    return unless @hasPlugins()
    plugins = @plugins
    @board.find('.task').each ->
      $task = $(this)
      $taskPlugins = $task.find '.imdone-task-plugins'
      id = $task.attr('id')
      for name, plugin of plugins
        if typeof plugin.taskButton is 'function'
          $button = plugin.taskButton(id)
          if $button
            if $button.classList
              $button.classList.add 'task-plugin-button'
            else $button.addClass 'task-plugin-button'
            $taskPlugins.append $button

  addPluginProjectButtons: -> @menuView.addPluginProjectButtons @plugins

  addPluginView: (plugin) ->
    return unless plugin.getView
    @bottomView.addPlugin plugin

  initPluginView: (plugin) ->
    @addPluginButtons()
    @addPluginView plugin

  addPlugin: (Plugin) ->
    return unless Plugin
    @imdoneRepo.getProduct Plugin.provider, (err, product) =>
      return if err || (product && !product.isEnabled())
      connector = product && product.connector
      if @plugins[Plugin.pluginName]
        @addPluginButtons()
      else
        plugin = new Plugin @imdoneRepo, @viewInterface, connector
        @plugins[Plugin.pluginName] = plugin
        @imdoneRepo.addPlugin plugin
        if plugin instanceof Emitter
          if plugin.isReady()
            @initPluginView plugin
          else
            plugin.on 'ready', => @initPluginView plugin
        else
          @initPluginView plugin

  addPluginByProvider: (provider) ->
    @addPlugin pluginManager.getByProvider(provider)

  removePlugin: (Plugin) ->
    return unless Plugin
    plugin = @plugins[Plugin.pluginName]
    @imdoneRepo.removePlugin plugin
    @bottomView.removePlugin plugin if plugin && plugin.getView
    delete @plugins[Plugin.pluginName]
    @addPluginButtons()

  removePluginByProvider: (provider) ->
    @removePlugin pluginManager.getByProvider(provider)

  hasPlugins: ->
    Object.keys(@plugins).length > 0

  setFilter: (text) ->
    @menuView.setFilter text
    @menuView.openMenu()
    @boardWrapper.addClass 'shift'

  getFilter: -> @menuView.getFilter()

  showTasks: (tasks) ->
    @board.find("##{task.id}").show() for task in tasks
    @emitter.emit 'board.update'
    @hideMask()

  filter: (text) ->
    text = @getFilter() unless text
    if text == ''
      @showTasks(@imdoneRepo.getTasks())
    else
      @showMask()
      @board.find('.task').hide()
      @board.find('.task a[href^="#filter/"]').removeClass('inline-block highlight-info')
      try @board.find(".task a[href='#filter/#{text}']").addClass('inline-block highlight-info')
      catch e then console.error(e)
      tasks = @imdoneRepo.query text
      track.send 'filter', {text, tasks: tasks.length} unless text == @lastFilter
      lists = _.uniq(tasks.map (task) -> task.list).sort()
      if JSON.stringify(@shownLists) is JSON.stringify(lists)
        @showTasks(tasks)
      else
        @shownLists = lists
        @board.find('.list').hide()
        for list in @imdoneRepo.getLists()
          list.hidden = !lists.includes(list.name) && !list.ignore
        @imdoneRepo.saveConfig()
    @lastFilter = text

  visibleTasks: (listName) ->
    return [] unless @imdoneRepo
    @imdoneRepo.visibleTasks listName

  initImdone: () ->
    if @imdoneRepo.initialized
      @onRepoUpdate(@imdoneRepo.getTasks())
      @menuView.updateMenu()
      @imdoneRepo.initProducts()
      return
    if @numFiles > 1000
      @ignorePrompt.hide()
      @progressContainer.show()
      @emitter.on 'file.read', (data) =>
        complete = Math.ceil (data.completed/@numFiles)*100
        @progress.attr 'value', complete
    @imdoneRepo.init()

  openIgnore: () ->
    ignorePath = path.join(@imdoneRepo.path, '.imdoneignore')
    item = @
    atom.workspace.open(ignorePath, split: 'left').then =>
      item.destroy()

  onRepoUpdate: (tasks) ->
    # BACKLOG: This should be queued so two updates don't colide gh:241 id:90
    @imdoneRepo.transformTasks tasks, (err, tasks) =>
      @updateBoard(tasks)
      @boardWrapper.css 'bottom', 0
      @bottomView.attr 'style', ''
      @loading.hide()
      @mainContainer.show()
      @hideMask()

  showMask: (msg)->
    @spinnerMessage.html msg if msg
    @mask.show()

  hideMask: -> @mask.hide() if @mask

  genFilterLink: (opts) ->
    $link = $el.a href:"#filter/#{opts.filter}", title: "just show me tasks with #{opts.linkText}",
      $el.span class: opts.linkClass, opts.linkText
    $link
  # DOING: Use web components or vuejs to make the UI more testable and portable. +enhancement gh:297 id:75 ic:gh
  # - Create a task component
  # - Write task component tests
  # - Use the new component in the UI
  getTask: (task) =>
    self = @;
    repo = @imdoneRepo
    contexts = task.getContext()
    index = repo.getTaskIndex(task)
    listLength = repo.getTasksInList(task.list).length
    tags = task.getTags()
    $taskText = $el.div class: 'task-text native-key-bindings'
    $filters = $el.div class: 'task-filters'
    $taskMetaTable = $el.table()
    $taskMeta = $el.div class: 'task-meta', $taskMetaTable
    opts = $.extend {}, {stripMeta: true, sanitize: true}, repo.getConfig().marked
    taskHtml = task.getHtml(opts)
    showTagsInline = config.getSettings().showTagsInline
    if showTagsInline
      if contexts
        for context, i in contexts
          do (context, i) =>
            $link = @genFilterLink linkText: context, filter: "or(contains(context,#{context}),contains(frontMatter.context,#{context}))", linkClass: "task-context"
            taskHtml = taskHtml.replace( "@#{context}", $el.div($link).innerHTML )

      if tags
        for tag, i in tags
          do (tag, i) =>
            $link = @genFilterLink linkText: tag, filter:"or(contains(tags,#{tag}),contains(frontMatter.tags,#{tag}))", linkClass: "task-tags"
            taskHtml = taskHtml.replace( "+#{tag}", $el.div($link).innerHTML )
    else
      taskHtml = task.getHtml $.extend({stripTags: true, stripContext: true}, opts)
      if contexts
        $div = $el.div()
        $filters.appendChild $div
        for context, i in contexts
          do (context, i) =>
            $div.appendChild(self.genFilterLink linkText: context, filter:"or(contains(context,#{context}),contains(frontMatter.context,#{context}))", linkClass: "task-context")
            $div.appendChild($el.span ", ") if (i < contexts.length-1)
      if tags
        $div = $el.div()
        $filters.appendChild $div
        for tag, i in tags
          do (tag, i) =>
            $div.appendChild(self.genFilterLink linkText: tag, filter:"or(contains(tags,#{tag}),contains(frontMatter.tags,#{tag}))", linkClass: "task-tags")
            $div.appendChild($el.span ", ") if (i < tags.length-1)

    $taskText.innerHTML = taskHtml

    for data in task.getMetaDataWithLinks(repo.getConfig())
      do (data) =>
        value = data.value
        value = moment(data.value).format('llll') if data.key in ['due', 'remind', 'created', 'completed']
        $icons = $el.td()
        if data.link
          $link = $el.a href: data.link.url, title: data.link.title,
            $el.span class:"icon #{data.link.icon || 'icon-link-external'}"
          $icons.appendChild $link
        filter = "or(contains(meta.#{data.key},string:#{encodeURIComponent(data.value)}),contains(frontMatter.meta.#{data.key},string:#{encodeURIComponent(data.value)}))"
        $filterLink = $el.a href:"#filter/#{filter}", title: "just show me tasks with #{data.key}:#{data.value}",
          $el.span class:"icon icon-light-bulb"
        $icons.appendChild $filterLink

        $tr = $el.tr class:'meta-data-row', 'data-key': data.key, 'data-value': data.value,
          $el.td data.key
          $el.td value
          $icons
        $taskMetaTable.appendChild $tr

    filter = "source.path=#{encodeURIComponent(task.source.path)}"
    $el.li class: 'task well native-key-bindings', id: "#{task.id}", tabindex: -1, "data-path": task.source.path, "data-line": task.line,
      $el.div class: 'imdone-task-plugins-wrapper',
        $el.span class:"icon icon-three-bars drag-handle pull-left"
        $el.span class:"sequence-buttons pull-left",
          unless index == 0
            $el.a href: '#', class:"icon icon-move-up move-up pull-left", "data-id": task.id, title: "Move to top"
          unless index == listLength-1
            $el.a href: '#', class:"icon icon-move-down move-down pull-left" , "data-id": task.id, title: "Move to bottom"
        $el.span class: 'imdone-task-plugins'
      $el.div class: 'task-full-text hidden', task.getTextAndDescription()
      $taskText
      $filters
      $taskMeta
      $el.div class: 'task-source',
        $el.a href: '#', class: 'source-link', title: 'take me to the source', 'data-uri': "#{repo.getFullPath(task.source.path)}", 'data-line': task.line, "#{task.source.path + ':' + task.line}"
        $el.span ' | '
        $el.a href:"#filter/#{filter}", title: "just show me tasks in #{task.source.path}",
          $el.span class:"icon icon-light-bulb"

  getList: (list) =>
    self = @
    repo = @imdoneRepo
    tasks = repo.getTasksInList(list.name)
    $list = $$ ->
      @div class: 'top list well', 'data-name': list.name, =>
        @div class: 'list-name-wrapper well', =>
          @div class: 'list-name', 'data-list': list.name, title: "I don't like this name", =>
            @raw list.name
            if (tasks.length < 1)
              @a href: '#', title: "delete #{list.name}", class: 'delete-list', "data-list": list.name, =>
                @span class:'icon icon-trashcan'
        if (list.ignore)
          @div class:'ignored-list-message text-center', =>
            @raw "Cards dropped here will be ignored by imdone."
        @ol class: 'tasks', "data-list":"#{list.name}"
    $tasks = $list.find('.tasks')
    $tasks.append(self.getTask task) for task in tasks
    $list

  replaceTasksInList: (list) ->
    imdoneRepo = @imdoneRepo
    getTask = @getTask
    listEl = @board.find(".list[data-name='#{list}'] .tasks")
    listEl.find('.task:visible').each () ->
      taskEl = $(this)
      task = imdoneRepo.getTask(taskEl[0].id)
      taskEl.replaceWith(getTask(task))

  listOnBoard: (name) -> @board.find ".list[data-name='#{name}'] ol.tasks"

  addListToBoard: (name) ->
    position = _.findIndex @imdoneRepo.getLists(), name: name
    list = _.find @imdoneRepo.getLists(), name: name
    @board.find(".list:eq(#{position})").after(@getList list)

  addTaskToBoard: (task) ->
    @listOnBoard(task.list).prepend @getTask task

  addTasksToBoard: (tasks) ->
    lists = _.groupBy tasks, 'list'
    for listName, listOfTasks of lists
      if @listOnBoard(listName).length == 0
        @addListToBoard listName
      else @addTaskToBoard task for task in listOfTasks

  updateTasksOnBoard: (tasks) ->
    return false if tasks.length == 0
    return false if tasks.length == @imdoneRepo.getTasks().length
    self = @
    @destroySortables()
    tasksByList = _.groupBy tasks, 'list'
    if _.keys(tasksByList).length == 1
      listName = tasks[0].list
      self.board.find(".list[data-name='#{listName}']").remove()
      @addTasksToBoard @imdoneRepo.getTasksInList(listName)
    else
      # Update tasks by file
      files = _.uniq(_.map tasks, 'source.path')
      tasksInFiles = []
      for file in files
        # Remove Tasks for each file by data-path attribute
        @board.find("li[data-path='#{file}']").remove()
        # Add tasks from all files...
        tasksInFiles = tasksInFiles.concat @imdoneRepo.getFile(file).getTasks()
      @addTasksToBoard tasksInFiles
    # remove lists that are hidden
    @board.find('.list').each ->
      $list = $(this)
      listName = $list.attr 'data-name'
      $list.remove() unless self.imdoneRepo.isListVisible listName
    @addPluginButtons()
    @makeTasksSortable()
    @hideMask()
    @emitter.emit 'board.update'


  # BACKLOG: Split this apart into it's own class to simplify. Call it BoardView +refactor gh:246 id:84
  updateBoard: (tasks) ->
    self = @
    @destroySortables()
    @board.empty().hide()
    repo = @imdoneRepo
    repo.$board = @board
    lists = repo.getVisibleLists()
    width = 378*lists.length + "px"
    @board.css('width', width)
    @board.append (=> @getList list for list in lists)
    @addPluginButtons()
    @filter()
    @board.show()
    @hideMask()
    @makeTasksSortable()
    @emitter.emit 'board.update'

  destroySortables: ->
    if @tasksSortables
      for sortable in @tasksSortables
        sortable.destroy() if sortable.el

  makeTasksSortable: ->
    opts =
      draggable: '.task'
      group: 'tasks'
      sort: true
      ghostClass: 'imdone-ghost'
      scroll: @boardWrapper[0]
      handle: '.drag-handle'
      onEnd: (evt) =>
        id = evt.item.id
        pos = evt.newIndex
        list = evt.item.parentNode.dataset.list
        task = @imdoneRepo.getTask id
        @showMask "Moving Tasks"
        track.send 'move', {task,list,pos}
        @imdoneRepo.moveTasks [task], list, pos

    @tasksSortables = tasksSortables = []
    @find('.tasks').each ->
      tasksSortables.push(Sortable.create $(this).get(0), opts)

  destroy: ->
    @removeAllRepoListeners()
    @remove()
    @emitter.emit 'did-destroy', @
    @emitter.dispose()

  onDidDestroy: (callback) ->
    @emitter.on 'did-destroy', callback

  openPath: (filePath, line) ->
    return unless filePath

    fileService.openFile @path, filePath, line, (success) =>
      return if success
      atom.workspace.open(filePath, split: 'left').then =>
        @moveCursorTo(line) if line

  moveCursorTo: (lineNumber) ->
    lineNumber = parseInt(lineNumber)

    if textEditor = atom.workspace.getActiveTextEditor()
      position = [lineNumber-1, 0]
      textEditor.setCursorBufferPosition(position, autoscroll: false)
      textEditor.scrollToCursorPosition(center: true)

  selectTask: (id) ->
    @clearSelection()
    @board.find(".task##{id}").addClass 'selected'

  clearSelection: ->
    @board.find('.task').removeClass 'selected'
