Roadmap
----
- #BACKLOG: Add configuration editor view for .imdone/config.json id:138 gh:350 ic:gh
  - Use copy/modified version of [settings-view/settings-panel.coffee at master atom/settings-view](https://github.com/atom/settings-view/blob/master/lib/settings-panel.coffee)
- #TODO: As a user I would like to add content to my TODO descriptions from markdown templates stored in my project id:104 gh:322 ic:gh
  - [ ] Append templates to tasks with `t:<type>` metadata in them. (e.g. `t:story`)
    - [ ] if TODO appears in a single line comment, append template with single line comment prefix and the same indentation as the TODO comment
    - [ ] If TODO appears in a multiline comment, just append template at the same indentation as the TODO comment
    - [ ] Remove `t:story` after the template has been appended to the description
  - [x] templates.md will contain templates in the format...
  ```
  # <type>
  Any markdown for your template
  ```
- #DOING: Add analytics for user actions id:107 gh:328 ic:gh
  - [ ] Open board
  - [ ] Create list
  - [ ] add github issue
- #TODO: As a user I would like to clear the filter with the escape key so that I can be more productive with filtering. +story id:108 ic:gh gh:329
- #TODO: As a user I would like to save groups of visible lists so that I can have multiple process flows in a single project. id:139 gh:351 ic:gh
- #TODO: As a user I would like to add the github issue content to my TODO comment so that I can stay in the code while tracking my work. id:141 gh:354 ic:gh
Acceptance Criteria
----
- [ ] When a user creates a todo with no content and identifies a github issue with gh:123 then issue 123 should become the content of the TODO.

#TODO: As a user I would like to set email reminders from TODO comments in my code +feature +imdoneio id:143 gh:361 ic:gh
#DOING: As a user I would like the label on my github issue to change if I move a task to a different list. +feature +imdoneio id:144 gh:363 ic:gh
#DOING: Sort in file and save to project is broken +bug id:146 gh:374 ic:gh
- [ ] Come up with solution for tasks not integrated yet.  They need id's to be sorted.
- [ ] Maybe use the transform endpoint?  Create a transformer for tasks with no id
