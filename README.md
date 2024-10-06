# Courseomatic
 A javascript app to develop course storyboards. Using a drag and drop interface (with buttons as fallback) you can create:
 - courses, with learning outcomes that are mappable to program learning outcomes
 - units - weeks, or themes, or whatever
 - activities - these are the main elements of the system, represented as cards that can be dragged within and between units.
 - assessments - these are just activities that have been marked as assessments, with special fields for marking hours, pass marks, percentage of total marks

The app automatically calculates total study hours and total marking hours, shows proportions of time spent on different learning activity types, identifies outcomes that have not yet been assessed, and can generate a full course outline that can be used to develop the course itself.
 
It is intended to scaffold the course design process in a way that focuses on what learners will do and how they will learn, rather than what we intend to teach. What we intend to teach is specified in the learning outcomes and in the units (which have titles and descriptions but that are largely specified in terms of learning activities). Assessments are simply another activity type, with fields for weighting, pass mark, optionality, and projected marking time.

 The learning activity types are based on ABC Learning Design activity types, with the addition of reflection and cooperation to better support self-paced study (you don't have to use those if you don't like them).

## Limitations

Courseomatic is a single-user app that, on the bright side, needs no backend application server to run: changes are saved locally and can be exported and imported via JSoN files but only one person can work on a course design at a time. Note that the way it has been built, however, requires it to be run from a webserver: it needs HTTP so it cannot be run directly from the filesystem. It makes the code easier to maintain but I might refactor that at some point so that it is truly standalone.

A multi-user version may be developed later but, for now, the assumption is that it will be used by a single course designer, ideally in collaboration with a team, but there is one and only one master copy that can be shared but that cannot be edited by multiple users simultaneously.


 
 ## To do:
 - generate standard syllabus
 - remove dependency on http
 - allow different activity models, e.g. R2D2, Lewin, pure ABC, etc
- make multiple select possible to edit multiple activities at once (tricky interface)
- make multi-user

# licence: GPL3